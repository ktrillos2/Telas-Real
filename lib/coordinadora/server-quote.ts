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
import { packIntoBoxes, parseYield, estimateItemWeightKg } from './boxes';
import { isUnitProduct } from '@/lib/utils';

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
  rendimiento?: string | number;
  categories?: Array<{ _id: string; name?: string; slug?: { current?: string }; rendimiento?: string | number }>;
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
    attributes,
    rendimiento,
    "categories": categories[]->{ _id, name, slug, rendimiento }
  }`;

  const dbProducts: SanityProductShippingResult[] = await sanityClient.fetch(query, {
    productIds,
    productSlugs
  });

  const config = getCoordinadoraConfig();
  const defaultUnitWeightKg = Number(process.env.COORDINADORA_DEFAULT_WEIGHT_KG) || 0.35;
  let totalDeclaredValue = 0;
  let totalWeightKg = 0;

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

    // Peso del ítem: telas por metro = metros ÷ rendimiento (m/kg); unidades = peso por unidad
    const isUnit = isUnitProduct({ slug: product.slug?.current, title: product.title, categories: product.categories || [] });
    const yieldMetersPerKg = parseYield(product.rendimiento) ?? parseYield(product.categories?.find(c => parseYield(c?.rendimiento))?.rendimiento);
    totalWeightKg += estimateItemWeightKg({
      quantity: qty,
      isUnit,
      yieldMetersPerKg,
      unitWeightKg: Number(product.shipping?.weightKg) || null,
      defaultUnitWeightKg,
    });
  }

  // Ya no se usan las medidas de cada tela: el pedido se empaca en las cajas estándar de despacho
  const packedBoxes = packIntoBoxes(totalWeightKg);
  const detailItems: CoordinadoraQuoteDetailItem[] = packedBoxes.map(({ box, weightKg }) => ({
    ubl: config.ublDefault || '0',
    alto: String(box.heightCm),
    ancho: String(box.widthCm),
    largo: String(box.lengthCm),
    peso: String(Math.max(1, Math.ceil(weightKg))),
    unidades: '1'
  }));

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Coordinadora] Peso estimado del carrito: ${totalWeightKg.toFixed(2)} kg → ${packedBoxes.map(b => `${b.box.label} (${b.weightKg} kg)`).join(' + ')}`);
  }

  // Llamar al cotizador oficial de Coordinadora
  const quote = await quoteCoordinadoraShipment({
    destinationDane,
    declaredValue: totalDeclaredValue,
    items: detailItems
  });
  return {
    ...quote,
    estimatedWeightKg: Math.round(totalWeightKg * 100) / 100,
    packages: packedBoxes.map(({ box, weightKg }) => ({ label: box.label, weightKg })),
  };
}
