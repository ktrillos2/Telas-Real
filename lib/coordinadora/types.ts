/**
 * Definiciones de tipos para la integración de Coordinadora y el cotizador de envíos.
 */

export interface CoordinadoraTokenResponse {
  access_token?: string;
  acces_token?: string; // Typo en documentación oficial de Coordinadora
  token_type?: string;
  expires_in: number;
  scope?: string;
}

export interface CoordinadoraQuoteDetailItem {
  ubl: string;
  alto: string;
  ancho: string;
  largo: string;
  peso: string;
  unidades: string;
}

export interface CoordinadoraQuoteRequest {
  nit: string;
  div: string;
  cuenta: string;
  producto: string;
  codigo_postal_origen: "";
  codigo_postal_destino: "";
  origen: string;
  destino: string;
  valoracion: number;
  nivel_servicio: string;
  detalle: CoordinadoraQuoteDetailItem[];
}

export interface CoordinadoraQuoteResponseData {
  flete_fijo?: number;
  flete_variable?: number;
  otros_valores?: number;
  impuestos?: number;
  total?: number;
  valor_envio?: number;
  dias_entrega?: number;
  peso_real?: number;
  peso_liquidado?: number;
  volumen?: number;
  [key: string]: unknown;
}

export interface CoordinadoraQuoteResponse {
  isError?: boolean;
  data?: CoordinadoraQuoteResponseData;
  id?: string;
  message?: string;
  status?: number | string;
  [key: string]: unknown;
}

/**
 * Formato normalizado interno que expone el backend al checkout.
 */
export interface ShippingQuote {
  provider: "coordinadora";
  amount: number;
  estimatedBusinessDays: number | null;
  realWeight?: number;
  billedWeight?: number;
  volume?: number;
  providerQuoteId?: string;
}

export interface QuoteRequestItem {
  productId: string;
  slug?: string;
  quantity: number;
}

export interface InternalQuoteRequestBody {
  destinationDane: string;
  items: QuoteRequestItem[];
}

export interface InternalQuoteSuccessResponse {
  success: true;
  quote: ShippingQuote;
}

export interface InternalQuoteErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

export type InternalQuoteResponseBody =
  | InternalQuoteSuccessResponse
  | InternalQuoteErrorResponse;

export interface CoordinadoraPopulation {
  dane: string;
  nombre: string;
  displayName: string;
  departamento: string;
  tipoPoblacion: string;
  terminal?: string;
  aplicaContraentrega: boolean;
}

export interface ProductShippingDimensions {
  weightKg?: number;
  heightCm?: number;
  widthCm?: number;
  lengthCm?: number;
  ubl?: string;
}
