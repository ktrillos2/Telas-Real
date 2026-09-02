/**
 * ==============================================================================
 * SCRIPT DE CONEXIÓN EN VIVO: GOOGLE DRIVE / SHEETS <-> TELAS REAL (SANITY & WEB)
 * ==============================================================================
 * 
 * Este script está adaptado al 100% a la estructura exacta de tu archivo de
 * mayoristas (incluyendo hojas maestras 'XIOMARA MAYORISTAS', 'CLIENTES BRUSH'
 * y todas las hojas individuales por cliente con sus tablas mensuales de avance).
 * 
 * INSTRUCCIONES DE INSTALACIÓN (1 MINUTO):
 * 1. En tu archivo de Google Sheets (en Google Drive), ve al menú:
 *    Extensiones > Apps Script
 * 2. Borra todo el código que aparezca y pega este archivo completo.
 * 3. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 4. Tipo: "Aplicación web".
 * 5. Configuración:
 *    - Descripción: Conexión Telas Real CRM Mayoristas
 *    - Ejecutar como: "Yo" (tu cuenta)
 *    - Quién tiene acceso: "Cualquier persona" (Anyone) -> ¡MUY IMPORTANTE!
 * 6. Haz clic en "Implementar", autoriza los permisos y copia la "URL de la aplicación web".
 * 7. Pega esa URL en el panel de Sanity (Gestión Mayoristas > Configurar Drive).
 * ==============================================================================
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var result = {
      status: "success",
      spreadsheetName: ss.getName(),
      sheets: [],
      clients: []
    };

    var clientMap = {};

    sheets.forEach(function(sheet) {
      var sheetName = sheet.getName().trim();
      if (sheetName.startsWith("_") || sheet.isSheetHidden() || sheetName.toUpperCase() === "FILTRO") return;

      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return;

      result.sheets.push({
        name: sheetName,
        totalRows: data.length
      });

      var upperName = sheetName.toUpperCase();

      // =========================================================================
      // CASO 1: HOJA MAESTRA "XIOMARA MAYORISTAS" O SIMILARES
      // =========================================================================
      if (upperName.includes("XIOMARA")) {
        parseXiomaraSheet(data, clientMap);
      }
      // =========================================================================
      // CASO 2: HOJAS DE DIRECTORIO "CLIENTES BRUSH" / "DASH CLIENTES BRUSH"
      // =========================================================================
      else if (upperName.includes("CLIENTES BRUSH") || upperName.includes("POTENCIALES")) {
        parseDirectorySheet(data, clientMap);
      }
      // =========================================================================
      // CASO 3: HOJAS INDIVIDUALES POR CLIENTE (MARIO TOVAR, MAIRA, NOVOA, ETC.)
      // =========================================================================
      else if (data.length >= 2) {
        parseIndividualClientSheet(data, sheetName, clientMap);
      }
    });

    for (var k in clientMap) {
      result.clients.push(clientMap[k]);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "update_client") {
      var clientData = postData.client;
      var updated = updateClientInSheets(ss, clientData);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        updatedRows: updated
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Acción completada"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================================================
// PARSERS ESPECÍFICOS SEGÚN LA ESTRUCTURA DEL EXCEL
// =============================================================================

function parseXiomaraSheet(data, clientMap) {
  var headers = data[0].map(function(h) { return normalizeHeader(String(h)); });
  
  var idxC = findHeaderIndex(headers, ["cliente", "razon", "empresa", "nombre"], 1);
  var idxCed = findHeaderIndex(headers, ["cedula", "nit", "doc"], 3);
  var idxEnc = findHeaderIndex(headers, ["encargado", "contacto"], 2);
  var idxDir = findHeaderIndex(headers, ["direccion", "ubicacion"], 4);
  var idxTel = findHeaderIndex(headers, ["telefono", "celular", "tel"], 5);
  var idxFact = findHeaderIndex(headers, ["facturacion", "factura"], 6);
  var idxAmt = findHeaderIndex(headers, ["acuerdo_mt", "precio_mt"], 7);
  var idxAkg = findHeaderIndex(headers, ["acuerdo_kg", "precio_kg"], 8);
  var idxVkg = findHeaderIndex(headers, ["volumen_mes_kg", "meta_kg"], 9);
  var idxVcomp = findHeaderIndex(headers, ["volumen_por_compra", "volumen_compra"], 10);
  var idxAkgMes = findHeaderIndex(headers, ["acuerdo_kg_brush_p_mes", "acuerdo_mes"], 11);
  var idxTiempos = findHeaderIndex(headers, ["tiempos", "plazo", "condiciones"], 12);

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row || row.length < 2) continue;

    var cName = "";
    var cCed = "";

    // Si empieza con número de fila (ej: '1.0')
    if (String(row[0]).match(/^[0-9]+(\.[0-9]+)?$/)) {
      cName = String(row[idxC] || "").trim();
      cCed = cleanCedula(row[idxCed]);
    } else if (String(row[0]).trim()) {
      // Fila sin número de orden (contacto directo)
      cName = String(row[0]).trim();
      cCed = cleanCedula(row[1]);
    }

    if (!cName && !cCed) continue;
    var key = (cCed || cName).toLowerCase().trim();

    var existing = clientMap[key] || createBaseClientObj(cName, cCed);
    existing.cliente = existing.cliente || cName;
    existing.name = existing.name || cName;
    existing.cedula = existing.cedula || cCed;
    if (row[idxEnc]) existing.encargado = String(row[idxEnc]).trim();
    if (row[idxDir]) existing.direccion = String(row[idxDir]).trim();
    if (row[idxTel]) existing.telefono = cleanPhone(row[idxTel]);
    if (row[idxFact]) existing.facturacion = String(row[idxFact]).trim();
    if (row[idxAmt]) existing.acuerdo_mt = formatMoney(row[idxAmt]);
    if (row[idxAkg]) existing.acuerdo_kg = formatMoney(row[idxAkg]);
    if (row[idxVkg]) existing.volumen_mes_kg = parseNum(row[idxVkg]);
    if (row[idxVcomp]) existing.volumen_compra_kg = parseNum(row[idxVcomp]);
    if (row[idxAkgMes]) existing.acuerdo_kg_mes = formatMoney(row[idxAkgMes]);
    if (row[idxTiempos]) existing.tiempos = String(row[idxTiempos]).trim();

    clientMap[key] = existing;
  }
}

function parseDirectorySheet(data, clientMap) {
  var headerRowIdx = -1;
  for (var r = 0; r < Math.min(6, data.length); r++) {
    var rowStr = data[r].join(" ").toUpperCase();
    if (rowStr.includes("NOMBRE") || rowStr.includes("CLIENTE") || rowStr.includes("CÉDULA")) {
      headerRowIdx = r;
      break;
    }
  }

  if (headerRowIdx < 0) return;
  var headers = data[headerRowIdx].map(function(h) { return normalizeHeader(String(h)); });

  var idxC = findHeaderIndex(headers, ["nombre_del_cliente", "cliente", "nombre"], 1);
  var idxCed = findHeaderIndex(headers, ["cedula", "nit", "doc"], 2);
  var idxTel = findHeaderIndex(headers, ["celular", "telefono"], 3);
  var idxEmail = findHeaderIndex(headers, ["correo", "email"], 4);
  var idxCity = findHeaderIndex(headers, ["ciudad", "municipio"], -1);
  var idxAkg = findHeaderIndex(headers, ["precio_especial_kg", "acuerdo_kg"], -1);
  var idxAmt = findHeaderIndex(headers, ["precio_especial_mt", "acuerdo_mt"], -1);
  var idxObs = findHeaderIndex(headers, ["observaciones", "tela_y_observaciones"], -1);

  for (var i = headerRowIdx + 1; i < data.length; i++) {
    var row = data[i];
    if (!row || row.length < 2) continue;

    var cName = String(row[idxC] || "").trim();
    var cCed = cleanCedula(row[idxCed]);
    if (!cName && !cCed) continue;

    var key = (cCed || cName).toLowerCase().trim();
    var existing = clientMap[key] || createBaseClientObj(cName, cCed);

    existing.cliente = existing.cliente || cName;
    existing.name = existing.name || cName;
    existing.cedula = existing.cedula || cCed;
    if (idxTel >= 0 && row[idxTel] && !existing.telefono) existing.telefono = cleanPhone(row[idxTel]);
    if (idxEmail >= 0 && row[idxEmail] && !existing.email) existing.email = String(row[idxEmail]).trim().toLowerCase();
    if (idxCity >= 0 && row[idxCity] && !existing.direccion) existing.direccion = String(row[idxCity]).trim();
    if (idxAkg >= 0 && row[idxAkg] && !existing.acuerdo_kg) existing.acuerdo_kg = formatMoney(row[idxAkg]);
    if (idxAmt >= 0 && row[idxAmt] && !existing.acuerdo_mt) existing.acuerdo_mt = formatMoney(row[idxAmt]);
    if (idxObs >= 0 && row[idxObs] && !existing.mensaje_personalizado) existing.mensaje_personalizado = String(row[idxObs]).trim();

    clientMap[key] = existing;
  }
}

function parseIndividualClientSheet(data, sheetName, clientMap) {
  var h1 = data[0].map(function(h) { return normalizeHeader(String(h)); });
  var cRow = data[1];

  var idxC = findHeaderIndex(h1, ["cliente", "razon", "empresa", "nombre"], 1);
  var idxCed = findHeaderIndex(h1, ["cedula", "nit", "doc"], 3);
  var idxEnc = findHeaderIndex(h1, ["encargado", "contacto"], 2);
  var idxDir = findHeaderIndex(h1, ["direccion", "ubicacion"], 4);
  var idxTel = findHeaderIndex(h1, ["telefono", "celular", "tel"], 5);
  var idxFact = findHeaderIndex(h1, ["facturacion", "factura"], 6);
  var idxAmt = findHeaderIndex(h1, ["acuerdo_mt", "precio_mt"], 7);
  var idxAkg = findHeaderIndex(h1, ["acuerdo_kg", "precio_kg"], 8);
  var idxVkg = findHeaderIndex(h1, ["volumen_mes_kg", "meta_kg"], 9);
  var idxVmt = findHeaderIndex(h1, ["volumen_mes_mt", "meta_mt"], 10);
  var idxVcomp = findHeaderIndex(h1, ["volumen_por_compra", "volumen_compra"], 11);
  var idxTiempos = findHeaderIndex(h1, ["tiempos", "plazo"], 13);

  var cName = (cRow && cRow[idxC]) ? String(cRow[idxC]).trim() : sheetName;
  var cCed = (cRow && cRow[idxCed]) ? cleanCedula(cRow[idxCed]) : "";
  var key = (cCed || cName).toLowerCase().trim();

  var existing = clientMap[key] || createBaseClientObj(cName, cCed);
  existing.cliente = existing.cliente || cName;
  existing.name = existing.name || cName;
  existing.cedula = existing.cedula || cCed;

  if (cRow) {
    if (cRow[idxEnc]) existing.encargado = String(cRow[idxEnc]).trim();
    if (cRow[idxDir]) existing.direccion = String(cRow[idxDir]).trim();
    if (cRow[idxTel]) existing.telefono = cleanPhone(cRow[idxTel]);
    if (cRow[idxFact]) existing.facturacion = String(cRow[idxFact]).trim();
    if (cRow[idxAmt]) existing.acuerdo_mt = formatMoney(cRow[idxAmt]);
    if (cRow[idxAkg]) existing.acuerdo_kg = formatMoney(cRow[idxAkg]);
    if (cRow[idxVkg]) existing.volumen_mes_kg = parseNum(cRow[idxVkg]);
    if (cRow[idxVmt]) existing.volumen_mes_mt = parseNum(cRow[idxVmt]);
    if (cRow[idxVcomp]) existing.volumen_compra_kg = parseNum(cRow[idxVcomp]);
    if (cRow[idxTiempos]) existing.tiempos = String(cRow[idxTiempos]).trim();
  }

  // Extraer meses de la tabla (desde fila 3 o 4)
  var monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  var monthHist = existing.historial_meses || [];

  for (var r = 2; r < data.length; r++) {
    var row = data[r];
    if (!row || !row[0]) continue;
    var mName = String(row[0]).trim().toUpperCase();

    if (monthNames.indexOf(mName) >= 0) {
      var kgVal = parseNum(row[1]);
      var mtVal = parseNum(row[2]);
      var dineroVal = row[3];
      var faltaKg = parseNum(row[4]);
      var faltaMt = parseNum(row[5]);
      var faltaDinero = row[6];

      if (kgVal > 0 || mtVal > 0 || parseNum(dineroVal) > 0) {
        var exists = monthHist.some(function(h) { return h.mes === mName; });
        if (!exists) {
          monthHist.push({
            mes: mName,
            kg: kgVal,
            mt: mtVal,
            cuanto_va_dinero: formatMoney(dineroVal || (kgVal * parseNum(existing.acuerdo_kg))),
            falta_kg: faltaKg,
            falta_mt: faltaMt,
            falta_dinero: formatMoney(faltaDinero)
          });
        }

        // Si es el mes más reciente, actualizar acumulado del mes
        existing.brush_kg_cumplido = kgVal;
        existing.brush_mt_cumplido = mtVal;
        existing.cuanto_falto_kg = faltaKg;
        existing.cuanto_falto_mt = faltaMt;
        existing.cuanto_falto_dinero = formatMoney(faltaDinero);
      }
    }
  }

  existing.historial_meses = monthHist;
  clientMap[key] = existing;
}

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

function createBaseClientObj(cName, cCed) {
  var cleanCed = cleanCedula(cCed);
  return {
    cliente: cName || "",
    name: cName || "",
    email: cleanCed ? "mayorista_" + cleanCed + "@telasreal.com" : "",
    cedula: cleanCed,
    encargado: "E-COMMERCE",
    telefono: "",
    direccion: "",
    facturacion: "1",
    acuerdo_mt: "$12,000",
    acuerdo_kg: "$39,600",
    volumen_mes_kg: 0,
    volumen_mes_mt: 0,
    volumen_compra_kg: 0,
    acuerdo_kg_mes: "",
    tiempos: "Acumulados del mes y pagando antes del 30 de cada mes",
    brush_kg_cumplido: 0,
    brush_mt_cumplido: 0,
    cuanto_falto_kg: 0,
    cuanto_falto_mt: 0,
    cuanto_falto_dinero: "",
    mensaje_personalizado: "",
    historial_meses: []
  };
}

function normalizeHeader(h) {
  return h.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function findHeaderIndex(headers, searchTerms, defaultIdx) {
  for (var i = 0; i < headers.length; i++) {
    for (var j = 0; j < searchTerms.length; j++) {
      if (headers[i].includes(searchTerms[j])) return i;
    }
  }
  return defaultIdx !== undefined ? defaultIdx : -1;
}

function cleanCedula(v) {
  if (!v) return "";
  var s = String(v).trim();
  if (s.indexOf("E") >= 0) {
    var n = parseFloat(s);
    if (!isNaN(n)) return Math.round(n).toString();
  }
  return s.replace(/\.0$/, "").replace(/\s+/g, "");
}

function cleanPhone(v) {
  if (!v) return "";
  var s = String(v).trim();
  if (s.indexOf("E") >= 0) {
    var n = parseFloat(s);
    if (!isNaN(n)) return Math.round(n).toString();
  }
  return s.replace(/\.0$/, "").trim();
}

function parseNum(v) {
  if (typeof v === "number") return v;
  if (!v) return 0;
  var clean = String(v).replace(/[^0-9.-]/g, "");
  var n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

function formatMoney(v) {
  if (!v) return "$0";
  if (typeof v === "string" && v.startsWith("$")) return v;
  var n = parseNum(v);
  return "$" + Math.round(n).toLocaleString("es-CO");
}

function updateClientInSheets(ss, clientData) {
  var sheets = ss.getSheets();
  var updatedCount = 0;
  var targetCedula = cleanCedula(clientData.cedula);

  sheets.forEach(function(sheet) {
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    // Buscar en hoja individual
    if (sheet.getName().trim().toUpperCase() === String(clientData.cliente || "").trim().toUpperCase()) {
      // Actualizar mes actual en la tabla
      var monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      for (var r = 2; r < data.length; r++) {
        var mName = String(data[r][0]).trim().toUpperCase();
        if (monthNames.indexOf(mName) >= 0 && clientData.brush_kg_cumplido !== undefined) {
          sheet.getRange(r + 1, 2).setValue(clientData.brush_kg_cumplido);
          updatedCount++;
          break;
        }
      }
    }
  });

  return updatedCount;
}
