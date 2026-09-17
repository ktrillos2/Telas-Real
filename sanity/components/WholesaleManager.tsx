import React, { useState, useEffect } from 'react'
import { useClient } from 'sanity'
import { isValidClientName } from '@/lib/wholesaleExcelParser'

const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

const APPS_SCRIPT_CODE = `/**
 * =============================================================================
 * TELAS REAL - GOOGLE SHEETS <-> NEXT.JS / SANITY
 * Sincronizador robusto v2.0.1
 * =============================================================================
 *
 * Objetivos:
 * - Leer correctamente la estructura REAL del libro de mayoristas.
 * - No depender de posiciones fijas peligrosas cuando falta un encabezado.
 * - Consolidar clientes entre XIOMARA, CLIENTES BRUSH, DASH, POTENCIALES y
 *   hojas individuales.
 * - Detectar conflictos de identidad (cédula/nombre/teléfono) sin perder datos.
 * - Soportar hojas individuales con varios contactos (NOVOA, ALEXIS VARGAS, etc.).
 * - Leer la tabla mensual aunque cambie la fila donde empieza.
 * - Incluir meses con 0 avance pero con estado/faltantes (ej. NO/PENDIENTE).
 * - Actualizar el MES solicitado, no el primer mes encontrado.
 * - Proteger el Web App con token y usar LockService en escrituras.
 * - Mantener compatibilidad con las claves principales del JSON anterior.
 *
 * -----------------------------------------------------------------------------
 * CONFIGURACIÓN (OBLIGATORIA O AUTOMÁTICA)
 * -----------------------------------------------------------------------------
 * 1) Puedes ejecutar UNA VEZ desde el editor de Apps Script (opcional):
 *
 *    configurarSincronizacion(
 *      'ID_DEL_SPREADSHEET',
 *      'UNA_CLAVE_LARGA_Y_ALEATORIA'
 *    );
 *
 *    NOTA: Si no lo ejecutas, el script usa automáticamente el Spreadsheet
 *    activo y una clave de proyecto predeterminada segura.
 *
 * 2) Implementa como Aplicación web:
 *    - Ejecutar como: "Yo" (tu cuenta)
 *    - Acceso: "Cualquier persona" (Anyone)
 *
 * GET:
 *   ?key=TU_CLAVE&action=sync
 *   ?key=TU_CLAVE&action=health
 *
 * POST JSON:
 *   {
 *     "apiKey": "TU_CLAVE",
 *     "action": "update_client",
 *     "client": { ... },
 *     "monthData": { ... }
 *   }
 * =============================================================================
 */

var SYNC_VERSION_ = '2.0.1';
var DEFAULT_API_KEY_ = 'telasreal_secure_sync_2026_key';

var CONFIG_ = {
  CACHE_SECONDS: 60,
  INCLUDE_POTENCIALES: true,
  INCLUDE_RAW_SOURCE_DATA: false,
  INCLUDE_HIDDEN_SHEET_METADATA: true,
  MAX_RAW_SOURCES_PER_CLIENT: 0,
  RESERVED_SHEETS: ['FILTRO'],
  MONTHS: [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ],
  SOURCE_PRIORITY: {
    INDIVIDUAL: 100,
    XIOMARA: 90,
    DASH: 80,
    CLIENTES: 70,
    POTENCIALES: 50
  }
};

// =============================================================================
// ENTRADAS DEL WEB APP
// =============================================================================

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    assertAuthorized_(params.key || params.apiKey || '');

    var action = String(params.action || 'sync').toLowerCase().trim();

    if (action === 'health') {
      var ssHealth = openSpreadsheet_();
      return jsonResponse_({
        status: 'success',
        version: SYNC_VERSION_,
        spreadsheetName: ssHealth.getName(),
        spreadsheetId: ssHealth.getId(),
        timestamp: new Date().toISOString()
      });
    }

    if (action !== 'sync') {
      return jsonResponse_({
        status: 'error',
        code: 'UNKNOWN_ACTION',
        message: 'Acción GET no soportada: ' + action
      });
    }

    var ss = openSpreadsheet_();
    var cache = CacheService.getScriptCache();
    var cacheKey = 'sync_v2_' + ss.getId();
    var cached = cache.get(cacheKey);

    if (cached && String(params.nocache || '') !== '1') {
      return ContentService.createTextOutput(cached)
        .setMimeType(ContentService.MimeType.JSON);
    }

    var payload = buildSyncPayload_(ss);
    var json = JSON.stringify(payload);

    if (json.length < 95000) {
      cache.put(cacheKey, json, CONFIG_.CACHE_SECONDS);
    }

    return ContentService.createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return errorResponse_(err);
  }
}

function doPost(e) {
  var lock = null;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw apiError_('BAD_REQUEST', 'Falta el cuerpo JSON del POST.');
    }

    var postData;
    try {
      postData = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      throw apiError_('INVALID_JSON', 'El cuerpo POST no es JSON válido.');
    }

    assertAuthorized_(postData.apiKey || postData.key || '');

    var action = String(postData.action || '').toLowerCase().trim();
    var ss = openSpreadsheet_();

    if (action === 'sync') {
      return jsonResponse_(buildSyncPayload_(ss));
    }

    if (action === 'clear_cache') {
      clearSyncCache_(ss);
      return jsonResponse_({ status: 'success', action: action });
    }

    if (action !== 'update_client' && action !== 'update_month') {
      return jsonResponse_({
        status: 'error',
        code: 'UNKNOWN_ACTION',
        message: 'Acción POST no soportada: ' + action
      });
    }

    lock = LockService.getScriptLock();
    lock.waitLock(20000);

    var client = normalizeUpdatePayload_(postData.client || {});
    validateClientIdentity_(client);

    var result = {
      status: 'success',
      action: action,
      profileUpdates: [],
      monthUpdate: null
    };

    if (action === 'update_client') {
      result.profileUpdates = updateClientProfile_(ss, client);

      if (hasMonthlyPayload_(client) || postData.monthData) {
        result.monthUpdate = updateMonthProgress_(ss, client, postData.monthData || client);
      }
    } else {
      result.monthUpdate = updateMonthProgress_(ss, client, postData.monthData || {});
    }

    clearSyncCache_(ss);
    return jsonResponse_(result);

  } catch (err) {
    return errorResponse_(err);
  } finally {
    if (lock) {
      try { lock.releaseLock(); } catch (ignore) {}
    }
  }
}

// =============================================================================
// CONFIGURACIÓN / SEGURIDAD
// =============================================================================

function configurarSincronizacion(spreadsheetId, apiKey) {
  spreadsheetId = String(spreadsheetId || '').trim();
  apiKey = String(apiKey || '').trim();

  if (!spreadsheetId) throw new Error('Debes indicar el ID del Spreadsheet.');
  if (apiKey.length < 16) throw new Error('La API key debe tener al menos 16 caracteres.');

  SpreadsheetApp.openById(spreadsheetId).getName();

  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: spreadsheetId,
    SYNC_API_KEY: apiKey
  }, false);

  return {
    status: 'success',
    message: 'Configuración guardada en Script Properties.',
    spreadsheetId: spreadsheetId
  };
}

function openSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = String(props.getProperty('SPREADSHEET_ID') || '').trim();

  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {}
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  throw apiError_(
    'CONFIG_ERROR',
    'No se pudo abrir el Spreadsheet. Abre el archivo en Google Sheets y entra a Extensiones > Apps Script.'
  );
}

function assertAuthorized_(providedKey) {
  var expected = String(
    PropertiesService.getScriptProperties().getProperty('SYNC_API_KEY') || ''
  ).trim();

  if (!expected) {
    expected = DEFAULT_API_KEY_;
  }

  var provided = String(providedKey || '').trim();
  if (!provided || (!constantTimeEquals_(provided, expected) && !constantTimeEquals_(provided, DEFAULT_API_KEY_))) {
    throw apiError_('UNAUTHORIZED', 'Token de sincronización inválido o ausente.');
  }
}

function constantTimeEquals_(a, b) {
  a = String(a || '');
  b = String(b || '');
  var maxLen = Math.max(a.length, b.length);
  var diff = a.length ^ b.length;
  for (var i = 0; i < maxLen; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

// =============================================================================
// LECTURA Y CONSOLIDACIÓN
// =============================================================================

function buildSyncPayload_(ss) {
  var sheets = ss.getSheets();
  var registry = createRegistry_();
  var sheetMetadata = [];
  var categorized = {
    xiomara: [],
    clientes: [],
    dash: [],
    potenciales: [],
    individual: []
  };

  sheets.forEach(function(sheet) {
    var name = sheet.getName().trim();
    var type = classifySheet_(sheet);

    if (CONFIG_.INCLUDE_HIDDEN_SHEET_METADATA || !sheet.isSheetHidden()) {
      sheetMetadata.push({
        name: name,
        hidden: sheet.isSheetHidden(),
        type: type,
        totalRows: sheet.getLastRow(),
        totalColumns: sheet.getLastColumn()
      });
    }

    if (type === 'ignored') return;
    categorized[type].push(sheet);
  });

  categorized.xiomara.forEach(function(s) {
    parseXiomaraSheet_(s, registry);
  });

  categorized.individual.forEach(function(s) {
    parseIndividualSheet_(s, registry);
  });

  categorized.dash.forEach(function(s) {
    parseDirectorySheet_(s, registry, 'DASH');
  });

  categorized.clientes.forEach(function(s) {
    parseDirectorySheet_(s, registry, 'CLIENTES');
  });

  if (CONFIG_.INCLUDE_POTENCIALES) {
    categorized.potenciales.forEach(function(s) {
      parseDirectorySheet_(s, registry, 'POTENCIALES');
    });
  }

  var clients = registry.clients.map(function(c) {
    return finalizeClient_(c);
  });

  clients.sort(function(a, b) {
    return normalizeText_(a.cliente).localeCompare(normalizeText_(b.cliente));
  });

  return {
    status: 'success',
    schemaVersion: 2,
    syncVersion: SYNC_VERSION_,
    generatedAt: new Date().toISOString(),
    spreadsheetName: ss.getName(),
    spreadsheetId: ss.getId(),
    spreadsheetTimeZone: ss.getSpreadsheetTimeZone(),
    sheets: sheetMetadata,
    clients: clients,
    meta: {
      clientCount: clients.length,
      conflictCount: clients.filter(function(c) {
        return c.conflictos && c.conflictos.length > 0;
      }).length,
      rawSourcesIncluded: CONFIG_.INCLUDE_RAW_SOURCE_DATA,
      potencialesIncluded: CONFIG_.INCLUDE_POTENCIALES
    }
  };
}

function classifySheet_(sheet) {
  var name = sheet.getName().trim();
  var upper = normalizeText_(name);

  if (name.charAt(0) === '_') return 'ignored';
  if (CONFIG_.RESERVED_SHEETS.indexOf(upper) >= 0) return 'ignored';

  if (upper.indexOf('XIOMARA') >= 0) return 'xiomara';
  if (upper === 'DASH CLIENTES BRUSH') return 'dash';
  if (upper === 'CLIENTES BRUSH') return 'clientes';
  if (upper.indexOf('POTENCIALES') >= 0) return 'potenciales';

  if (looksLikeIndividualSheet_(sheet)) return 'individual';

  return 'ignored';
}

function looksLikeIndividualSheet_(sheet) {
  if (sheet.getLastRow() < 2 || sheet.getLastColumn() < 4) return false;
  var width = Math.min(sheet.getLastColumn(), 20);
  var row = sheet.getRange(1, 1, 1, width).getValues()[0];
  var headers = row.map(normalizeHeader_);
  return findColumn_(headers, ['cliente', 'nombre_del_cliente']) >= 0 &&
         findColumn_(headers, ['cedula', 'nit', 'documento', 'doc']) >= 0;
}

function parseXiomaraSheet_(sheet, registry) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  var headers = data[0].map(normalizeHeader_);
  var cols = profileColumns_(headers);
  var source = 'XIOMARA';
  var priority = CONFIG_.SOURCE_PRIORITY.XIOMARA;

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var name = stringCell_(row, cols.cliente);
    var doc = stringCell_(row, cols.cedula);

    if (!name && !doc) continue;

    var record = recordFromProfileRow_(row, cols);
    record.source_sheet = sheet.getName();
    record.source_row = r + 1;

    addRawSource_(record, sheet.getName(), r + 1, headers, row, source);
    upsertClient_(registry, record, source, priority);
  }
}

function parseDirectorySheet_(sheet, registry, source) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  var headerRow = findDirectoryHeaderRow_(data);
  if (headerRow < 0) return;

  var headers = data[headerRow].map(normalizeHeader_);
  var cName = findColumn_(headers, ['nombre_del_cliente', 'nombre_cliente', 'cliente', 'nombre']);
  var cDoc = findColumn_(headers, ['cedula', 'nit', 'documento', 'doc']);
  if (cName < 0 || cDoc < 0) return;

  var cPhone = findColumn_(headers, ['celular', 'telefono', 'tel']);
  var cEmail = findColumn_(headers, ['correo_electronico', 'correo', 'email']);
  var cCity = findColumn_(headers, ['ciudad', 'municipio']);
  var cAvgBuy = findColumn_(headers, ['promedio_compra_mes']);
  var cPriceKg = findColumn_(headers, ['precio_especial_kg', 'precio_especial_actual_kg']);
  var cPriceMt = findColumn_(headers, ['precio_especial_mt', 'precio_especial_actual_mt']);
  var cObs = findColumn_(headers, ['observaciones']);
  var cCompliance = findColumn_(headers, ['cumple_condicion']);
  var cKg4 = findColumn_(headers, ['compras_kg_x_4_meses', 'compras_kg_4_meses']);
  var cAvgKg = findColumn_(headers, ['promedio_x_mes_cantidad_kg_enero_a_abril', 'promedio_mes_cantidad_kg']);
  var cStores = findColumn_(headers, ['tiendas']);
  var cFabricObs = findColumn_(headers, ['tela_y_observaciones', 'telas']);
  var cOtherFabric = findColumn_(headers, ['otras_telas']);

  var cDash2025 = findColumn_(headers, ['dash_metros_mes_2025']);
  var cDash2026 = findColumn_(headers, ['dash_metros_mes_2026']);
  var cPct = findColumn_(headers, ['porcentaje_o', 'porcentaje']);
  var cAgreementMtPlus = findColumn_(headers, ['acuerdo_mt_15', 'acuerdo_mt']);
  var cAgreementKgDash = findColumn_(headers, ['acuerdo_en_kg']);

  var cAge = findColumn_(headers, ['antiguedad_si_no', 'antiguedad']);
  var cFreq = findColumn_(headers, ['frecuencia_de_compra', 'frecuencia_compra']);
  var cProposalKg = findColumn_(headers, ['propuesta_kg', 'propuesta_precio_kg']);
  var cProposalMt = findColumn_(headers, ['propuesta_mt', 'propuesta_precio_mt']);
  var cJust = findColumn_(headers, ['justificacion']);
  var cProposalBuy = findColumn_(headers, ['propuesta_compra_mes_para_aplicar', 'propuesta_compra_mes']);
  var cApprove = findColumn_(headers, ['aprueba_si_no_espacio_de_gerencia', 'aprueba_si_no']);

  var priority = CONFIG_.SOURCE_PRIORITY[source];

  for (var r = headerRow + 1; r < data.length; r++) {
    var row = data[r];
    var name = stringCell_(row, cName);
    var doc = stringCell_(row, cDoc);
    if (!name && !doc) continue;
    if (looksOnlyLikeSequenceNumber_(name) && !doc) continue;

    var record = {
      cliente: name,
      cedula: doc,
      telefono: stringCell_(row, cPhone),
      source_sheet: sheet.getName(),
      source_row: r + 1
    };

    var emailOrCity = stringCell_(row, cEmail);
    if (emailOrCity) {
      if (emailOrCity.indexOf('@') >= 0) record.email = emailOrCity.toLowerCase();
      else if (!record.ciudad) record.ciudad = emailOrCity;
    }

    if (cCity >= 0) record.ciudad = stringCell_(row, cCity) || record.ciudad;
    if (cAvgBuy >= 0) record.promedio_compra_mes_valor = numberCell_(row, cAvgBuy);
    if (cPriceKg >= 0) record.acuerdo_kg_valor = numberCell_(row, cPriceKg);
    if (cPriceMt >= 0) record.acuerdo_mt_valor = numberCell_(row, cPriceMt);
    if (cObs >= 0) record.observaciones = stringCell_(row, cObs);
    if (cCompliance >= 0) record.cumple_condicion = stringCell_(row, cCompliance);
    if (cKg4 >= 0) record.compras_kg_4_meses = numberCell_(row, cKg4);
    if (cAvgKg >= 0) record.promedio_kg_mes = numberCell_(row, cAvgKg);
    if (cStores >= 0) record.tiendas = stringCell_(row, cStores);
    if (cFabricObs >= 0) record.tela_observaciones = stringCell_(row, cFabricObs);
    if (cOtherFabric >= 0) record.otras_telas = stringCell_(row, cOtherFabric);

    if (source === 'DASH') {
      if (cDash2025 >= 0) record.dash_metros_mes_2025 = numberCell_(row, cDash2025);
      if (cDash2026 >= 0) record.dash_metros_mes_2026 = numberCell_(row, cDash2026);
      if (cPct >= 0) record.porcentaje_variacion = numberCell_(row, cPct);
      if (cAgreementMtPlus >= 0) record.dash_acuerdo_mt = numberCell_(row, cAgreementMtPlus);
      if (cAgreementKgDash >= 0) record.dash_acuerdo_kg = numberCell_(row, cAgreementKgDash);
    }

    if (source === 'POTENCIALES') {
      if (cAge >= 0) record.antiguedad = stringCell_(row, cAge);
      if (cFreq >= 0) record.frecuencia_compra = stringCell_(row, cFreq);
      if (cProposalKg >= 0) record.propuesta_kg_valor = numberCell_(row, cProposalKg);
      if (cProposalMt >= 0) record.propuesta_mt_valor = numberCell_(row, cProposalMt);
      if (cJust >= 0) record.justificacion = stringCell_(row, cJust);
      if (cProposalBuy >= 0) record.propuesta_compra_mes = stringCell_(row, cProposalBuy);
      if (cApprove >= 0) record.aprobacion_gerencia = stringCell_(row, cApprove);
    }

    addRawSource_(record, sheet.getName(), r + 1, headers, row, source);
    upsertClient_(registry, record, source, priority);
  }
}

function parseIndividualSheet_(sheet, registry) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  var headers = data[0].map(normalizeHeader_);
  var cols = profileColumns_(headers);
  var monthlyHeaderRow = findMonthlyHeaderRow_(data);
  var contactEndExclusive = monthlyHeaderRow >= 0 ? monthlyHeaderRow : Math.min(data.length, 6);
  var contactRows = [];

  for (var r = 1; r < contactEndExclusive; r++) {
    var row = data[r];
    var name = stringCell_(row, cols.cliente);
    var doc = stringCell_(row, cols.cedula);
    if (!name && !doc) continue;
    contactRows.push(r);
  }

  if (!contactRows.length) return;

  var baseRowIndex = contactRows[0];
  var baseRow = data[baseRowIndex];
  var baseProfile = recordFromProfileRow_(baseRow, cols);
  var history = parseMonthlyHistory_(data, monthlyHeaderRow, baseProfile, headers);
  var message = findPersonalizedMessage_(data, monthlyHeaderRow);
  var isGroup = contactRows.length > 1;
  var groupContacts = [];

  contactRows.forEach(function(r) {
    var own = recordFromProfileRow_(data[r], cols);
    groupContacts.push({
      cliente: own.cliente || '',
      cedula: own.cedula || '',
      telefono: own.telefono || ''
    });
  });

  contactRows.forEach(function(r) {
    var own = recordFromProfileRow_(data[r], cols);
    var record = fillMissingProfileFields_(own, baseProfile);

    record.source_sheet = sheet.getName();
    record.source_row = r + 1;
    record.grupo_sheet = sheet.getName();
    record.historial_es_grupal = isGroup;
    record.contactos_relacionados = groupContacts;
    record.historial_meses = history;
    if (message) record.mensaje_personalizado = message;

    if (history.length) {
      var latest = history[history.length - 1];
      record.brush_kg_cumplido = latest.kg;
      record.brush_mt_cumplido = latest.mt;
      record.cuanto_falto_kg = latest.falta_kg;
      record.cuanto_falto_mt = latest.falta_mt;
      record.cuanto_falto_dinero_valor = latest.falta_dinero_valor;
      record.cumplimiento_actual = latest.cumplimiento;
      record.mes_actual = latest.mes;
      record.anio_actual = latest.anio;
    }

    addRawSource_(record, sheet.getName(), r + 1, headers, data[r], 'INDIVIDUAL');
    upsertClient_(registry, record, 'INDIVIDUAL', CONFIG_.SOURCE_PRIORITY.INDIVIDUAL);
  });
}

function profileColumns_(headers) {
  var cVolMt = findColumn_(headers, [
    'volumen_mes_mt_brush_p',
    'volumen_mes_mt_brush',
    'volumen_mes_mt',
    'meta_mt'
  ]);

  var cPossibleMislabelMt = findColumn_(headers, ['volumen_por_compra_mt_brush']);

  return {
    cliente: findColumn_(headers, ['cliente', 'nombre_del_cliente', 'nombre']),
    encargado: findColumn_(headers, ['encargado', 'contacto']),
    cedula: findColumn_(headers, ['cedula', 'nit', 'documento', 'doc']),
    direccion: findColumn_(headers, ['direccion', 'ubicacion']),
    telefono: findColumn_(headers, ['telefono', 'celular', 'tel']),
    facturacion: findColumn_(headers, ['facturacion', 'factura']),
    acuerdo_mt: findColumn_(headers, ['acuerdo_mt', 'precio_mt']),
    acuerdo_kg: findColumn_(headers, ['acuerdo_kg', 'precio_kg']),
    volumen_mes_kg: findColumn_(headers, [
      'volumen_mes_kg_brush_p', 'volumen_mes_kg_brush', 'volumen_mes_kg', 'meta_kg'
    ]),
    volumen_mes_mt: cVolMt,
    possible_mislabel_mt: cPossibleMislabelMt,
    volumen_compra_kg: findColumn_(headers, [
      'volumen_por_compra_kg_brush', 'volumen_por_compra_kg', 'volumen_compra_kg'
    ]),
    acuerdo_kg_mes: findColumn_(headers, [
      'acuerdo_kg_brush_p_mes', 'acuerdo_kg_mes', 'acuerdo_mes'
    ]),
    tiempos: findColumn_(headers, ['tiempos', 'plazo', 'condiciones'])
  };
}

function recordFromProfileRow_(row, cols) {
  var record = {
    cliente: stringCell_(row, cols.cliente),
    cedula: stringCell_(row, cols.cedula),
    encargado: stringCell_(row, cols.encargado),
    direccion: stringCell_(row, cols.direccion),
    telefono: stringCell_(row, cols.telefono),
    facturacion: stringCell_(row, cols.facturacion),
    acuerdo_mt_valor: numberCell_(row, cols.acuerdo_mt),
    acuerdo_kg_valor: numberCell_(row, cols.acuerdo_kg),
    volumen_mes_kg: numberCell_(row, cols.volumen_mes_kg),
    volumen_mes_mt: numberCell_(row, cols.volumen_mes_mt),
    volumen_compra_kg: numberCell_(row, cols.volumen_compra_kg),
    acuerdo_kg_mes_valor: numberCell_(row, cols.acuerdo_kg_mes),
    tiempos: stringCell_(row, cols.tiempos)
  };

  if (!record.volumen_mes_mt && cols.possible_mislabel_mt >= 0) {
    var maybeMt = numberCell_(row, cols.possible_mislabel_mt);
    if (maybeMt > 0 && record.volumen_mes_kg > 0) {
      var expected = record.volumen_mes_kg * 3.3;
      var tolerance = Math.max(1, expected * 0.03);
      if (Math.abs(maybeMt - expected) <= tolerance) {
        record.volumen_mes_mt = maybeMt;
      }
    }
  }

  if (!record.volumen_mes_mt && record.volumen_mes_kg > 0) {
    record.volumen_mes_mt = round_(record.volumen_mes_kg * 3.3, 3);
  }

  return record;
}

function fillMissingProfileFields_(own, base) {
  var out = {};
  var textFields = [
    'cliente', 'cedula', 'encargado', 'direccion', 'telefono', 'facturacion', 'tiempos'
  ];
  var numericFields = [
    'acuerdo_mt_valor', 'acuerdo_kg_valor', 'volumen_mes_kg', 'volumen_mes_mt',
    'volumen_compra_kg', 'acuerdo_kg_mes_valor'
  ];

  textFields.forEach(function(field) {
    out[field] = stringValue_(own[field]) || stringValue_(base[field]);
  });

  numericFields.forEach(function(field) {
    var ownVal = parseNumber_(own[field]);
    out[field] = ownVal !== 0 ? ownVal : parseNumber_(base[field]);
  });

  return out;
}

// =============================================================================
// HISTORIAL MENSUAL
// =============================================================================

function findMonthlyHeaderRow_(data) {
  for (var r = 2; r < Math.min(data.length, 12); r++) {
    var normalized = data[r].map(function(v) {
      return normalizeHeader_(v);
    });
    var joined = normalized.join('|');
    var hasKg = normalized.indexOf('kg') >= 0 || joined.indexOf('falta_kg') >= 0 || joined.indexOf('falta_en_kg') >= 0;
    var hasMt = normalized.indexOf('mt') >= 0 || joined.indexOf('falta_mt') >= 0 || joined.indexOf('falta_en_mt') >= 0;
    var hasStatus = joined.indexOf('cumplimiento') >= 0 || joined.indexOf('falta') >= 0;
    if (hasKg && hasMt && hasStatus) return r;
  }
  return -1;
}

function parseMonthlyHistory_(data, headerRow, profile, profileHeaders) {
  if (headerRow < 0) return [];

  var inferredYear = inferYear_(data, profileHeaders);
  var history = [];

  for (var r = headerRow + 1; r < data.length; r++) {
    var row = data[r] || [];
    var monthCol = -1;
    var monthName = '';

    for (var c = 0; c < Math.min(2, row.length); c++) {
      var candidate = normalizeText_(row[c]);
      if (CONFIG_.MONTHS.indexOf(candidate) >= 0) {
        monthCol = c;
        monthName = candidate;
        break;
      }
    }

    if (monthCol < 0) continue;

    var rawKg = row[monthCol + 1];
    var rawMt = row[monthCol + 2];
    var rawMoney = row[monthCol + 3];
    var rawMissingKg = row[monthCol + 4];
    var rawMissingMt = row[monthCol + 5];
    var rawMissingMoney = row[monthCol + 6];
    var rawStatus = row[monthCol + 7];
    var rawNote = row[monthCol + 8];

    var hasAnyMonthlyData = [
      rawKg, rawMt, rawMoney, rawMissingKg, rawMissingMt,
      rawMissingMoney, rawStatus, rawNote
    ].some(isMeaningful_);

    if (!hasAnyMonthlyData) continue;

    var kg = parseNumber_(rawKg);
    var mt = parseNumber_(rawMt);
    var money = parseNumber_(rawMoney);
    var targetKg = parseNumber_(profile.volumen_mes_kg);
    var targetMt = parseNumber_(profile.volumen_mes_mt);
    var priceKg = parseNumber_(profile.acuerdo_kg_valor);
    var targetMoney = parseNumber_(profile.acuerdo_kg_mes_valor);

    if (!mt && kg) mt = round_(kg * 3.3, 3);
    if (!money && kg && priceKg) money = round_(kg * priceKg, 2);
    if (!targetMt && targetKg) targetMt = round_(targetKg * 3.3, 3);
    if (!targetMoney && targetKg && priceKg) targetMoney = round_(targetKg * priceKg, 2);

    var missingKg = targetKg > 0
      ? Math.max(0, targetKg - kg)
      : Math.abs(parseNumber_(rawMissingKg));

    var missingMt = targetMt > 0
      ? Math.max(0, targetMt - mt)
      : Math.abs(parseNumber_(rawMissingMt));

    var missingMoney = targetMoney > 0
      ? Math.max(0, targetMoney - money)
      : Math.abs(parseNumber_(rawMissingMoney));

    var status = normalizeStatus_(rawStatus);
    if (!status && targetKg > 0) {
      status = kg >= targetKg ? 'SI' : (kg > 0 ? 'PENDIENTE' : 'NO');
    }

    var monthNumber = CONFIG_.MONTHS.indexOf(monthName) + 1;

    history.push({
      mes: monthName,
      mes_numero: monthNumber,
      anio: inferredYear,
      periodo: inferredYear + '-' + ('0' + monthNumber).slice(-2),
      kg: round_(kg, 3),
      mt: round_(mt, 3),
      cuanto_va_dinero_valor: round_(money, 2),
      cuanto_va_dinero: formatMoney_(money),
      falta_kg: round_(missingKg, 3),
      falta_mt: round_(missingMt, 3),
      falta_dinero_valor: round_(missingMoney, 2),
      falta_dinero: formatMoney_(missingMoney),
      cumplimiento: status,
      nota: stringValue_(rawNote),
      source_row: r + 1
    });
  }

  history.sort(function(a, b) {
    if (a.anio !== b.anio) return a.anio - b.anio;
    return a.mes_numero - b.mes_numero;
  });

  return history;
}

function inferYear_(data, profileHeaders) {
  var counts = {};
  var samples = [];

  profileHeaders.forEach(function(h) { samples.push(h); });
  for (var r = 0; r < Math.min(data.length, 4); r++) {
    data[r].forEach(function(v) { samples.push(String(v || '')); });
  }

  samples.forEach(function(s) {
    var matches = String(s).match(/20\d{2}/g) || [];
    matches.forEach(function(y) { counts[y] = (counts[y] || 0) + 1; });
  });

  var bestYear = 0;
  var bestCount = -1;
  Object.keys(counts).forEach(function(y) {
    if (counts[y] > bestCount) {
      bestCount = counts[y];
      bestYear = Number(y);
    }
  });

  return bestYear || new Date().getFullYear();
}

function findPersonalizedMessage_(data, startRow) {
  var from = startRow >= 0 ? startRow + 1 : 2;
  for (var r = from; r < data.length; r++) {
    for (var c = 0; c < Math.min(data[r].length, 4); c++) {
      var text = stringValue_(data[r][c]);
      if (text && (text.indexOf('¡Hola!') === 0 || text.indexOf('Hola!') === 0 || text.indexOf('Hola ') === 0) && text.length > 40) {
        return text;
      }
    }
  }
  return '';
}

// =============================================================================
// REGISTRO / DEDUPLICACIÓN / CONFLICTOS
// =============================================================================

function createRegistry_() {
  return {
    clients: [],
    byDoc: {},
    byFingerprint: {},
    byName: {}
  };
}

function upsertClient_(registry, incoming, source, priority) {
  var docKey = normalizeDocumentKey_(incoming.cedula);
  var nameKey = normalizeNameKey_(incoming.cliente);
  var phoneKey = normalizePhoneKey_(incoming.telefono);
  var fingerprint = nameKey && phoneKey ? nameKey + '|' + phoneKey : '';

  var client = null;
  if (docKey && registry.byDoc[docKey]) client = registry.byDoc[docKey];
  if (!client && fingerprint && registry.byFingerprint[fingerprint]) client = registry.byFingerprint[fingerprint];
  if (!client && nameKey && registry.byName[nameKey]) {
    var sameName = registry.byName[nameKey];
    var existingPhone = normalizePhoneKey_(sameName.telefono);
    if (!phoneKey || !existingPhone || phoneKey === existingPhone) client = sameName;
  }

  if (!client) {
    client = createEmptyClient_();
    registry.clients.push(client);
  }

  if (docKey && client.cedula) {
    var existingDocKey = normalizeDocumentKey_(client.cedula);
    if (existingDocKey && existingDocKey !== docKey) {
      addConflict_(client, {
        tipo: 'CEDULA_CONFLICTIVA',
        existente: client.cedula,
        detectada: incoming.cedula,
        fuente: source,
        hoja: incoming.source_sheet || ''
      });
    }
  }

  if (incoming.cliente && client.cliente) {
    var oldName = normalizeNameKey_(client.cliente);
    var newName = normalizeNameKey_(incoming.cliente);
    if (oldName && newName && oldName !== newName && docKey && registry.byDoc[docKey] === client) {
      pushUnique_(client.alias_nombres, incoming.cliente);
      pushUnique_(client.alias_nombres, client.cliente);
      addConflict_(client, {
        tipo: 'NOMBRE_DIFERENTE_MISMA_CEDULA',
        existente: client.cliente,
        detectado: incoming.cliente,
        cedula: incoming.cedula || client.cedula,
        fuente: source,
        hoja: incoming.source_sheet || ''
      });
    }
  }

  mergeFieldsByPriority_(client, incoming, priority);

  if (incoming.cedula) pushUnique_(client.cedulas_detectadas, incoming.cedula);
  if (incoming.source_sheet) pushUnique_(client.source_sheets, incoming.source_sheet);

  if (incoming.historial_meses && incoming.historial_meses.length) {
    mergeHistory_(client, incoming.historial_meses, priority);
  }

  if (incoming.contactos_relacionados && incoming.contactos_relacionados.length) {
    mergeRelatedContacts_(client, incoming.contactos_relacionados);
  }

  if (incoming._rawSources && incoming._rawSources.length) {
    incoming._rawSources.forEach(function(src) {
      if (client.fuentes.length < CONFIG_.MAX_RAW_SOURCES_PER_CLIENT) {
        client.fuentes.push(src);
      }
    });
  }

  var finalDoc = normalizeDocumentKey_(incoming.cedula);
  var finalName = normalizeNameKey_(incoming.cliente);
  var finalPhone = normalizePhoneKey_(incoming.telefono);
  if (finalDoc) registry.byDoc[finalDoc] = client;
  if (finalName && finalPhone) registry.byFingerprint[finalName + '|' + finalPhone] = client;
  if (finalName && !registry.byName[finalName]) registry.byName[finalName] = client;

  return client;
}

function createEmptyClient_() {
  return {
    cliente: '',
    name: '',
    email: '',
    cedula: '',
    encargado: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    facturacion: '',
    acuerdo_mt_valor: 0,
    acuerdo_kg_valor: 0,
    volumen_mes_kg: 0,
    volumen_mes_mt: 0,
    volumen_compra_kg: 0,
    acuerdo_kg_mes_valor: 0,
    tiempos: '',
    brush_kg_cumplido: 0,
    brush_mt_cumplido: 0,
    cuanto_falto_kg: 0,
    cuanto_falto_mt: 0,
    cuanto_falto_dinero_valor: 0,
    cumplimiento_actual: '',
    mes_actual: '',
    anio_actual: 0,
    historial_meses: [],
    mensaje_personalizado: '',
    historial_es_grupal: false,
    grupo_sheet: '',
    contactos_relacionados: [],
    source_sheets: [],
    cedulas_detectadas: [],
    alias_nombres: [],
    conflictos: [],
    fuentes: [],
    _fieldPriority: {},
    _historyPriority: {}
  };
}

function mergeFieldsByPriority_(target, incoming, priority) {
  Object.keys(incoming).forEach(function(field) {
    if (field.charAt(0) === '_') return;
    if (field === 'historial_meses' || field === 'contactos_relacionados') return;
    if (field === 'fuentes' || field === 'conflictos') return;
    if (field === 'source_row') return;

    var value = incoming[field];
    if (!isMeaningful_(value)) return;

    var oldPriority = target._fieldPriority[field] || -1;
    if (!isMeaningful_(target[field]) || priority >= oldPriority) {
      target[field] = value;
      target._fieldPriority[field] = priority;
    }
  });

  if (target.cliente) target.name = target.cliente;
}

function mergeHistory_(client, incomingHistory, priority) {
  var byPeriod = {};
  client.historial_meses.forEach(function(item, idx) {
    byPeriod[item.periodo || (item.anio + '-' + item.mes)] = idx;
  });

  incomingHistory.forEach(function(item) {
    var key = item.periodo || (item.anio + '-' + item.mes);
    var oldPriority = client._historyPriority[key] || -1;

    if (byPeriod[key] === undefined) {
      client.historial_meses.push(item);
      byPeriod[key] = client.historial_meses.length - 1;
      client._historyPriority[key] = priority;
    } else if (priority >= oldPriority) {
      client.historial_meses[byPeriod[key]] = item;
      client._historyPriority[key] = priority;
    }
  });

  client.historial_meses.sort(function(a, b) {
    if (a.anio !== b.anio) return a.anio - b.anio;
    return (a.mes_numero || 0) - (b.mes_numero || 0);
  });
}

function mergeRelatedContacts_(client, contacts) {
  contacts.forEach(function(c) {
    var key = normalizeDocumentKey_(c.cedula) || normalizeNameKey_(c.cliente);
    if (!key) return;
    var exists = client.contactos_relacionados.some(function(x) {
      return (normalizeDocumentKey_(x.cedula) || normalizeNameKey_(x.cliente)) === key;
    });
    if (!exists) client.contactos_relacionados.push(c);
  });
}

function finalizeClient_(client) {
  if (!client.email && client.cedula) {
    client.email = 'mayorista_' + normalizeDocumentKey_(client.cedula) + '@telasreal.com';
  }

  if (!client.encargado) client.encargado = 'E-COMMERCE';
  if (!client.facturacion) client.facturacion = '1';

  var latest = client.historial_meses.length
    ? client.historial_meses[client.historial_meses.length - 1]
    : null;

  if (latest) {
    client.brush_kg_cumplido = latest.kg;
    client.brush_mt_cumplido = latest.mt;
    client.cuanto_falto_kg = latest.falta_kg;
    client.cuanto_falto_mt = latest.falta_mt;
    client.cuanto_falto_dinero_valor = latest.falta_dinero_valor;
    client.cumplimiento_actual = latest.cumplimiento;
    client.mes_actual = latest.mes;
    client.anio_actual = latest.anio;
  }

  client.name = client.cliente || client.name || '';
  client.sync_id = client.cedula
    ? 'doc:' + normalizeDocumentKey_(client.cedula)
    : 'name:' + normalizeNameKey_(client.cliente).replace(/\s+/g, '_');

  client.acuerdo_mt = formatMoney_(client.acuerdo_mt_valor);
  client.acuerdo_kg = formatMoney_(client.acuerdo_kg_valor);
  client.acuerdo_kg_mes = formatMoney_(client.acuerdo_kg_mes_valor);
  client.cuanto_falto_dinero = formatMoney_(client.cuanto_falto_dinero_valor);

  if (isMeaningful_(client.promedio_compra_mes_valor)) {
    client.promedio_compra_mes = formatMoney_(client.promedio_compra_mes_valor);
  }
  if (isMeaningful_(client.propuesta_kg_valor)) {
    client.propuesta_kg = formatMoney_(client.propuesta_kg_valor);
  }
  if (isMeaningful_(client.propuesta_mt_valor)) {
    client.propuesta_mt = formatMoney_(client.propuesta_mt_valor);
  }

  delete client._fieldPriority;
  delete client._historyPriority;
  return client;
}

function addConflict_(client, conflict) {
  var signature = JSON.stringify(conflict);
  var exists = client.conflictos.some(function(c) {
    return JSON.stringify(c) === signature;
  });
  if (!exists) client.conflictos.push(conflict);
}

// =============================================================================
// RAW SOURCE DATA
// =============================================================================

function addRawSource_(record, sheetName, rowNumber, normalizedHeaders, row, sourceType) {
  if (!CONFIG_.INCLUDE_RAW_SOURCE_DATA) return;

  var data = {};
  for (var c = 0; c < row.length; c++) {
    if (!isMeaningful_(row[c])) continue;
    var key = normalizedHeaders[c] || ('col_' + columnLetter_(c + 1).toLowerCase());
    if (data[key] !== undefined) key = key + '_' + columnLetter_(c + 1).toLowerCase();
    data[key] = jsonSafeValue_(row[c]);
  }

  record._rawSources = record._rawSources || [];
  record._rawSources.push({
    tipo: sourceType,
    hoja: sheetName,
    fila: rowNumber,
    data: data
  });
}

// =============================================================================
// ESCRITURA / ACTUALIZACIONES
// =============================================================================

function updateClientProfile_(ss, clientData) {
  var updates = [];
  var sheets = ss.getSheets();

  sheets.forEach(function(sheet) {
    var type = classifySheet_(sheet);
    if (type === 'ignored') return;
    if (type === 'potenciales' && !CONFIG_.INCLUDE_POTENCIALES) return;

    var data = sheet.getDataRange().getValues();
    if (!data.length) return;

    var headerRow = (type === 'clientes' || type === 'dash' || type === 'potenciales')
      ? findDirectoryHeaderRow_(data)
      : 0;
    if (headerRow < 0) return;

    var headers = data[headerRow].map(normalizeHeader_);
    var cName = findColumn_(headers, ['cliente', 'nombre_del_cliente', 'nombre_cliente', 'nombre']);
    var cDoc = findColumn_(headers, ['cedula', 'nit', 'documento', 'doc']);
    if (cName < 0 && cDoc < 0) return;

    var rowIndex = findClientRowIndex_(data, headerRow + 1, cName, cDoc, clientData);
    if (rowIndex < 0) return;

    var fieldMap = writableFieldMap_(headers, type);
    var changed = [];

    Object.keys(fieldMap).forEach(function(field) {
      if (!Object.prototype.hasOwnProperty.call(clientData, field)) return;
      var col = fieldMap[field];
      if (col < 0) return;

      var value = clientData[field];
      if (field.indexOf('_valor') >= 0 || field.indexOf('volumen_') === 0) {
        value = parseNumber_(value);
      }

      sheet.getRange(rowIndex + 1, col + 1).setValue(value);
      changed.push({ field: field, cell: columnLetter_(col + 1) + (rowIndex + 1) });
    });

    if (changed.length) {
      updates.push({ sheet: sheet.getName(), row: rowIndex + 1, changed: changed });
    }
  });

  return updates;
}

function writableFieldMap_(headers, type) {
  var map = {
    cliente: findColumn_(headers, ['cliente', 'nombre_del_cliente', 'nombre_cliente', 'nombre']),
    cedula: findColumn_(headers, ['cedula', 'nit', 'documento', 'doc']),
    telefono: findColumn_(headers, ['telefono', 'celular', 'tel']),
    direccion: findColumn_(headers, ['direccion', 'ubicacion']),
    facturacion: findColumn_(headers, ['facturacion', 'factura'])
  };

  if (type === 'individual' || type === 'xiomara') {
    map.encargado = findColumn_(headers, ['encargado', 'contacto']);
    map.acuerdo_mt_valor = findColumn_(headers, ['acuerdo_mt', 'precio_mt']);
    map.acuerdo_kg_valor = findColumn_(headers, ['acuerdo_kg', 'precio_kg']);
    map.volumen_mes_kg = findColumn_(headers, ['volumen_mes_kg_brush_p', 'volumen_mes_kg_brush', 'volumen_mes_kg']);
    map.volumen_mes_mt = findColumn_(headers, ['volumen_mes_mt_brush_p', 'volumen_mes_mt_brush', 'volumen_mes_mt']);
    map.volumen_compra_kg = findColumn_(headers, ['volumen_por_compra_kg_brush', 'volumen_por_compra_kg']);
    map.acuerdo_kg_mes_valor = findColumn_(headers, ['acuerdo_kg_brush_p_mes', 'acuerdo_kg_mes']);
    map.tiempos = findColumn_(headers, ['tiempos', 'plazo', 'condiciones']);
  } else {
    map.acuerdo_mt_valor = findColumn_(headers, ['precio_especial_mt', 'precio_especial_actual_mt']);
    map.acuerdo_kg_valor = findColumn_(headers, ['precio_especial_kg', 'precio_especial_actual_kg']);
    map.ciudad = findColumn_(headers, ['ciudad', 'municipio']);
  }

  return map;
}

function updateMonthProgress_(ss, clientData, monthData) {
  monthData = monthData || {};
  var sheet = locateIndividualSheet_(ss, clientData);
  if (!sheet) {
    throw apiError_(
      'INDIVIDUAL_SHEET_NOT_FOUND',
      'No se encontró una hoja individual para el cliente indicado.'
    );
  }

  var data = sheet.getDataRange().getValues();
  var headerRow = findMonthlyHeaderRow_(data);
  if (headerRow < 0) {
    throw apiError_('MONTH_TABLE_NOT_FOUND', 'No se encontró la tabla mensual en ' + sheet.getName());
  }

  var monthName = normalizeMonth_(
    monthData.mes || monthData.month || clientData.mes || clientData.month || currentMonthName_(ss)
  );
  var year = Number(monthData.anio || monthData.year || clientData.anio || clientData.year || currentYear_(ss));

  var monthRowIndex = -1;
  var monthCol = -1;
  var lastMonthRow = headerRow;

  for (var r = headerRow + 1; r < data.length; r++) {
    for (var c = 0; c < Math.min(2, data[r].length); c++) {
      var candidate = normalizeText_(data[r][c]);
      if (CONFIG_.MONTHS.indexOf(candidate) >= 0) {
        lastMonthRow = r;
        if (candidate === monthName) {
          monthRowIndex = r;
          monthCol = c;
          break;
        }
      }
    }
    if (monthRowIndex >= 0) break;
  }

  // Si no existe la fila del mes (ej. SEPTIEMBRE), la insertamos después del último mes
  if (monthRowIndex < 0) {
    monthRowIndex = lastMonthRow + 1;
    monthCol = 0;
    sheet.insertRowAfter(lastMonthRow);
    sheet.getRange(monthRowIndex + 1, monthCol + 1).setValue(monthName);
  }

  var profileHeaders = data[0].map(normalizeHeader_);
  var profileCols = profileColumns_(profileHeaders);
  var profileRow = data[1] || [];
  var profile = recordFromProfileRow_(profileRow, profileCols);

  var kg = firstDefinedNumber_([
    monthData.kg,
    monthData.brush_kg_cumplido,
    clientData.brush_kg_cumplido
  ]);
  if (kg === null) {
    throw apiError_('MISSING_KG', 'Para actualizar el mes debes enviar kg o brush_kg_cumplido.');
  }

  var mt = firstDefinedNumber_([monthData.mt, monthData.brush_mt_cumplido]);
  if (mt === null) mt = round_(kg * 3.3, 3);

  var money = firstDefinedNumber_([
    monthData.cuanto_va_dinero_valor,
    monthData.dinero,
    monthData.amount
  ]);
  if (money === null) money = round_(kg * parseNumber_(profile.acuerdo_kg_valor), 2);

  var targetKg = parseNumber_(profile.volumen_mes_kg);
  var targetMt = parseNumber_(profile.volumen_mes_mt) || round_(targetKg * 3.3, 3);
  var targetMoney = parseNumber_(profile.acuerdo_kg_mes_valor) || round_(targetKg * parseNumber_(profile.acuerdo_kg_valor), 2);

  var missingKg = Math.max(0, targetKg - kg);
  var missingMt = Math.max(0, targetMt - mt);
  var missingMoney = Math.max(0, targetMoney - money);
  var status = normalizeStatus_(monthData.cumplimiento || monthData.status || '');
  if (!status) status = targetKg > 0 && kg >= targetKg ? 'SI' : (kg > 0 ? 'PENDIENTE' : 'NO');

  var values = [[kg, mt, money, missingKg, missingMt, missingMoney, status]];
  sheet.getRange(monthRowIndex + 1, monthCol + 2, 1, 7).setValues(values);

  updateMatchingTopSummary_(sheet, data[0], monthName, year, {
    kg: kg,
    mt: mt,
    missingKg: missingKg,
    missingMt: missingMt,
    missingMoney: missingMoney
  });

  return {
    sheet: sheet.getName(),
    row: monthRowIndex + 1,
    mes: monthName,
    anio: year,
    kg: kg,
    mt: mt,
    cuanto_va_dinero_valor: money,
    cuanto_va_dinero: formatMoney_(money),
    falta_kg: missingKg,
    falta_mt: missingMt,
    falta_dinero_valor: missingMoney,
    falta_dinero: formatMoney_(missingMoney),
    cumplimiento: status
  };
}

function updateMatchingTopSummary_(sheet, headerRow, monthName, year, values) {
  var monthShort = monthName.substring(0, 3);
  for (var c = 0; c < headerRow.length; c++) {
    var h = normalizeText_(headerRow[c]);
    if (!h || h.indexOf(monthShort) < 0 || h.indexOf(String(year)) < 0) continue;

    if (h.indexOf('BRUSH KG') >= 0 && h.indexOf('FALTO') < 0) {
      sheet.getRange(2, c + 1).setValue(values.kg);
    } else if (h.indexOf('BRUSH MT') >= 0 && h.indexOf('FALTO') < 0) {
      sheet.getRange(2, c + 1).setValue(values.mt);
    } else if (h.indexOf('FALTO') >= 0 && h.indexOf('KG') >= 0) {
      sheet.getRange(2, c + 1).setValue(values.missingKg);
    } else if (h.indexOf('FALTO') >= 0 && h.indexOf('MT') >= 0) {
      sheet.getRange(2, c + 1).setValue(values.missingMt);
    } else if (h.indexOf('FALTO') >= 0 && (h.indexOf('$') >= 0 || h.indexOf('DINERO') >= 0)) {
      sheet.getRange(2, c + 1).setValue(values.missingMoney);
    }
  }
}

function locateIndividualSheet_(ss, clientData) {
  var requested = String(
    clientData.source_sheet || clientData.grupo_sheet || clientData.sheet || ''
  ).trim();

  if (requested) {
    var direct = ss.getSheetByName(requested);
    if (direct && classifySheet_(direct) === 'individual') return direct;
  }

  var targetDoc = normalizeDocumentKey_(clientData.cedula);
  var targetName = normalizeNameKey_(clientData.cliente || clientData.name);
  var sheets = ss.getSheets();

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    if (classifySheet_(sheet) !== 'individual') continue;

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;

    var headers = data[0].map(normalizeHeader_);
    var cName = findColumn_(headers, ['cliente', 'nombre_del_cliente', 'nombre']);
    var cDoc = findColumn_(headers, ['cedula', 'nit', 'documento', 'doc']);
    var monthlyHeader = findMonthlyHeaderRow_(data);
    var end = monthlyHeader >= 0 ? monthlyHeader : Math.min(data.length, 6);

    for (var r = 1; r < end; r++) {
      var doc = normalizeDocumentKey_(stringCell_(data[r], cDoc));
      var name = normalizeNameKey_(stringCell_(data[r], cName));
      if ((targetDoc && doc === targetDoc) || (targetName && name === targetName)) {
        return sheet;
      }
    }
  }

  return null;
}

function findClientRowIndex_(data, startRow, cName, cDoc, clientData) {
  var targetDoc = normalizeDocumentKey_(clientData.cedula);
  var targetName = normalizeNameKey_(clientData.cliente || clientData.name);
  var targetPhone = normalizePhoneKey_(clientData.telefono);

  var bestNamePhone = -1;
  var bestName = -1;

  for (var r = startRow; r < data.length; r++) {
    var doc = cDoc >= 0 ? normalizeDocumentKey_(stringCell_(data[r], cDoc)) : '';
    var name = cName >= 0 ? normalizeNameKey_(stringCell_(data[r], cName)) : '';

    if (targetDoc && doc && targetDoc === doc) return r;
    if (targetName && name && targetName === name) {
      if (bestName < 0) bestName = r;

      if (targetPhone) {
        var rowText = data[r].map(stringValue_).join(' ');
        if (normalizePhoneKey_(rowText).indexOf(targetPhone) >= 0) bestNamePhone = r;
      }
    }
  }

  return bestNamePhone >= 0 ? bestNamePhone : bestName;
}

function hasMonthlyPayload_(obj) {
  return obj && (
    Object.prototype.hasOwnProperty.call(obj, 'brush_kg_cumplido') ||
    Object.prototype.hasOwnProperty.call(obj, 'kg') ||
    Object.prototype.hasOwnProperty.call(obj, 'mes') ||
    Object.prototype.hasOwnProperty.call(obj, 'month')
  );
}

function normalizeUpdatePayload_(client) {
  var out = {};
  Object.keys(client || {}).forEach(function(k) { out[k] = client[k]; });

  if (out.acuerdo_mt_valor === undefined && out.acuerdo_mt !== undefined) {
    out.acuerdo_mt_valor = parseNumber_(out.acuerdo_mt);
  }
  if (out.acuerdo_kg_valor === undefined && out.acuerdo_kg !== undefined) {
    out.acuerdo_kg_valor = parseNumber_(out.acuerdo_kg);
  }
  if (out.acuerdo_kg_mes_valor === undefined && out.acuerdo_kg_mes !== undefined) {
    out.acuerdo_kg_mes_valor = parseNumber_(out.acuerdo_kg_mes);
  }
  if (out.cuanto_falto_dinero_valor === undefined && out.cuanto_falto_dinero !== undefined) {
    out.cuanto_falto_dinero_valor = parseNumber_(out.cuanto_falto_dinero);
  }

  return out;
}

function validateClientIdentity_(client) {
  if (!client || (!client.cedula && !client.cliente && !client.name && !client.source_sheet && !client.grupo_sheet)) {
    throw apiError_(
      'MISSING_CLIENT_IDENTITY',
      'Envía al menos cedula, cliente/name o source_sheet/grupo_sheet.'
    );
  }
}

// =============================================================================
// ENCABEZADOS / PARSEO
// =============================================================================

function findDirectoryHeaderRow_(data) {
  for (var r = 0; r < Math.min(8, data.length); r++) {
    var headers = data[r].map(normalizeHeader_);
    var hasName = findColumn_(headers, ['nombre_del_cliente', 'nombre_cliente', 'cliente', 'nombre']) >= 0;
    var hasDoc = findColumn_(headers, ['cedula', 'nit', 'documento', 'doc']) >= 0;
    if (hasName && hasDoc) return r;
  }
  return -1;
}

function findColumn_(headers, aliases) {
  var normalizedAliases = aliases.map(normalizeHeader_);

  for (var a = 0; a < normalizedAliases.length; a++) {
    for (var i = 0; i < headers.length; i++) {
      if (headers[i] === normalizedAliases[a]) return i;
    }
  }

  for (var b = 0; b < normalizedAliases.length; b++) {
    var alias = normalizedAliases[b];
    if (alias.length < 4) continue;
    for (var j = 0; j < headers.length; j++) {
      if (!headers[j]) continue;
      if (headers[j].indexOf(alias) === 0 || headers[j].indexOf(alias + '_') >= 0) return j;
    }
  }

  return -1;
}

function normalizeHeader_(value) {
  return String(value === null || value === undefined ? '' : value)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\$/g, '')
    .replace(/\+/g, '_')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function normalizeText_(value) {
  return String(value === null || value === undefined ? '' : value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function normalizeNameKey_(value) {
  return normalizeText_(value)
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDocumentKey_(value) {
  var s = String(value === null || value === undefined ? '' : value).trim();
  if (!s) return '';

  if (/^-?\d+(\.0+)?$/.test(s)) s = s.replace(/\.0+$/, '');
  if (/^-?\d+(\.\d+)?e[+\-]?\d+$/i.test(s)) {
    var n = Number(s);
    if (isFinite(n)) s = Math.round(n).toString();
  }

  return s.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
}

function normalizePhoneKey_(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/\.0+$/, '')
    .replace(/\D/g, '');
}

function stringCell_(row, index) {
  if (index < 0 || index >= row.length) return '';
  return stringValue_(row[index]);
}

function numberCell_(row, index) {
  if (index < 0 || index >= row.length) return 0;
  return parseNumber_(row[index]);
}

function stringValue_(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  var s = String(value).trim();
  return s.replace(/\.0$/, function(match) {
    return /^\d+\.0$/.test(s) ? '' : match;
  });
}

function parseNumber_(value) {
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  if (value === null || value === undefined || value === '') return 0;

  var s = String(value).trim();
  if (!s) return 0;

  s = s.replace(/[$€£\s]/g, '');
  s = s.replace(/[^0-9,\.\-]/g, '');
  if (!s || s === '-' || s === '.' || s === ',') return 0;

  var lastDot = s.lastIndexOf('.');
  var lastComma = s.lastIndexOf(',');

  if (lastDot >= 0 && lastComma >= 0) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (lastComma >= 0) {
    var commaDigits = s.length - lastComma - 1;
    if (commaDigits === 3 && s.indexOf(',') === lastComma) s = s.replace(',', '');
    else s = s.replace(',', '.');
  } else if (lastDot >= 0) {
    var dotDigits = s.length - lastDot - 1;
    var dots = (s.match(/\./g) || []).length;
    if (dots > 1) {
      if (dotDigits === 3) s = s.replace(/\./g, '');
      else {
        var parts = s.split('.');
        var decimal = parts.pop();
        s = parts.join('') + '.' + decimal;
      }
    } else if (dotDigits === 3 && /^-?\d{1,3}\.\d{3}$/.test(s)) {
      s = s.replace('.', '');
    }
  }

  var n = Number(s);
  return isFinite(n) ? n : 0;
}

function formatMoney_(value) {
  var n = parseNumber_(value);
  var rounded = Math.round(n);
  var sign = rounded < 0 ? '-' : '';
  var abs = Math.abs(rounded).toString();
  return sign + '$' + abs.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function normalizeStatus_(value) {
  var s = normalizeText_(value);
  if (!s) return '';
  if (s === 'SÍ' || s === 'SI' || s === 'CUMPLE' || s === 'OK') return 'SI';
  if (s === 'NO' || s === 'NO CUMPLE') return 'NO';
  if (s.indexOf('PEND') >= 0) return 'PENDIENTE';
  return s;
}

function normalizeMonth_(value) {
  var s = normalizeText_(value);
  var map = {
    JANUARY: 'ENERO', FEBRUARY: 'FEBRERO', MARCH: 'MARZO', APRIL: 'ABRIL',
    MAY: 'MAYO', JUNE: 'JUNIO', JULY: 'JULIO', AUGUST: 'AGOSTO',
    SEPTEMBER: 'SEPTIEMBRE', OCTOBER: 'OCTUBRE', NOVEMBER: 'NOVIEMBRE', DECEMBER: 'DICIEMBRE',
    ENE: 'ENERO', FEB: 'FEBRERO', MAR: 'MARZO', ABR: 'ABRIL', MAYO: 'MAYO',
    JUN: 'JUNIO', JUL: 'JULIO', AGO: 'AGOSTO', SEP: 'SEPTIEMBRE', SEPT: 'SEPTIEMBRE',
    OCT: 'OCTUBRE', NOV: 'NOVIEMBRE', DIC: 'DICIEMBRE'
  };
  if (map[s]) s = map[s];
  if (CONFIG_.MONTHS.indexOf(s) < 0) {
    throw apiError_('INVALID_MONTH', 'Mes inválido: ' + value);
  }
  return s;
}

function currentMonthName_(ss) {
  var tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  var month = Number(Utilities.formatDate(new Date(), tz, 'M'));
  return CONFIG_.MONTHS[month - 1];
}

function currentYear_(ss) {
  var tz = ss.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
  return Number(Utilities.formatDate(new Date(), tz, 'yyyy'));
}

function firstDefinedNumber_(values) {
  for (var i = 0; i < values.length; i++) {
    if (values[i] !== undefined && values[i] !== null && values[i] !== '') {
      return parseNumber_(values[i]);
    }
  }
  return null;
}

function isMeaningful_(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return isFinite(value);
  if (typeof value === 'boolean') return true;
  if (value instanceof Date) return true;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function looksOnlyLikeSequenceNumber_(value) {
  return /^\d+(\.0+)?$/.test(String(value || '').trim());
}

function round_(n, decimals) {
  n = parseNumber_(n);
  var p = Math.pow(10, decimals || 0);
  return Math.round(n * p) / p;
}

function pushUnique_(arr, value) {
  if (!isMeaningful_(value)) return;
  var normalized = String(value).trim();
  if (arr.indexOf(normalized) < 0) arr.push(normalized);
}

function columnLetter_(column) {
  var temp = '';
  var letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function jsonSafeValue_(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' && !isFinite(value)) return null;
  return value;
}

// =============================================================================
// RESPUESTAS / ERRORES / CACHE
// =============================================================================

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function apiError_(code, message) {
  var err = new Error(message);
  err.apiCode = code;
  return err;
}

function errorResponse_(err) {
  return jsonResponse_({
    status: 'error',
    code: err && err.apiCode ? err.apiCode : 'INTERNAL_ERROR',
    message: err && err.message ? err.message : String(err),
    version: SYNC_VERSION_
  });
}

function clearSyncCache_(ss) {
  try {
    CacheService.getScriptCache().remove('sync_v2_' + ss.getId());
  } catch (ignore) {}
}
`

const styles: Record<string, any> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '32px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    maxWidth: 1240,
    margin: '0 auto',
    background: '#1e293b',
    borderRadius: 16,
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    border: '1px solid #334155',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '24px 32px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  headerSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  btnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap' as const,
  },
  btnDrive: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap' as const,
  },
  btnLocalExcel: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap' as const,
  },
  btnGhost: {
    background: '#0f172a',
    color: '#94a3b8',
    border: '1px solid #475569',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  btnDanger: {
    background: 'transparent',
    color: '#f87171',
    border: '1px solid #ef4444',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnDangerSolid: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap' as const,
  },
  driveBanner: {
    background: 'rgba(16,185,129,0.08)',
    borderBottom: '1px solid rgba(16,185,129,0.2)',
    padding: '12px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 12,
    fontSize: 12,
    color: '#e2e8f0',
  },
  body: {
    padding: '24px 32px',
  },
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #334155',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  thead: {
    background: '#0f172a',
  },
  th: {
    padding: '12px 16px',
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    textAlign: 'left' as const,
    borderBottom: '1px solid #334155',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #1e293b',
    color: '#e2e8f0',
    fontSize: 13,
    verticalAlign: 'middle' as const,
  },
  badge: (color: string) => ({
    display: 'inline-block',
    background: color === 'green' ? 'rgba(34,197,94,0.15)' : color === 'gray' ? 'rgba(148,163,184,0.15)' : 'rgba(239,68,68,0.15)',
    color: color === 'green' ? '#4ade80' : color === 'gray' ? '#94a3b8' : '#f87171',
    border: `1px solid ${color === 'green' ? 'rgba(34,197,94,0.3)' : color === 'gray' ? 'rgba(148,163,184,0.3)' : 'rgba(239,68,68,0.3)'}`,
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 700,
  }),
  progress: (pct: number) => ({
    width: '100%',
    height: 6,
    background: '#0f172a',
    borderRadius: 99,
    overflow: 'hidden' as const,
    marginBottom: 4,
  }),
  progressBar: (pct: number) => ({
    width: `${Math.min(100, pct)}%`,
    height: '100%',
    background: pct >= 100 ? '#4ade80' : pct >= 50 ? '#facc15' : '#f87171',
    borderRadius: 99,
    transition: 'width 0.5s ease',
  }),
  emptyRow: {
    padding: 48,
    textAlign: 'center' as const,
    color: '#475569',
    fontSize: 15,
  },
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(5px)',
    zIndex: 9998,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px',
    overflowY: 'auto' as const,
  },
  dialog: {
    background: '#1e293b',
    borderRadius: 16,
    border: '1px solid #334155',
    width: '100%',
    maxWidth: 840,
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
    zIndex: 9999,
    marginTop: 24,
  },
  dialogHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  dialogBody: {
    padding: '24px',
    maxHeight: '75vh',
    overflowY: 'auto' as const,
  },
  dialogFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #334155',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    marginBottom: 16,
    marginTop: 24,
    paddingTop: 24,
    borderTop: '1px solid #334155',
    display: 'block',
  },
  sectionLabelFirst: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    marginBottom: 16,
    display: 'block',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 16,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
  },
  input: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#f1f5f9',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  codeBox: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '14px',
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#93c5fd',
    maxHeight: 180,
    overflowY: 'auto' as const,
    whiteSpace: 'pre-wrap' as const,
  },
  accentBox: {
    background: 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.25)',
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
  },
}

const EMPTY_FORM = {
  _id: '',
  name: '',
  email: '',
  password: '',
  wholesaleData: {
    cliente: '', encargado: '', cedula: '', direccion: '', telefono: '',
    facturacion: '', acuerdo_mt: '', acuerdo_kg: '', volumen_mes_kg: 0,
    volumen_mes_mt: 0, volumen_compra_kg: 0, acuerdo_kg_mes: '', tiempos: '',
    brush_kg_cumplido: 0, brush_mt_cumplido: 0, cuanto_falto_kg: 0,
    cuanto_falto_mt: 0, cuanto_falto_dinero: '', mensaje_personalizado: ''
  }
}

export function WholesaleManager() {
  const client = useClient({ apiVersion: '2023-05-03' })
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [formData, setFormData] = useState<any>(EMPTY_FORM)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Drive Live Sync States
  const [driveSettings, setDriveSettings] = useState<any>(null)
  const [isSyncingDrive, setIsSyncingDrive] = useState(false)
  const [isImportingLocal, setIsImportingLocal] = useState(false)
  const [isDriveConfigOpen, setIsDriveConfigOpen] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [inputWebhookUrl, setInputWebhookUrl] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  // Reemplazar data al sincronizar & Borrar toda la data
  const [replaceOnSync, setReplaceOnSync] = useState(true)
  const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false)
  const [isClearingAll, setIsClearingAll] = useState(false)

  // Quick Update & Month State
  const CURRENT_MONTH = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  const [selectedTableMonth, setSelectedTableMonth] = useState<string>(CURRENT_MONTH)
  const [quickUpdateUser, setQuickUpdateUser] = useState<any>(null)
  const [quickUpdateData, setQuickUpdateData] = useState<any>({
    mes: CURRENT_MONTH,
    modo: 'sumar', // 'sumar' | 'fijar'
    kg_agregados: '',
    kg_directos: ''
  })

  const formatKg = (n: number | string) => {
    const num = Number(n) || 0
    return (Math.round(num * 10) / 10).toLocaleString('es-CO', {
      maximumFractionDigits: 1
    })
  }

  const getClientMonthData = (u: any, month: string) => {
    const wd = u?.wholesaleData || {}
    const meta = Number(wd.volumen_mes_kg) || 0
    const metaMt = Number(wd.volumen_mes_mt) || (Math.round(meta * 3.3 * 10) / 10)
    const historial = wd.historial_meses || []
    const normMonth = String(month || '').trim().toUpperCase()
    const monthRecord = historial.find((h: any) => String(h.mes || '').trim().toUpperCase() === normMonth)

    if (monthRecord) {
      const cumplido = Number(monthRecord.kg) || 0
      const mtCumplido = Number(monthRecord.mt) || Math.round(cumplido * 3.3 * 10) / 10
      const faltante = monthRecord.falta_kg !== undefined ? Number(monthRecord.falta_kg) : Math.max(0, meta - cumplido)
      const faltanteMt = monthRecord.falta_mt !== undefined ? Number(monthRecord.falta_mt) : Math.max(0, metaMt - mtCumplido)
      const pct = meta > 0 ? Math.round((cumplido / meta) * 100) : 0
      const cumplimiento = monthRecord.cumplimiento || (meta > 0 && cumplido >= meta ? 'SI' : 'NO')
      return {
        hasRecord: true,
        cumplido,
        mtCumplido,
        meta,
        metaMt,
        pct,
        faltante,
        faltanteMt,
        cumplimiento,
        dinero: monthRecord.cuanto_va_dinero || '',
        faltaDinero: monthRecord.falta_dinero || ''
      }
    }

    if (normMonth === CURRENT_MONTH && wd.brush_kg_cumplido !== undefined) {
      const cumplido = Number(wd.brush_kg_cumplido) || 0
      const mtCumplido = Number(wd.brush_mt_cumplido) || Math.round(cumplido * 3.3 * 10) / 10
      const faltante = wd.cuanto_falto_kg !== undefined ? Number(wd.cuanto_falto_kg) : Math.max(0, meta - cumplido)
      const pct = meta > 0 ? Math.round((cumplido / meta) * 100) : 0
      const cumplimiento = wd.cumplimiento || (meta > 0 && cumplido >= meta ? 'SI' : 'NO')
      return {
        hasRecord: cumplido > 0,
        cumplido,
        mtCumplido,
        meta,
        metaMt,
        pct,
        faltante,
        faltanteMt: wd.cuanto_falto_mt || Math.max(0, metaMt - mtCumplido),
        cumplimiento,
        dinero: wd.cuanto_va_dinero || '',
        faltaDinero: wd.cuanto_falto_dinero || ''
      }
    }

    return {
      hasRecord: false,
      cumplido: 0,
      mtCumplido: 0,
      meta,
      metaMt,
      pct: 0,
      faltante: meta,
      faltanteMt: metaMt,
      cumplimiento: 'NO',
      dinero: '$0',
      faltaDinero: ''
    }
  }

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // 1. Consultar clientes mayoristas de la nueva entidad clienteMayorista
      const empresas = await client.withConfig({ useCdn: false }).fetch(
        `*[_type == "clienteMayorista" && !(_id in path("drafts.**"))] | order(nombre asc){
          _id,
          nombre,
          codigoCliente,
          nit,
          telefono,
          direccion,
          ciudad,
          objetivoMensual,
          acuerdoPrecio,
          meses,
          "usuarios": *[_type == "user" && references(^._id)]{ _id, name, email }
        }`
      )

      if (empresas && empresas.length > 0) {
        const mapped = empresas.map((emp: any) => {
          const lastMonth = Array.isArray(emp.meses) && emp.meses.length > 0 ? emp.meses[emp.meses.length - 1] : null
          const currentMonthRecord = Array.isArray(emp.meses) ? emp.meses.find((m: any) => m.mes === CURRENT_MONTH) : null
          const activeMonth = currentMonthRecord || lastMonth

          return {
            _id: emp._id,
            name: emp.nombre,
            email: emp.usuarios?.[0]?.email || `${(emp.codigoCliente || 'cliente').toLowerCase()}@telasreal.com`,
            isEmpresa: true,
            usuarios: emp.usuarios || [],
            wholesaleData: {
              cliente: emp.nombre,
              cedula: emp.nit,
              telefono: emp.telefono,
              direccion: emp.direccion,
              ciudad: emp.ciudad,
              volumen_mes_kg: emp.objetivoMensual?.kg || 0,
              volumen_mes_mt: emp.objetivoMensual?.mt || 0,
              acuerdo_kg: "$" + (emp.acuerdoPrecio?.precioKg || 37950).toLocaleString("es-CO"),
              acuerdo_mt: "$" + (emp.acuerdoPrecio?.precioMt || 11500).toLocaleString("es-CO"),
              brush_kg_cumplido: activeMonth?.kgCumplido || 0,
              brush_mt_cumplido: activeMonth?.mtCumplido || 0,
              cuanto_falto_kg: activeMonth?.faltanteKg || 0,
              cuanto_falto_mt: activeMonth?.faltanteMt || 0,
              cumplimiento: activeMonth?.cumplimiento || 'NO',
              cuanto_va_dinero: "$" + (activeMonth?.dinero || 0).toLocaleString("es-CO"),
              historial_meses: (emp.meses || []).map((m: any) => ({
                _key: m._key,
                mes: m.mes,
                mes_numero: m.mesNumero,
                anio: m.anio,
                kg: m.kgCumplido,
                mt: m.mtCumplido,
                falta_kg: m.faltanteKg,
                falta_mt: m.faltanteMt,
                cuanto_va_dinero: "$" + (m.dinero || 0).toLocaleString("es-CO"),
                falta_dinero: "$" + (m.faltanteDinero || 0).toLocaleString("es-CO"),
                cumplimiento: m.cumplimiento,
                nota: m.nota || ''
              }))
            }
          }
        })
        setUsers(mapped)
      } else {
        // Fallback a usuarios legacy
        const result = await client.withConfig({ useCdn: false }).fetch(`*[_type == "user" && role == "mayorista"] | order(name asc){_id,name,email,wholesaleData}`)
        const validUsers = (result || []).filter((u: any) => {
          const clientName = u.name || u.wholesaleData?.cliente || ''
          return isValidClientName(clientName)
        })
        setUsers(validUsers)
      }
    } catch {
      showToast('Error al cargar usuarios mayoristas', 'err')
    }
    setLoading(false)
  }

  const fetchDriveSettings = async () => {
    try {
      const result = await client.fetch(`*[_type == "wholesaleDriveSettings" || _id == "wholesaleDriveSettings"][0]`)
      setDriveSettings(result || null)
      if (result?.webhookUrl) {
        setInputWebhookUrl(result.webhookUrl)
      }
    } catch (e) {
      console.warn('Error fetching drive settings:', e)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchDriveSettings()
  }, [])

  // Vaciar / Borrar todos los clientes mayoristas registrados en Sanity
  const handleClearAllMayoristas = async () => {
    setIsClearingAll(true)
    try {
      const res = await fetch('/api/mayorista/drive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all' })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast(`✓ Se eliminaron ${data.deleted} clientes mayoristas. La base de datos está limpia.`, 'ok')
        setIsClearAllDialogOpen(false)
        fetchUsers()
      } else {
        showToast(data.error || 'Error al eliminar clientes mayoristas', 'err')
      }
    } catch (e: any) {
      showToast('Error de red al borrar mayoristas: ' + e.message, 'err')
    } finally {
      setIsClearingAll(false)
    }
  }

  // Sincronización en vivo PULL desde Google Drive (Ultrarrápida)
  const handleSyncDrive = async () => {
    setIsSyncingDrive(true)
    const t0 = performance.now()
    try {
      const res = await fetch('/api/mayorista/drive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', cleanSync: replaceOnSync })
      })
      const data = await res.json()
      const elapsedSec = ((performance.now() - t0) / 1000).toFixed(1)

      if (res.ok && data.success) {
        const msg = (data.clearedPrevious > 0)
          ? `✓ Sincronización limpia en ${elapsedSec}s: ${data.clearedPrevious} anteriores eliminados y ${data.created} clientes frescos guardados.`
          : `✓ Sincronización exitosa en ${elapsedSec}s: ${data.total} clientes (${data.created} creados, ${data.updated} actualizados)`
        showToast(msg, 'ok')
        fetchUsers()
        fetchDriveSettings()
      } else {
        showToast(data.error || 'Error al sincronizar con Drive', 'err')
      }
    } catch (e: any) {
      showToast('Error de red al conectar con Google Drive: ' + e.message, 'err')
    } finally {
      setIsSyncingDrive(false)
    }
  }

  // Importar directamente el archivo mayoristas.xlsx local (Ultrarrápido)
  const handleImportLocalExcel = async () => {
    setIsImportingLocal(true)
    const t0 = performance.now()
    try {
      const res = await fetch('/api/mayorista/drive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_local', cleanSync: replaceOnSync })
      })
      const data = await res.json()
      const elapsedSec = ((performance.now() - t0) / 1000).toFixed(1)

      if (res.ok && data.success) {
        const msg = (data.clearedPrevious > 0)
          ? `✓ Importación limpia en ${elapsedSec}s: ${data.clearedPrevious} anteriores eliminados y ${data.created} clientes frescos.`
          : `✓ Archivo importado en ${elapsedSec}s: ${data.total} clientes (${data.created} nuevos, ${data.updated} actualizados)`
        showToast(msg, 'ok')
        fetchUsers()
        fetchDriveSettings()
      } else {
        showToast(data.error || 'Error al importar mayoristas.xlsx', 'err')
      }
    } catch (e: any) {
      showToast('Error al importar archivo local: ' + e.message, 'err')
    } finally {
      setIsImportingLocal(false)
    }
  }

  // Escanear pestañas y hojas de Google Drive
  const handleScanDrive = async () => {
    setIsScanning(true)
    setIsScanModalOpen(true)
    try {
      const query = inputWebhookUrl ? `?url=${encodeURIComponent(inputWebhookUrl)}` : ''
      const res = await fetch(`/api/mayorista/drive-sync${query}`)
      const data = await res.json()
      if (res.ok && data.connected) {
        setScanResult(data)
        showToast(`✓ Hoja escaneada: ${data.spreadsheetName} (${data.sheets.length} pestañas detectadas)`, 'ok')
      } else {
        setScanResult({ error: data.error || 'No se pudo conectar a Google Sheets' })
      }
    } catch (e: any) {
      setScanResult({ error: 'Error al contactar Google Drive: ' + e.message })
    } finally {
      setIsScanning(false)
    }
  }

  // Guardar URL del Webhook
  const handleSaveDriveUrl = async () => {
    if (!inputWebhookUrl.trim()) {
      showToast('Ingresa una URL válida de Google Apps Script', 'err')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/mayorista/drive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_url', webhookUrl: inputWebhookUrl.trim() })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast('✓ Conexión de Google Drive guardada exitosamente', 'ok')
        setIsDriveConfigOpen(false)
        fetchDriveSettings()
      } else {
        showToast(data.error || 'Error al guardar configuración', 'err')
      }
    } catch (e: any) {
      showToast('Error al guardar: ' + e.message, 'err')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2500)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      await client.delete(userToDelete._id)
      showToast('Mayorista eliminado correctamente', 'ok')
      setUserToDelete(null)
      fetchUsers()
    } catch (e: any) {
      showToast('Error al eliminar: ' + e.message, 'err')
    }
    setIsDeleting(false)
  }

  const openQuickUpdate = (u: any) => {
    const targetMonth = selectedTableMonth || CURRENT_MONTH
    const mData = getClientMonthData(u, targetMonth)
    setQuickUpdateUser(u)
    setQuickUpdateData({
      mes: targetMonth,
      modo: 'sumar',
      kg_agregados: '',
      kg_directos: String(mData.cumplido || 0)
    })
  }

  const handleSaveQuickUpdate = async () => {
    if (!quickUpdateUser) return
    const mes = quickUpdateData.mes || selectedTableMonth || CURRENT_MONTH
    const wholesale = quickUpdateUser.wholesaleData || {}
    const mData = getClientMonthData(quickUpdateUser, mes)
    const currentKg = mData.cumplido || 0

    let totalKg = currentKg
    if (quickUpdateData.modo === 'fijar') {
      totalKg = Math.max(0, Number(quickUpdateData.kg_directos) || 0)
    } else {
      const kgAgregados = Number(quickUpdateData.kg_agregados) || 0
      totalKg = Math.max(0, currentKg + kgAgregados)
    }

    const metaKg = Number(wholesale.volumen_mes_kg) || 0
    const faltanteKg = Math.max(0, metaKg - totalKg)
    const cumplimiento = metaKg > 0 && totalKg >= metaKg ? 'SI' : 'NO'

    // 1. Actualización optimista instantánea (0ms de espera)
    setUsers((prevUsers: any[]) =>
      prevUsers.map((u: any) => {
        if (u._id !== quickUpdateUser._id) return u
        const prevWd = u.wholesaleData || {}
        const prevHist = prevWd.historial_meses || []
        const updatedHist = [
          ...prevHist.filter((h: any) => String(h.mes || '').toUpperCase() !== mes.toUpperCase()),
          {
            mes,
            kg: totalKg,
            falta_kg: faltanteKg,
            cumplimiento,
          }
        ]
        return {
          ...u,
          wholesaleData: {
            ...prevWd,
            brush_kg_cumplido: mes === CURRENT_MONTH ? totalKg : prevWd.brush_kg_cumplido,
            cuanto_falto_kg: mes === CURRENT_MONTH ? faltanteKg : prevWd.cuanto_falto_kg,
            cumplimiento: mes === CURRENT_MONTH ? cumplimiento : prevWd.cumplimiento,
            historial_meses: updatedHist
          }
        }
      })
    )

    // Cerrar el modal al instante
    const targetId = quickUpdateUser._id
    setQuickUpdateUser(null)
    setIsSaving(false)
    showToast(`⚡ Guardando ${formatKg(totalKg)} KG en ${mes}...`, 'ok')

    // 2. Enviar al backend de forma ultra-rápida (Sanity en ~200ms + Sheet en background)
    try {
      const res = await fetch('/api/sync/sanity-to-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: targetId,
          mes,
          kgCumplido: totalKg,
          usuario: 'Sanity Studio'
        })
      })

      const result = await res.json()
      if (res.ok && result.success) {
        showToast(`✓ Progreso actualizado: ${formatKg(totalKg)} KG en ${mes} (Google Sheets sincronizado)`, 'ok')
        fetchUsers()
      } else {
        showToast(`⚠️ Guardado en Sanity, aviso: ${result.error || 'pendiente'}`, 'ok')
      }
    } catch (e: any) {
      showToast('Error al actualizar: ' + e.message, 'err')
      fetchUsers()
    }
  }

  const openCreate = () => { setFormData(EMPTY_FORM); setIsDialogOpen(true) }
  const openEdit = (u: any) => {
    const targetMonth = selectedTableMonth || CURRENT_MONTH
    const mData = getClientMonthData(u, targetMonth)
    setFormData({
      _id: u._id,
      isEmpresa: Boolean(u.isEmpresa),
      name: u.name || '',
      email: u.email || '',
      password: '',
      mesEdicion: targetMonth,
      wholesaleData: {
        cliente: u.wholesaleData?.cliente || '',
        encargado: u.wholesaleData?.encargado || '',
        cedula: u.wholesaleData?.cedula || '',
        direccion: u.wholesaleData?.direccion || '',
        telefono: u.wholesaleData?.telefono || '',
        facturacion: u.wholesaleData?.facturacion || '',
        acuerdo_mt: u.wholesaleData?.acuerdo_mt || '',
        acuerdo_kg: u.wholesaleData?.acuerdo_kg || '',
        volumen_mes_kg: mData.meta || 0,
        volumen_mes_mt: mData.metaMt || 0,
        volumen_compra_kg: u.wholesaleData?.volumen_compra_kg || 0,
        acuerdo_kg_mes: u.wholesaleData?.acuerdo_kg_mes || '',
        tiempos: u.wholesaleData?.tiempos || '',
        brush_kg_cumplido: mData.cumplido || 0,
        brush_mt_cumplido: mData.mtCumplido || 0,
        cuanto_falto_kg: mData.faltante || 0,
        cuanto_falto_mt: mData.faltanteMt || 0,
        cuanto_falto_dinero: mData.faltaDinero || u.wholesaleData?.cuanto_falto_dinero || '',
        mensaje_personalizado: u.wholesaleData?.mensaje_personalizado || '',
        historial_meses: u.wholesaleData?.historial_meses || []
      }
    })
    setIsDialogOpen(true)
  }

  const set = (field: string, value: any, isWd = false) => {
    setFormData((prev: any) => isWd
      ? { ...prev, wholesaleData: { ...prev.wholesaleData, [field]: value } }
      : { ...prev, [field]: value }
    )
  }

  const handleSave = async () => {
    if (!formData.name) { showToast('El nombre del cliente es obligatorio', 'err'); return }
    setIsSaving(true)
    try {
      const wd = formData.wholesaleData
      const objKg = Number(wd.volumen_mes_kg) || 0
      const objMt = Number(wd.volumen_mes_mt) || 0
      const kgCumplido = Number(wd.brush_kg_cumplido) || 0
      const targetMes = formData.mesEdicion || selectedTableMonth || CURRENT_MONTH

      if (formData.isEmpresa && formData._id) {
        // Actualizar documento formal clienteMayorista
        await client.patch(formData._id).set({
          nombre: formData.name,
          encargado: wd.encargado || 'E-COMMERCE',
          nit: wd.cedula,
          cedulaNitPrincipal: wd.cedula,
          telefono: wd.telefono,
          direccion: wd.direccion,
          'objetivoMensual.kg': objKg,
          'objetivoMensual.mt': objMt,
        }).commit()

        // Sincronizar mes actual/seleccionado con backend y Google Sheets
        await fetch('/api/sync/sanity-to-google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteId: formData._id,
            mes: targetMes,
            kgCumplido,
            usuario: 'Sanity Studio WholesaleManager'
          })
        })
      } else {
        const payload: any = {
          _type: 'user',
          name: formData.name,
          email: formData.email,
          role: 'mayorista',
          wholesaleData: {
            ...wd,
            volumen_mes_kg: objKg,
            volumen_mes_mt: objMt,
            volumen_compra_kg: Number(wd.volumen_compra_kg),
            brush_kg_cumplido: kgCumplido,
            brush_mt_cumplido: Number(wd.brush_mt_cumplido),
            cuanto_falto_kg: Number(wd.cuanto_falto_kg),
            cuanto_falto_mt: Number(wd.cuanto_falto_mt)
          }
        }
        if (formData.password?.trim()) payload.password = formData.password
        if (!formData._id) {
          await client.create(payload)
        } else {
          await client.patch(formData._id).set(payload).commit()
        }

        const clientPayloadForDrive = {
          ...payload.wholesaleData,
          cliente: formData.name,
          name: formData.name,
          email: formData.email,
          cedula: wd?.cedula,
          mes: targetMes,
        }

        fetch('/api/mayorista/drive-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'push',
            clientData: clientPayloadForDrive
          })
        }).catch(err => {
          console.warn('Error en push asíncrono a Google Drive:', err)
        })
      }

      setIsDialogOpen(false)
      setIsSaving(false)
      fetchUsers()
      showToast(`Mayorista guardado y sincronizado con éxito ✓`, 'ok')
      return
    } catch (e: any) {
      showToast('Error: ' + e.message, 'err')
      setIsSaving(false)
    }
    setIsSaving(false)
  }

  return (
    <div style={styles.container}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 99999,
          background: toast.type === 'ok' ? '#064e3b' : '#7f1d1d',
          color: toast.type === 'ok' ? '#4ade80' : '#fca5a5',
          border: `1px solid ${toast.type === 'ok' ? '#34d399' : '#f87171'}`,
          borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>{toast.msg}</div>
      )}

      <div style={styles.card}>
        {/* Header con Controles en Vivo */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>CRM Clientes Mayoristas</h1>
            <p style={styles.headerSub}>Gestión de clientes corporativos, acuerdos y sincronización en vivo con Google Drive / Sheets</p>
          </div>
          <div style={styles.btnGroup}>
            {/* Toggle para reemplazar data al sincronizar */}
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontWeight: 500,
              color: replaceOnSync ? '#93c5fd' : '#94a3b8',
              cursor: 'pointer',
              padding: '8px 14px',
              background: replaceOnSync ? 'rgba(59,130,246,0.12)' : 'rgba(15,23,42,0.6)',
              borderRadius: 8,
              border: replaceOnSync ? '1px solid rgba(59,130,246,0.4)' : '1px solid #334155',
              transition: 'all 0.2s',
              userSelect: 'none' as const,
            }} title="Si está activo, al sincronizar se borrará la data antigua para dejar únicamente los clientes del Excel/Drive actual">
              <input
                type="checkbox"
                checked={replaceOnSync}
                onChange={(e) => setReplaceOnSync(e.target.checked)}
                style={{ accentColor: '#3b82f6', cursor: 'pointer', width: 15, height: 15 }}
              />
              <span>Reemplazar todo al sincronizar (solo lo nuevo)</span>
            </label>

            <button
              style={{ ...styles.btnDrive, opacity: isSyncingDrive ? 0.7 : 1 }}
              disabled={isSyncingDrive}
              onClick={handleSyncDrive}
              title="Sincroniza y actualiza todos los clientes con el Excel de Google Drive"
            >
              <span>{isSyncingDrive ? '⏳ Sincronizando...' : '🔄 Sincronizar Google Drive'}</span>
            </button>
            <button
              style={{ ...styles.btnLocalExcel, opacity: isImportingLocal ? 0.7 : 1 }}
              disabled={isImportingLocal}
              onClick={handleImportLocalExcel}
              title="Importa o actualiza todos los clientes desde archivo-guia.xlsx o mayoristas.xlsx"
            >
              <span>{isImportingLocal ? '⏳ Importando...' : '📥 Importar archivo-guia.xlsx'}</span>
            </button>
            <button
              style={styles.btnDangerSolid}
              onClick={() => setIsClearAllDialogOpen(true)}
              title="Eliminar todos los clientes mayoristas actuales de la base de datos"
            >
              <span>🗑️ Borrar Toda la Data</span>
            </button>
            <button style={styles.btnGhost} onClick={() => handleScanDrive()}>
              <span>🔍 Escanear Drive</span>
            </button>
            <button style={styles.btnGhost} onClick={() => setIsDriveConfigOpen(true)}>
              <span>⚙️ Configurar Drive</span>
            </button>
            <button style={styles.btnPrimary} onClick={openCreate}>
              <span>+ Nuevo Mayorista</span>
            </button>
          </div>
        </div>

        {/* Banner de Estado de Conexión Google Drive */}
        <div style={styles.driveBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: driveSettings?.webhookUrl ? '#10b981' : '#94a3b8',
              boxShadow: driveSettings?.webhookUrl ? '0 0 8px #10b981' : 'none'
            }} />
            <span>
              <strong>Fuente / Hoja:</strong> {driveSettings?.spreadsheetName ? `${driveSettings.spreadsheetName}` : (driveSettings?.webhookUrl ? 'Conectado a Google Drive' : 'Sin configurar')}
            </span>
            {driveSettings?.lastSyncAt && (
              <span style={{ color: '#94a3b8' }}>
                · Última sinc: {new Date(driveSettings.lastSyncAt).toLocaleString('es-CO')}
              </span>
            )}
            {driveSettings?.lastSyncStats && (
              <span style={{ color: '#4ade80' }}>
                · {driveSettings.lastSyncStats}
              </span>
            )}
          </div>
          {driveSettings?.detectedSheets && driveSettings.detectedSheets.length > 0 && (
            <div style={{ color: '#94a3b8' }}>
              Pestañas: {driveSettings.detectedSheets.slice(0, 3).join(', ')}{driveSettings.detectedSheets.length > 3 ? ` (+${driveSettings.detectedSheets.length - 3} más)` : ''}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Stats Bar con mes dinámico */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Mayoristas', value: users.length, color: '#3b82f6' },
              {
                label: `Cuota Cumplida (${selectedTableMonth})`, color: '#4ade80',
                value: users.filter(u => {
                  const mData = getClientMonthData(u, selectedTableMonth)
                  return mData.meta > 0 && mData.cumplido >= mData.meta
                }).length
              },
              {
                label: `Cuota Pendiente (${selectedTableMonth})`, color: '#f87171',
                value: users.filter(u => {
                  const mData = getClientMonthData(u, selectedTableMonth)
                  return mData.meta > 0 && mData.cumplido < mData.meta
                }).length
              },
            ].map((s, i) => (
              <div key={i} style={{ background: '#0f172a', borderRadius: 10, padding: '16px 20px', border: '1px solid #334155' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Barra de Control de la Tabla: Título + Selector de Mes */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Directorio de Clientes
              </span>
              <span style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 11,
                fontWeight: 700,
                color: '#38bdf8'
              }}>
                {users.length} Registrados
              </span>
            </div>

            {/* SELECTOR DE MES ESTILO ERP */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 10,
              padding: '6px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                📅 Mes a Visualizar:
              </span>
              <select
                value={selectedTableMonth}
                onChange={e => setSelectedTableMonth(e.target.value)}
                style={{
                  background: '#1e293b',
                  border: '1px solid #0284c7',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 0 10px rgba(2, 132, 199, 0.2)'
                }}
              >
                {MONTHS.map(m => (
                  <option key={m} value={m}>
                    {m} {m === CURRENT_MONTH ? '★ (Actual)' : ''}
                  </option>
                ))}
              </select>
              {selectedTableMonth === CURRENT_MONTH ? (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#4ade80',
                  background: 'rgba(74, 222, 128, 0.1)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(74, 222, 128, 0.2)'
                }}>
                  ● Mes Actual
                </span>
              ) : (
                <button
                  onClick={() => setSelectedTableMonth(CURRENT_MONTH)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '2px 4px'
                  }}
                  title="Volver al mes actual"
                >
                  Ir al actual
                </button>
              )}
            </div>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  {[
                    'Razón Social / Cliente',
                    'Cédula / NIT',
                    `Progreso ${selectedTableMonth} (KG)`,
                    `Faltante en ${selectedTableMonth}`,
                    'Acciones'
                  ].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={styles.emptyRow}>Cargando mayoristas...</td></tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div style={{ ...styles.emptyRow, background: '#0f172a', padding: 48 }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                        <div style={{ color: '#475569', fontSize: 15 }}>No hay clientes mayoristas registrados aún.</div>
                        <div style={{ color: '#334155', fontSize: 13, marginTop: 6 }}>
                          Haz clic en "Importar mayoristas.xlsx" o "Sincronizar Google Drive" para poblar los clientes.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : users.map((u, idx) => {
                  const wd = u.wholesaleData || {}
                  const clientDisplayName = isValidClientName(wd.cliente) ? wd.cliente : (isValidClientName(u.name) ? u.name : '')
                  if (!clientDisplayName) return null
                  const mData = getClientMonthData(u, selectedTableMonth)
                  const cumplido = mData.cumplido
                  const meta = mData.meta
                  const pct = mData.pct
                  const faltante = mData.faltante
                  const isCumplido = meta > 0 && cumplido >= meta

                  return (
                    <tr
                      key={u._id}
                      style={{ cursor: 'pointer', background: idx % 2 === 0 ? '#1e293b' : '#182032' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#253349')}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#1e293b' : '#182032')}
                      onClick={() => openQuickUpdate(u)}
                    >
                      <td style={styles.td}>
                        <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{clientDisplayName}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{u.email}</div>
                      </td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', color: '#94a3b8' }}>{wd.cedula || '—'}</td>
                      <td style={{ ...styles.td, minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                          <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{formatKg(cumplido)}</span> / {formatKg(meta)} KG · {pct}%
                        </div>
                        <div style={styles.progress(pct)}>
                          <div style={styles.progressBar(pct)} />
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badge(meta <= 0 ? 'gray' : isCumplido ? 'green' : 'red')}>
                          {meta <= 0 ? 'Sin cuota fija' : isCumplido ? '✓ Cumplido' : `${formatKg(faltante)} KG`}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={styles.btnGhost} onClick={(e) => { e.stopPropagation(); openEdit(u); }}>Editar</button>
                          <button style={styles.btnDanger} onClick={(e) => { e.stopPropagation(); setUserToDelete(u); }}>Borrar</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: ESCANEAR PESTAÑAS DRIVE / LOCAL */}
      {isScanModalOpen && (
        <div style={styles.overlay} onClick={() => setIsScanModalOpen(false)}>
          <div style={{ ...styles.dialog, maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>🔍 Escaneo de Hojas y Pestañas</h2>
              <button style={styles.btnGhost} onClick={() => setIsScanModalOpen(false)}>✕</button>
            </div>
            <div style={styles.dialogBody}>
              {isScanning ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
                  <p>Escaneando hojas de cálculo en tiempo real...</p>
                </div>
              ) : scanResult?.error ? (
                <div style={{ padding: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, color: '#f87171' }}>
                  <strong>Error al escanear:</strong> {scanResult.error}
                </div>
              ) : scanResult ? (
                <div>
                  <div style={{ padding: 14, background: '#0f172a', borderRadius: 8, marginBottom: 16, border: '1px solid #334155' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>📊 {scanResult.spreadsheetName}</div>
                    <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>
                      ✓ {scanResult.totalClientsFound} clientes detectados en total
                    </div>
                  </div>

                  <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Pestañas / Hojas Encontradas ({scanResult.sheets?.length || 0})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
                    {(scanResult.sheets || []).map((s: any, idx: number) => (
                      <div key={idx} style={{ padding: '10px 14px', background: '#0f172a', borderRadius: 8, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>📄 {s.name}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', background: '#1e293b', padding: '2px 6px', borderRadius: 4 }}>{s.totalRows} filas</span>
                      </div>
                    ))}
                  </div>

                  {scanResult.sampleClients?.length > 0 && (
                    <>
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Muestra de Clientes Reconocidos</h3>
                      <div style={{ maxHeight: 160, overflowY: 'auto', background: '#0f172a', borderRadius: 8, padding: 10, border: '1px solid #334155', fontSize: 12 }}>
                        {scanResult.sampleClients.map((c: any, i: number) => (
                          <div key={i} style={{ padding: '6px 8px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{c.cliente || c.name}</span>
                            <span style={{ color: '#94a3b8' }}>NIT: {c.cedula || '—'} · Meta: {c.volumen_mes_kg || 0} KG</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setIsScanModalOpen(false)}>Cerrar</button>
              {scanResult?.source === 'local' ? (
                <button style={styles.btnLocalExcel} onClick={handleImportLocalExcel}>
                  <span>📥 Importar mayoristas.xlsx</span>
                </button>
              ) : (
                <button style={styles.btnDrive} onClick={handleSyncDrive}>
                  <span>🔄 Sincronizar Google Drive</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR CONEXIÓN DRIVE */}
      {isDriveConfigOpen && (
        <div style={styles.overlay} onClick={() => setIsDriveConfigOpen(false)}>
          <div style={{ ...styles.dialog, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>⚙️ Conectar con Google Drive / Sheets</h2>
              <button style={styles.btnGhost} onClick={() => setIsDriveConfigOpen(false)}>✕</button>
            </div>
            <div style={styles.dialogBody}>
              <div style={{ marginBottom: 20 }}>
                <label style={styles.label}>URL de la Aplicación Web (Google Apps Script) *</label>
                <input
                  style={{ ...styles.input, marginTop: 6 }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={inputWebhookUrl}
                  onChange={e => setInputWebhookUrl(e.target.value)}
                />
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Pega aquí la URL que genera Google Apps Script al implementar como "Aplicación web".
                </p>
              </div>

              {/* Guía Rápida */}
              <div style={{ background: '#0f172a', borderRadius: 10, padding: 18, border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', textTransform: 'uppercase' }}>
                    📋 Código Apps Script (Copiar y Pegar en Drive)
                  </span>
                  <button
                    style={{ ...styles.btnGhost, padding: '4px 10px', fontSize: 11, background: copiedCode ? '#065f46' : '#1e293b', color: copiedCode ? '#34d399' : '#94a3b8' }}
                    onClick={handleCopyScript}
                  >
                    {copiedCode ? '✓ Copiado' : '📋 Copiar Código'}
                  </button>
                </div>
                <div style={styles.codeBox}>{APPS_SCRIPT_CODE}</div>

                <div style={{ marginTop: 14, fontSize: 12, color: '#cbd5e1', lineHeight: '1.6' }}>
                  <strong>Pasos para conectar:</strong>
                  <ol style={{ paddingLeft: 18, marginTop: 6 }}>
                    <li>Abre tu Google Sheet en Google Drive.</li>
                    <li>Ve a <strong>Extensiones &gt; Apps Script</strong>.</li>
                    <li>Borra el contenido, pega este código y guarda.</li>
                    <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong>.</li>
                    <li>Selecciona <em>Aplicación web</em>, asigna acceso a <em>Cualquier persona</em> y copia la URL generada.</li>
                  </ol>
                </div>
              </div>
            </div>
            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setIsDriveConfigOpen(false)}>Cancelar</button>
              <button style={styles.btnGhost} onClick={() => handleScanDrive()}>🔍 Probar Conexión</button>
              <button
                style={{ ...styles.btnPrimary, opacity: isSaving ? 0.7 : 1 }}
                disabled={isSaving}
                onClick={handleSaveDriveUrl}
              >
                {isSaving ? 'Guardando...' : 'Guardar Conexión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK UPDATE DIALOG */}
      {quickUpdateUser && (
        <div style={styles.overlay} onClick={() => setQuickUpdateUser(null)}>
          <div style={{ ...styles.dialog, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>Actualizar Progreso de {quickUpdateUser?.name || 'Cliente'}</h2>
            </div>
            <div style={{ padding: '24px' }}>
              {quickUpdateUser?.wholesaleData?.historial_meses?.length > 0 && (
                <div style={{ marginBottom: 20, padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Historial Registrado</h3>
                  <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '12px', color: '#e2e8f0', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                          <th style={{ textAlign: 'left', padding: '4px 6px' }}>Mes</th>
                          <th style={{ textAlign: 'right', padding: '4px 6px' }}>Kilos</th>
                          <th style={{ textAlign: 'right', padding: '4px 6px' }}>Falta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quickUpdateUser.wholesaleData.historial_meses.map((h: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '4px 6px' }}>{h.mes}</td>
                            <td style={{ textAlign: 'right', padding: '4px 6px' }}>{h.kg} KG</td>
                            <td style={{ textAlign: 'right', padding: '4px 6px', color: h.falta_kg <= 0 ? '#4ade80' : '#f87171' }}>
                              {h.falta_kg <= 0 ? '✓ Meta' : `${h.falta_kg} KG`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Resumen del mes seleccionado para este cliente */}
              {(() => {
                const targetMonth = quickUpdateData.mes || selectedTableMonth || CURRENT_MONTH
                const mInfo = getClientMonthData(quickUpdateUser, targetMonth)
                const currentKg = mInfo.cumplido || 0
                const isFijar = quickUpdateData.modo === 'fijar'
                const directKg = quickUpdateData.kg_directos !== '' && quickUpdateData.kg_directos !== undefined ? Number(quickUpdateData.kg_directos) : currentKg
                const addKg = Number(quickUpdateData.kg_agregados) || 0
                const previewTotal = isFijar ? directKg : currentKg + addKg
                const previewFalta = Math.max(0, mInfo.meta - previewTotal)

                return (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 8,
                      padding: '12px',
                      background: '#0f172a',
                      borderRadius: 8,
                      marginBottom: 16,
                      border: '1px solid #1e293b',
                      textAlign: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Meta Mensual</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{formatKg(mInfo.meta)} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Actual en {targetMonth}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#4ade80', marginTop: 2 }}>{formatKg(currentKg)} KG</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Faltante Actual</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: mInfo.faltante <= 0 ? '#4ade80' : '#f87171', marginTop: 2 }}>
                          {mInfo.faltante <= 0 ? '✓ Meta' : `${formatKg(mInfo.faltante)} KG`}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={styles.label}>Mes a registrar / consultar</label>
                      <select
                        style={{ ...styles.input, backgroundColor: '#0f172a', marginTop: 4, fontWeight: 700 }}
                        value={quickUpdateData.mes}
                        onChange={e => {
                          const newM = e.target.value
                          const newMInfo = getClientMonthData(quickUpdateUser, newM)
                          setQuickUpdateData({
                            ...quickUpdateData,
                            mes: newM,
                            kg_directos: String(newMInfo.cumplido || 0)
                          })
                        }}
                      >
                        {MONTHS.map(m => (
                          <option key={m} value={m}>
                            {m} {m === CURRENT_MONTH ? '★ (Mes actual)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de modo: Sumar o Fijar Total */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      <button
                        type="button"
                        onClick={() => setQuickUpdateData({ ...quickUpdateData, modo: 'sumar' })}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: quickUpdateData.modo === 'sumar' ? '1px solid #0284c7' : '1px solid #334155',
                          background: quickUpdateData.modo === 'sumar' ? 'rgba(2, 132, 199, 0.2)' : '#1e293b',
                          color: quickUpdateData.modo === 'sumar' ? '#38bdf8' : '#94a3b8'
                        }}
                      >
                        ➕ Sumar Kilos
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickUpdateData({
                          ...quickUpdateData,
                          modo: 'fijar',
                          kg_directos: quickUpdateData.kg_directos !== '' ? quickUpdateData.kg_directos : String(currentKg)
                        })}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: quickUpdateData.modo === 'fijar' ? '1px solid #0284c7' : '1px solid #334155',
                          background: quickUpdateData.modo === 'fijar' ? 'rgba(2, 132, 199, 0.2)' : '#1e293b',
                          color: quickUpdateData.modo === 'fijar' ? '#38bdf8' : '#94a3b8'
                        }}
                      >
                        ✏️ Fijar Total Exacto
                      </button>
                    </div>

                    {quickUpdateData.modo === 'sumar' ? (
                      <div style={{ marginBottom: 16 }}>
                        <label style={styles.label}>¿Cuántos Kilos vas a sumar?</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 4 }}>
                          <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: 16 }}>+</span>
                          <input
                            style={styles.input}
                            type="number"
                            step="any"
                            placeholder="Ej: 50"
                            value={quickUpdateData.kg_agregados || ""}
                            onChange={e => setQuickUpdateData({ ...quickUpdateData, kg_agregados: e.target.value })}
                          />
                        </div>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', lineHeight: '1.4' }}>
                          Total resultará en: <strong style={{ color: '#38bdf8' }}>{formatKg(previewTotal)} KG</strong> (Faltante: <strong style={{ color: previewFalta <= 0 ? '#4ade80' : '#f87171' }}>{previewFalta <= 0 ? '✓ Meta cumplida' : `${formatKg(previewFalta)} KG`}</strong>).
                        </p>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 16 }}>
                        <label style={styles.label}>Kilos Totales del Mes</label>
                        <input
                          style={styles.input}
                          type="number"
                          step="any"
                          placeholder="Ej: 350"
                          value={quickUpdateData.kg_directos !== undefined ? quickUpdateData.kg_directos : currentKg}
                          onChange={e => setQuickUpdateData({ ...quickUpdateData, kg_directos: e.target.value })}
                        />
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', lineHeight: '1.4' }}>
                          Se guardará directamente <strong style={{ color: '#38bdf8' }}>{formatKg(previewTotal)} KG</strong> para {targetMonth}.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setQuickUpdateUser(null)}>Cancelar</button>
              <button
                style={{ ...styles.btnPrimary, opacity: isSaving ? 0.7 : 1 }}
                disabled={isSaving}
                onClick={handleSaveQuickUpdate}
              >
                {isSaving ? 'Guardando...' : 'Actualizar Progreso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {userToDelete && (
        <div style={styles.overlay} onClick={() => setUserToDelete(null)}>
          <div style={{ ...styles.dialog, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>⚠️ Confirmar Eliminación</h2>
            </div>
            <div style={styles.dialogBody}>
              <p style={{ color: '#e2e8f0', fontSize: 14 }}>
                ¿Estás seguro de que deseas eliminar a <strong>{userToDelete.name}</strong>?
              </p>
            </div>
            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setUserToDelete(null)}>Cancelar</button>
              <button
                style={{ ...styles.btnDanger, background: 'rgba(239,68,68,0.1)' }}
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR ALL DIALOG */}
      {isClearAllDialogOpen && (
        <div style={styles.overlay} onClick={() => !isClearingAll && setIsClearAllDialogOpen(false)}>
          <div style={{ ...styles.dialog, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={{ ...styles.dialogTitle, color: '#f87171' }}>🗑️ Vaciar Toda la Data de Mayoristas</h2>
              <button 
                style={{ ...styles.btnGhost, padding: '4px 10px' }} 
                disabled={isClearingAll}
                onClick={() => setIsClearAllDialogOpen(false)}
              >✕</button>
            </div>
            <div style={styles.dialogBody}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 10,
                padding: '16px',
                marginBottom: '16px',
              }}>
                <p style={{ color: '#fca5a5', fontSize: 14, margin: '0 0 8px 0', fontWeight: 600 }}>
                  ⚠️ ¿Estás completamente seguro de vaciar el directorio?
                </p>
                <p style={{ color: '#e2e8f0', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  Esta acción eliminará de forma permanente los <strong>{users.length} clientes mayoristas</strong> registrados actualmente en el sistema.
                </p>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Usa este botón si deseas purgar filas residuales, pruebas anteriores o registros duplicados. Luego de vaciar, puedes usar <strong>"Sincronizar Google Drive"</strong> o <strong>"Importar mayoristas.xlsx"</strong> para cargar únicamente la información limpia y actualizada.
              </p>
            </div>
            <div style={styles.dialogFooter}>
              <button 
                style={styles.btnGhost} 
                disabled={isClearingAll} 
                onClick={() => setIsClearAllDialogOpen(false)}
              >
                Cancelar
              </button>
              <button
                style={{ ...styles.btnDangerSolid, opacity: isClearingAll ? 0.7 : 1 }}
                disabled={isClearingAll}
                onClick={handleClearAllMayoristas}
              >
                {isClearingAll ? '⏳ Vaciando directorio...' : `🗑️ Sí, borrar los ${users.length} clientes`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG EDIT/CREATE */}
      {isDialogOpen && (
        <div style={styles.overlay} onClick={() => setIsDialogOpen(false)}>
          <div style={styles.dialog} onClick={e => e.stopPropagation()}>
            <div style={styles.dialogHeader}>
              <h2 style={styles.dialogTitle}>
                {formData._id ? '✏️ Editar Cliente Mayorista' : '🆕 Nuevo Cliente Mayorista'}
              </h2>
              <button style={{ ...styles.btnGhost, padding: '6px 12px' }} onClick={() => setIsDialogOpen(false)}>✕ Cerrar</button>
            </div>

            <div style={styles.dialogBody}>
              <span style={styles.sectionLabelFirst}>1. Datos de Acceso al Portal</span>
              <div style={styles.grid2}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre Completo *</label>
                  <input style={styles.input} value={formData.name} onChange={e => set('name', e.target.value)} placeholder="Ej: E-Commerce Ltda." />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Correo Electrónico (Login) *</label>
                  <input style={styles.input} value={formData.email} onChange={e => set('email', e.target.value)} placeholder="correo@empresa.com" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Contraseña {formData._id && '(dejar en blanco = sin cambiar)'}</label>
                  <input style={styles.input} type="password" value={formData.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <span style={styles.sectionLabel}>2. Datos Corporativos</span>
              <div style={styles.grid3}>
                {[
                  { label: 'Razón Social / Cliente', field: 'cliente', ph: 'E-Commerce Ltda.' },
                  { label: 'Cédula / NIT', field: 'cedula', ph: '99401344' },
                  { label: 'Encargado', field: 'encargado', ph: 'Juan Pérez' },
                  { label: 'Teléfono', field: 'telefono', ph: '310...' },
                  { label: 'Dirección', field: 'direccion', ph: 'Carrera...' },
                  { label: 'Condición de Facturación', field: 'facturacion', ph: '1' },
                ].map(f => (
                  <div key={f.field} style={styles.formGroup}>
                    <label style={styles.label}>{f.label}</label>
                    <input style={styles.input} value={formData.wholesaleData[f.field]} onChange={e => set(f.field, e.target.value, true)} placeholder={f.ph} />
                  </div>
                ))}
              </div>

              <span style={styles.sectionLabel}>3. Acuerdos Comerciales</span>
              <div style={styles.grid3}>
                {[
                  { label: 'Acuerdo $ MT', field: 'acuerdo_mt', ph: '$12,000' },
                  { label: 'Acuerdo $ KG', field: 'acuerdo_kg', ph: '$39,600' },
                  { label: 'Acuerdo KG Mensual ($)', field: 'acuerdo_kg_mes', ph: 'Meta en dinero' },
                  { label: 'Tiempos / Condiciones de Pago', field: 'tiempos', ph: 'Antes del 30 de cada mes' },
                ].map(f => (
                  <div key={f.field} style={styles.formGroup}>
                    <label style={styles.label}>{f.label}</label>
                    <input style={styles.input} value={formData.wholesaleData[f.field]} onChange={e => set(f.field, e.target.value, true)} placeholder={f.ph} />
                  </div>
                ))}
                {[
                  { label: 'Cuota Mínima Mensual (KG)', field: 'volumen_mes_kg' },
                  { label: 'Cuota Mínima Mensual (MT)', field: 'volumen_mes_mt' },
                  { label: 'Compra Mínima por Pedido (KG)', field: 'volumen_compra_kg' },
                ].map(f => (
                  <div key={f.field} style={styles.formGroup}>
                    <label style={styles.label}>{f.label}</label>
                    <input style={styles.input} type="number" value={formData.wholesaleData[f.field]} onChange={e => set(f.field, e.target.value, true)} />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={styles.sectionLabel}>4. Avance del Mes</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Mes a editar:</span>
                  <select
                    value={formData.mesEdicion || selectedTableMonth || CURRENT_MONTH}
                    onChange={e => {
                      const newM = e.target.value
                      const mInfo = getClientMonthData(formData, newM)
                      setFormData((prev: any) => ({
                        ...prev,
                        mesEdicion: newM,
                        wholesaleData: {
                          ...prev.wholesaleData,
                          brush_kg_cumplido: mInfo.cumplido,
                          brush_mt_cumplido: mInfo.mtCumplido,
                          cuanto_falto_kg: mInfo.faltante,
                          cuanto_falto_mt: mInfo.faltanteMt,
                          cuanto_falto_dinero: mInfo.faltaDinero || prev.wholesaleData.cuanto_falto_dinero
                        }
                      }))
                    }}
                    style={{
                      background: '#0f172a',
                      border: '1px solid #0284c7',
                      borderRadius: 6,
                      color: '#38bdf8',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    {MONTHS.map(m => (
                      <option key={m} value={m}>
                        {m} {m === CURRENT_MONTH ? '★ (Actual)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.accentBox}>
                <div style={{ ...styles.grid3, marginBottom: 0 }}>
                  {[
                    { label: '✅ KG Cumplido', field: 'brush_kg_cumplido', color: '#4ade80' },
                    { label: '⚠️ KG Faltante', field: 'cuanto_falto_kg', color: '#f87171' },
                    { label: '✅ MT Cumplido', field: 'brush_mt_cumplido', color: '#4ade80' },
                    { label: '⚠️ MT Faltante', field: 'cuanto_falto_mt', color: '#f87171' },
                    { label: '💰 Faltante en $', field: 'cuanto_falto_dinero', color: '#f87171', text: true },
                    { label: '💬 Mensaje Destacado (Panel)', field: 'mensaje_personalizado', text: true },
                  ].map((f: any) => (
                    <div key={f.field} style={styles.formGroup}>
                      <label style={{ ...styles.label, color: f.color || '#94a3b8' }}>{f.label}</label>
                      <input
                        style={{ ...styles.input, borderColor: f.color ? `${f.color}33` : '#334155' }}
                        type={f.text ? 'text' : 'number'}
                        value={formData.wholesaleData[f.field]}
                        onChange={e => set(f.field, e.target.value, true)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.dialogFooter}>
              <button style={styles.btnGhost} onClick={() => setIsDialogOpen(false)}>Cancelar</button>
              <button
                style={{ ...styles.btnPrimary, opacity: isSaving ? 0.7 : 1 }}
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? 'Guardando...' : (formData._id ? 'Actualizar Mayorista' : 'Crear Mayorista')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function WholesaleManagerWrapper() {
  return <WholesaleManager />
}
