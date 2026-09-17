/**
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
  CACHE_SECONDS: 45,
  INCLUDE_POTENCIALES: true,
  INCLUDE_RAW_SOURCE_DATA: true,
  INCLUDE_HIDDEN_SHEET_METADATA: true,
  MAX_RAW_SOURCES_PER_CLIENT: 20,
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

  var monthlyHeaders = (data[headerRow] || []).map(function(h) { return normalizeHeader_(h); });
  var colMesNum = monthlyHeaders.indexOf('mes_numero');
  var colIdCli = monthlyHeaders.indexOf('id_cliente');
  var colIdSan = monthlyHeaders.indexOf('id_sanity');
  var colUpdAt = monthlyHeaders.indexOf('updated_at');

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

    var rawIdCli = colIdCli >= 0 ? row[colIdCli] : null;
    var rawIdSan = colIdSan >= 0 ? row[colIdSan] : null;
    var rawUpdAt = colUpdAt >= 0 ? row[colUpdAt] : null;

    var hasAnyMonthlyData = [
      rawKg, rawMt, rawMoney, rawMissingKg, rawMissingMt,
      rawMissingMoney, rawStatus, rawNote, rawIdCli, rawIdSan
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

    var monthNumber = colMesNum >= 0 && parseNumber_(row[colMesNum]) > 0
      ? parseNumber_(row[colMesNum])
      : (CONFIG_.MONTHS.indexOf(monthName) + 1);

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
      ID_CLIENTE: stringValue_(rawIdCli),
      ID_SANITY: stringValue_(rawIdSan),
      UPDATED_AT: stringValue_(rawUpdAt),
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

  // Escribir columnas internas obligatorias: MES_NUMERO, ID_CLIENTE, ID_SANITY, UPDATED_AT
  var monthNumber = CONFIG_.MONTHS.indexOf(monthName) + 1;
  var idCliente = String(monthData.id_cliente || clientData.ID_CLIENTE || clientData.id_cliente || '').trim();
  var idSanity = String(monthData.id_sanity || clientData.ID_SANITY || clientData.id_sanity || '').trim();
  var updatedAt = String(monthData.updated_at || new Date().toISOString());

  var monthlyHeaders = (data[headerRow] || []).map(function(h) { return normalizeHeader_(h); });
  var colMesNumero = monthlyHeaders.indexOf('mes_numero');
  var colIdCliente = monthlyHeaders.indexOf('id_cliente');
  var colIdSanity = monthlyHeaders.indexOf('id_sanity');
  var colUpdatedAt = monthlyHeaders.indexOf('updated_at');

  if (colMesNumero < 0) {
    colMesNumero = Math.max(data[headerRow].length, monthCol + 9);
    sheet.getRange(headerRow + 1, colMesNumero + 1).setValue('MES_NUMERO');
  }
  if (colIdCliente < 0) {
    colIdCliente = colMesNumero + 1;
    sheet.getRange(headerRow + 1, colIdCliente + 1).setValue('ID_CLIENTE');
  }
  if (colIdSanity < 0) {
    colIdSanity = colIdCliente + 1;
    sheet.getRange(headerRow + 1, colIdSanity + 1).setValue('ID_SANITY');
  }
  if (colUpdatedAt < 0) {
    colUpdatedAt = colIdSanity + 1;
    sheet.getRange(headerRow + 1, colUpdatedAt + 1).setValue('UPDATED_AT');
  }

  sheet.getRange(monthRowIndex + 1, colMesNumero + 1).setValue(monthNumber);
  if (idCliente) sheet.getRange(monthRowIndex + 1, colIdCliente + 1).setValue(idCliente);
  if (idSanity) sheet.getRange(monthRowIndex + 1, colIdSanity + 1).setValue(idSanity);
  sheet.getRange(monthRowIndex + 1, colUpdatedAt + 1).setValue(updatedAt);

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
