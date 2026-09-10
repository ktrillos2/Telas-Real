import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '@/sanity/env';
import { findPopulationByDane } from './locations';
import { quoteCoordinadoraShipment, CoordinadoraQuoteError } from './quote';
import { getCoordinadoraConfig } from './config';
import {
  QuoteRequestItem,
  ShippingQuote,
  CoordinadoraQuoteDetailItem,
  ProductShippingDimensions
} from './types';

// Cliente Sanity server-side sin CDN para obtener datos autoritativos
function getSanityServerClient() {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
  });
}

export interface QuoteCartShippingParams {
  destinationDane: string;
  items: QuoteRequestItem[];
}

interface SanityProductShippingResult {
  _id: string;
  title: string;
  slug?: { current?: string };
  price: number;
  salePrice?: number;
  sale_price?: number;
  shipping?: ProductShippingDimensions;
  attributes?: Array<{ name: string; value: string }>;
}

/**
 * Reconstruye el carrito en el servidor consultando Sanity, valida dimensiones reales,
 * calcula la valoración declarada confiable y solicita la cotización oficial a Coordinadora.
 */
export async function quoteCartShipping(params: QuoteCartShippingParams): Promise<ShippingQuote> {
  const { destinationDane, items } = params;

  if (!destinationDane) {
    throw new CoordinadoraQuoteError('El código DANE de destino es requerido.', 400, 'MISSING_DESTINATION_DANE');
  }

  const population = findPopulationByDane(destinationDane);
  if (!population) {
    throw new CoordinadoraQuoteError(
      `El código DANE "${destinationDane}" no es reconocido en la cobertura nacional de Coordinadora.`,
      400,
      'INVALID_DANE_CODE'
    );
  }

  if (!items || items.length === 0) {
    throw new CoordinadoraQuoteError('El carrito no contiene productos para cotizar.', 400, 'EMPTY_CART');
  }

  const sanityClient = getSanityServerClient();

  // Recolectar identificadores para búsqueda (IDs y Slugs)
  const productIds = items.map(i => String(i.productId || '')).filter(Boolean);
  const productSlugs = items.map(i => String(i.slug || '')).filter(Boolean);

  const query = `*[_type == "product" && (_id in $productIds || slug.current in $productSlugs)]{
    _id,
    title,
    slug,
    price,
    salePrice,
    sale_price,
    shipping,
    attributes
  }`;

  const dbProducts: SanityProductShippingResult[] = await sanityClient.fetch(query, {
    productIds,
    productSlugs
  });

  const config = getCoordinadoraConfig();
  const detailItems: CoordinadoraQuoteDetailItem[] = [];
  let totalDeclaredValue = 0;

  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);

    // Encontrar el producto correspondiente en base de datos
    const product = dbProducts.find(
      p => p._id === item.productId || (p.slug?.current && (p.slug.current === item.slug || p.slug.current === item.productId))
    );

    if (!product) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Coordinadora] Producto no encontrado en Sanity: id="${item.productId}", slug="${item.slug}"`);
      }
      throw new CoordinadoraQuoteError(
        `Uno de los productos del carrito no fue encontrado en el catálogo para verificar envío.`,
        400,
        'PRODUCT_NOT_FOUND',
        { item }
      );
    }

    // Precio oficial del servidor
    const effectivePrice = (product.salePrice && product.salePrice > 0)
      ? product.salePrice
      : (product.sale_price && product.sale_price > 0)
        ? product.sale_price
        : (product.price || 0);

    totalDeclaredValue += effectivePrice * qty;

    const shipping = product.shipping;

    // Dimensiones y peso: Si el producto no tiene medidas registradas en Sanity,
    // se aplican valores por defecto para permitir cotizar envíos sin bloquear el checkout.
    const defaultWeightKg = Number(process.env.COORDINADORA_DEFAULT_WEIGHT_KG) || 0.35;
    const defaultHeightCm = Number(process.env.COORDINADORA_DEFAULT_HEIGHT_CM) || 5;
    const defaultWidthCm = Number(process.env.COORDINADORA_DEFAULT_WIDTH_CM) || 20;
    const defaultLengthCm = Number(process.env.COORDINADORA_DEFAULT_LENGTH_CM) || 30;

    const rawWeight = Number(shipping?.weightKg);
    const rawHeight = Number(shipping?.heightCm);
    const rawWidth = Number(shipping?.widthCm);
    const rawLength = Number(shipping?.lengthCm);

    const weightKg = (!isNaN(rawWeight) && rawWeight > 0) ? rawWeight : defaultWeightKg;
    const heightCm = (!isNaN(rawHeight) && rawHeight > 0) ? rawHeight : defaultHeightCm;
    const widthCm = (!isNaN(rawWidth) && rawWidth > 0) ? rawWidth : defaultWidthCm;
    const lengthCm = (!isNaN(rawLength) && rawLength > 0) ? rawLength : defaultLengthCm;

    detailItems.push({
      ubl: shipping?.ubl || config.ublDefault || '0',
      alto: String(heightCm),
      ancho: String(widthCm),
      largo: String(lengthCm),
      peso: String(weightKg),
      unidades: String(qty)
    });
  }

  // Llamar al cotizador oficial de Coordinadora
  return await quoteCoordinadoraShipment({
    destinationDane,
    declaredValue: totalDeclaredValue,
    items: detailItems
  });
}
