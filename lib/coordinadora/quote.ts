import { getCoordinadoraConfig } from './config';
import { getCoordinadoraToken, clearTokenCache } from './auth';
import {
  CoordinadoraQuoteDetailItem,
  CoordinadoraQuoteRequest,
  CoordinadoraQuoteResponse,
  ShippingQuote
} from './types';

export class CoordinadoraQuoteError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = 'QUOTE_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'CoordinadoraQuoteError';
  }
}

export interface QuoteShipmentParams {
  destinationDane: string;
  declaredValue: number;
  items: CoordinadoraQuoteDetailItem[];
}

/**
 * Realiza la cotización nacional de envío mediante la API oficial de Coordinadora.
 * Toda la comunicación se ejecuta exclusivamente desde el backend.
 */
export async function quoteCoordinadoraShipment(
  params: QuoteShipmentParams,
  isRetry = false
): Promise<ShippingQuote> {
  const config = getCoordinadoraConfig();

  const destinationDane = String(params.destinationDane || '').trim().padStart(8, '0');
  if (!destinationDane || destinationDane === '00000000') {
    throw new CoordinadoraQuoteError('El código DANE de destino es inválido o no fue suministrado.', 400, 'INVALID_DESTINATION_DANE');
  }

  if (!params.items || params.items.length === 0) {
    throw new CoordinadoraQuoteError('No hay ítems para cotizar en el envío.', 400, 'EMPTY_ITEMS');
  }

  const token = await getCoordinadoraToken();

  const requestBody: CoordinadoraQuoteRequest = {
    nit: config.nit,
    div: config.div,
    cuenta: config.cuenta,
    producto: config.producto,
    codigo_postal_origen: '',
    codigo_postal_destino: '',
    origen: config.origenDane,
    destino: destinationDane,
    valoracion: Math.max(1, Math.round(params.declaredValue)),
    nivel_servicio: config.nivelServicio || '',
    detalle: params.items.map(item => ({
      ubl: item.ubl || config.ublDefault || '0',
      alto: String(item.alto),
      ancho: String(item.ancho),
      largo: String(item.largo),
      peso: String(item.peso),
      unidades: String(item.unidades)
    }))
  };

  const url = `${config.baseUrl}/cotizador/nacional`;

  if (process.env.NODE_ENV === 'development') {
    console.log('[Coordinadora] Enviando cotización nacional a:', url);
    // Log seguro sin exponer credenciales
    console.log('[Coordinadora Request Payload]:', JSON.stringify({
      ...requestBody,
      nit: '***',
      cuenta: '***'
    }, null, 2));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      cache: 'no-store'
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new CoordinadoraQuoteError(
        'Tiempo de espera agotado al consultar el cotizador de Coordinadora.',
        504,
        'TIMEOUT'
      );
    }
    throw new CoordinadoraQuoteError(
      `Error de red al conectar con el cotizador de Coordinadora: ${err.message}`,
      502,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Si devuelve 401 y no hemos reintentado, limpiar caché de token y reintentar una sola vez
  if (response.status === 401 && !isRetry) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Coordinadora] Token rechazado (401), renovando token y reintentando cotización...');
    }
    clearTokenCache();
    await getCoordinadoraToken(true);
    return quoteCoordinadoraShipment(params, true);
  }

  let jsonResponse: CoordinadoraQuoteResponse;
  try {
    jsonResponse = await response.json();
  } catch (parseErr) {
    throw new CoordinadoraQuoteError(
      'La respuesta del cotizador de Coordinadora no tiene un formato JSON válido.',
      502,
      'INVALID_JSON'
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Coordinadora Response]:', JSON.stringify(jsonResponse, null, 2));
  }

  if (!response.ok || jsonResponse.isError) {
    const errorMsg = jsonResponse.message || 'Error en la cotización de Coordinadora';
    
    // Identificar errores de trayecto o acuerdo vigente
    if (typeof errorMsg === 'string' && /trayecto/i.test(errorMsg)) {
      throw new CoordinadoraQuoteError(
        'No se encontraron trayectos disponibles entre el origen y el destino seleccionado.',
        400,
        'NO_ROUTE_FOUND',
        jsonResponse
      );
    }

    if (typeof errorMsg === 'string' && /acuerdo vigente/i.test(errorMsg)) {
      throw new CoordinadoraQuoteError(
        'No se encontró un acuerdo vigente para la configuración solicitada.',
        400,
        'NO_AGREEMENT',
        jsonResponse
      );
    }

    throw new CoordinadoraQuoteError(
      errorMsg,
      response.status || 400,
      'COORDINADORA_API_ERROR',
      jsonResponse
    );
  }

  const quoteData = jsonResponse.data;
  if (!quoteData) {
    throw new CoordinadoraQuoteError(
      'El cotizador de Coordinadora no retornó información de tarifas.',
      502,
      'NO_DATA',
      jsonResponse
    );
  }

  // Usar valor_envio como costo final mostrado al cliente
  const amount = typeof quoteData.valor_envio === 'number' 
    ? quoteData.valor_envio 
    : Number(quoteData.total || 0);

  const estimatedBusinessDays = typeof quoteData.dias_entrega === 'number'
    ? quoteData.dias_entrega
    : (quoteData.dias_entrega ? Number(quoteData.dias_entrega) : null);

  const normalizedQuote: ShippingQuote = {
    provider: 'coordinadora',
    amount: Math.round(amount),
    estimatedBusinessDays,
    realWeight: typeof quoteData.peso_real === 'number' ? quoteData.peso_real : undefined,
    billedWeight: typeof quoteData.peso_liquidado === 'number' ? quoteData.peso_liquidado : undefined,
    volume: typeof quoteData.volumen === 'number' ? quoteData.volumen : undefined,
    providerQuoteId: typeof jsonResponse.id === 'string' ? jsonResponse.id : undefined
  };

  return normalizedQuote;
}
