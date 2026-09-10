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

    // Validación estricta: NO inventar dimensiones ficticias
    const weightKg = Number(shipping?.weightKg);
    const heightCm = Number(shipping?.heightCm);
    const widthCm = Number(shipping?.widthCm);
    const lengthCm = Number(shipping?.lengthCm);

    const isPhysicalDataValid =
      shipping &&
      !isNaN(weightKg) && weightKg > 0 &&
      !isNaN(heightCm) && heightCm > 0 &&
      !isNaN(widthCm) && widthCm > 0 &&
      !isNaN(lengthCm) && lengthCm > 0;

    if (!isPhysicalDataValid) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Coordinadora WARNING] El producto "${product.title}" (${product._id}) no tiene configuradas dimensiones o peso válidos en Sanity:`,
          shipping
        );
      }

      throw new CoordinadoraQuoteError(
        `El producto "${product.title}" no cuenta con la información física (peso y dimensiones) requerida para cotizar el envío.`,
        400,
        'MISSING_PRODUCT_DIMENSIONS',
        {
          productId: product._id,
          productTitle: product.title,
          missingFields: {
            weightKg: !(weightKg > 0),
            heightCm: !(heightCm > 0),
            widthCm: !(widthCm > 0),
            lengthCm: !(lengthCm > 0)
          }
        }
      );
    }

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
