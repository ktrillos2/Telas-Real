import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"

export interface UnifiedColorVariant {
  id: string
  name: string
  fullName: string
  slug: string
  price: number
  pricePerKilo?: number
  rendimiento?: string | number
  sale_price?: number
  image: string
  thumbnail: string
  images: Array<{ src: string; id: string; thumbnail?: string; alt?: string }>
  toneHex: string
  toneTitle: string
  stockStatus: string
  stock_status?: string
  attributes?: any[]
  categories?: any[]
  badge?: string
}

export interface UnifiedFabricConfig {
  id: string
  name: string
  baseTitle: string
  unifiedSlug: string
  aliases?: string[]
  categorySlug: string
  categoryName: string
  badgeLabel?: string
  groqFilter: string
  matchesSlug: (slug: string) => boolean
  cleanColorName: (title: string) => string
  attributes: Array<{ name: string; value: string; visible?: boolean; global?: boolean }>
  usages: Array<{ title: string; slug: string }>
  defaultPrice?: number
  shortDescriptionTpl: (count: number) => string
  descriptionTpl: (count: number) => string
  seoTitleTpl: (variantName?: string, count?: number) => string
  seoDescriptionTpl: (variantName?: string, count?: number) => string
}

export const UNIFIED_FABRIC_CONFIGS: UnifiedFabricConfig[] = [
  // 1. TELA BRUSH (PIEL DE DURAZNO)
  {
    id: "brush-piel-de-durazno",
    name: "Tela Brush X Metros | Piel de Durazno",
    baseTitle: "Tela Brush",
    unifiedSlug: "tela-brush-piel-de-durazno",
    aliases: ["tela-brush-colores-prueba"],
    categorySlug: "unicolor",
    categoryName: "Telas Unicolor",
    groqFilter: `*[_type == "product" && (title match "*Brush*" || title match "*brush*" || slug.current match "*brush*") && !(title match "*Standard*") && !(slug.current match "*standard*") && !(title match "*Sublimado*") && !(slug.current match "*sublimado*") && !(_id in ["product-brush-blanco", "product-brush-crudo", "product-brush-unicolor"]) && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-brush-piel-de-durazno" ||
      slug === "tela-brush-colores-prueba" ||
      ((slug.startsWith("tela-brush-") || slug.startsWith("brush-")) &&
        !slug.includes("standard") &&
        !slug.includes("sublimado")),
    cleanColorName: (title) =>
      title
        .replace(/^Brush\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*Piel de Durazno.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.67 metros", visible: true, global: true },
      { name: "Composición", value: "92% Poliéster / 8% Elastano (Spandex)", visible: true, global: true },
      { name: "Elasticidad", value: "Alta (Spandex)", visible: true, global: true },
      { name: "Tacto", value: "Suave / Piel de Durazno", visible: true, global: true },
    ],
    usages: [
      { title: "Pijamas", slug: "pijamas" },
      { title: "Camisetas", slug: "camisetas" },
      { title: "Vestidos", slug: "vestidos" },
      { title: "Moda Deportiva", slug: "moda-deportiva" },
      { title: "Accesorios", slug: "accesorios" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Brush por metro tipo piel de durazno, suave y liviana. Es un tejido de punto de alta calidad e ideal para prendas cómodas y versátiles como pijamas, camisetas y vestidos. Excelente acabado y caída con más de ${count} colores disponibles en stock.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Tela Brush (Piel de Durazno)</strong> es uno de los textiles más versátiles y populares en Colombia. Se caracteriza por su tacto aterciopelado sumamente suave, caída fluida y elasticidad gracias a su composición de 92% poliéster y 8% elastano.</p><p>Es ideal para la confección de pijamas, ropa casual, camisetas, vestidos, conjuntos y moda deportiva. Selecciona tu tono favorito de nuestra colección con ${count} colores disponibles para despacho inmediato.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Brush ${variant} X Metros | Piel de Durazno - Telas Real Colombia`
        : `Tela Brush X Metros | Piel de Durazno (${count || 50}+ Colores) | Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Compra Tela Brush ${variant} por metro en Telas Real. Suave tacto piel de durazno, elástica para pijamas, camisetas y vestidos. Envíos rápidos a Bogotá, Medellín, Cali, Barranquilla y toda Colombia.`
        : `Catálogo completo de Tela Brush por metro tipo piel de durazno en Colombia. Más de ${count || 50} colores disponibles con envíos nacionales vía Coordinadora.`,
  },

  // 2. TELA SATÍN
  {
    id: "satin-elegante",
    name: "Tela Satín X Metros | Tela Elegante",
    baseTitle: "Tela Satín",
    unifiedSlug: "tela-satin-x-metros-elegante",
    aliases: ["satin-colores-prueba", "tela-satin-colores", "tela-satin-todos-los-colores"],
    categorySlug: "satin",
    categoryName: "Satin",
    groqFilter: `*[_type == "product" && (title match "*satin*" || title match "*Satín*" || slug.current match "*satin*") && !(title match "*Sublimado*") && !(slug.current match "*sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-satin-x-metros-elegante" ||
      slug === "satin-colores-prueba" ||
      slug === "tela-satin-colores" ||
      slug === "tela-satin-todos-los-colores" ||
      ((slug.startsWith("tela-satin-") || slug.startsWith("satin-")) && !slug.includes("sublimado")),
    cleanColorName: (title) =>
      title
        .replace(/^Satin\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*Tela.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.50 metros", visible: true, global: true },
      { name: "Composición", value: "100% Poliéster", visible: true, global: true },
      { name: "Acabado", value: "Brillante y Sedoso", visible: true, global: true },
      { name: "Caída", value: "Fluida y Elegante", visible: true, global: true },
    ],
    usages: [
      { title: "Vestidos de Fiesta", slug: "vestidos" },
      { title: "Pijamas y Batas", slug: "pijamas" },
      { title: "Lencería", slug: "lenceria" },
      { title: "Decoración y Eventos", slug: "decoracion" },
      { title: "Forros de Gala", slug: "forros" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela satín por metro con acabado brillante, tacto ultrasuave y caída fluida de alta elegancia. Disponible en una selecta colección de ${count} tonos vibrantes y satinados para confección de alta costura, pijamas de lujo y decoración.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Tela Satín</strong> de Telas Real destaca por su brillo sofisticado, suavidad al contacto con la piel y resistencia superior. Es el tejido por excelencia para prendas que requieren distinción y presencia.</p><p>Apta para vestidos de gala, blusas elegantes, kimonos, batas de novia, lencería y mantelería fina. Elige entre ${count} colores disponibles para envío inmediato a nivel nacional.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Satín ${variant} X Metros | Tela Elegante - Telas Real Colombia`
        : `Tela Satín X Metros | Tela Elegante (${count || 18} Colores) | Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Compra Tela Satín ${variant} por metro en Telas Real. Acabado brillante, caída sedosa y calidad premium para vestidos y pijamas. Despacho nacional.`
        : `Catálogo de Tela Satín por metro en Colombia. ${count || 18} colores disponibles con brillo elegante y suavidad insuperable. Envíos a todo el país.`,
  },

  // 3. TELA WAFER (TELA GALLETA)
  {
    id: "wafer-galleta",
    name: "Tela Wafer X Metros | Tela Galleta Texturizada",
    baseTitle: "Tela Wafer",
    unifiedSlug: "tela-wafer-x-metros-galleta",
    aliases: ["tela-wafer-colores", "wafer-colores"],
    categorySlug: "wafer",
    categoryName: "Wafer",
    groqFilter: `*[_type == "product" && (title match "*Wafer*" || slug.current match "*wafer*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-wafer-x-metros-galleta" ||
      slug === "tela-wafer-colores" ||
      slug === "wafer-colores" ||
      slug.startsWith("tela-wafer-") ||
      slug.startsWith("wafer-"),
    cleanColorName: (title) =>
      title
        .replace(/^Wafer\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.60 metros", visible: true, global: true },
      { name: "Textura", value: "Relieve tipo galleta / gofrado (Wafer)", visible: true, global: true },
      { name: "Composición", value: "Poliéster / Elastano", visible: true, global: true },
      { name: "Elasticidad", value: "Media y confortable", visible: true, global: true },
    ],
    usages: [
      { title: "Ropa Infantil", slug: "infantil" },
      { title: "Buzos Livianos", slug: "buzos" },
      { title: "Pijamas", slug: "pijamas" },
      { title: "Conjuntos Casuales", slug: "conjuntos" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Wafer por metro con textura en relieve tipo galleta (panal gofrado). Tejido suave, abrigado y elástico ideal para confección infantil, buzos y prendas urbanas contemporáneas. ${count} colores disponibles.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Tela Wafer (Galleta)</strong> es tendencia por su relieve geométrico característico que aporta volumen y diseño a cualquier prenda sin resultar pesada. Su tacto es agradable y cálido.</p><p>Ideal para confección de ropa de bebé, hoodies livianos, shorts de descanso, pijamas y moda casual. Contamos con ${count} colores en stock para entrega rápida.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Wafer ${variant} X Metros | Tela Galleta - Telas Real Colombia`
        : `Tela Wafer X Metros | Tela Galleta (${count || 12} Colores) | Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Compra Tela Wafer ${variant} por metro en Colombia. Textura gofrada tipo galleta, suave y elástica. Envíos nacionales en Telas Real.`
        : `Tela Wafer o Tela Galleta por metro en Colombia. Colección de ${count || 12} colores para ropa infantil, buzos y conjuntos casuales.`,
  },

  // 4. TELA SEDA DE MANGO
  {
    id: "seda-de-mango-licrada",
    name: "Tela Seda de Mango X Metros | Tela Licrada",
    baseTitle: "Tela Seda de Mango",
    unifiedSlug: "tela-seda-de-mango-x-metros-licrada",
    aliases: ["tela-seda-de-mango-colores", "seda-de-mango-colores"],
    categorySlug: "seda-de-mango",
    categoryName: "Seda de Mango",
    groqFilter: `*[_type == "product" && (title match "*Seda de Mango*" || slug.current match "*seda-de-mango*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-seda-de-mango-x-metros-licrada" ||
      slug === "tela-seda-de-mango-colores" ||
      slug === "seda-de-mango-colores" ||
      slug.startsWith("tela-seda-de-mango-") ||
      slug.startsWith("seda-de-mango-"),
    cleanColorName: (title) =>
      title
        .replace(/^Seda de Mango\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.50 metros", visible: true, global: true },
      { name: "Tacto", value: "Ultrasuave y sedoso", visible: true, global: true },
      { name: "Composición", value: "Poliéster / Spandex", visible: true, global: true },
      { name: "Elasticidad", value: "Alta elasticidad licrada", visible: true, global: true },
    ],
    usages: [
      { title: "Blusas Elegantes", slug: "blusas" },
      { title: "Vestidos Playeros y Casuales", slug: "vestidos" },
      { title: "Pantalones Palazzo", slug: "pantalones" },
      { title: "Ropa Femenina", slug: "ropa-femenina" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Seda de Mango licrada por metro, con caída espectacular, tacto fresco y estiramiento bidireccional. Perfecta para blusas sofisticadas, vestidos fluidos y moda femenina. ${count} colores disponibles.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Seda de Mango</strong> combina la elegancia visual de la seda con la comodidad moderna del spandex. No se arruga fácilmente, tiene un lustre sutil y se adapta al cuerpo de forma favorecedora.</p><p>Selecciona entre ${count} colores para dar vida a tus mejores creaciones de moda.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Seda de Mango ${variant} X Metros | Tela Licrada - Telas Real Colombia`
        : `Tela Seda de Mango X Metros | Tela Licrada (${count || 11} Colores) | Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Tela Seda de Mango ${variant} por metro en Telas Real Colombia. Suave, elástica y con excelente caída para confección femenina.`
        : `Catálogo de Tela Seda de Mango por metro en Colombia. ${count || 11} colores disponibles para blusas, vestidos y enterizos elegantes.`,
  },

  // 5. TELA RIB PITILLO (ACANALADA)
  {
    id: "rib-pitillo-acanalado",
    name: "Tela Rib Pitillo X Metros | Tela Acanalada",
    baseTitle: "Tela Rib Pitillo",
    unifiedSlug: "tela-rib-pitillo-x-metros-acanalada",
    aliases: ["tela-rib-pitillo-colores", "rib-pitillo-colores"],
    categorySlug: "rib-pitillo",
    categoryName: "Rib Pitillo",
    groqFilter: `*[_type == "product" && (title match "*Rib Pitillo*" || slug.current match "*rib-pitillo*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-rib-pitillo-x-metros-acanalada" ||
      slug === "tela-rib-pitillo-colores" ||
      slug === "rib-pitillo-colores" ||
      slug.startsWith("tela-rib-pitillo-") ||
      slug.startsWith("rib-pitillo-"),
    cleanColorName: (title) =>
      title
        .replace(/^Rib Pitillo\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.50 metros", visible: true, global: true },
      { name: "Estructura", value: "Acanalado fino (Canalé tipo pitillo)", visible: true, global: true },
      { name: "Composición", value: "Poliéster / Spandex", visible: true, global: true },
      { name: "Elasticidad", value: "Muy alta (Rib elástico)", visible: true, global: true },
    ],
    usages: [
      { title: "Tops y Bodys", slug: "tops" },
      { title: "Vestidos Ceñidos", slug: "vestidos" },
      { title: "Cuellos y Puños", slug: "acabados" },
      { title: "Camisetas Básicas", slug: "camisetas" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Rib Pitillo por metro con fino tejido acanalado de alta elasticidad y retorno. Ideal para prendas ajustadas tipo crop tops, vestidos midi, bodys y terminaciones modernas. ${count} tonos disponibles.`,
    descriptionTpl: (count) =>
      `<p>El <strong>Rib Pitillo</strong> es indispensable en las colecciones actuales. Su textura de líneas delgadas estiliza la silueta, mientras su elasticidad garantiza confort duradero y ajuste ceñido.</p><p>Disponible en ${count} colores para entrega inmediata en Telas Real Colombia.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Rib Pitillo ${variant} X Metros | Tela Acanalada - Telas Real Colombia`
        : `Tela Rib Pitillo X Metros | Tela Acanalada (${count || 9} Colores) | Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Compra Tela Rib Pitillo ${variant} por metro en Colombia. Canale fino elástico para vestidos ceñidos, bodys y tops.`
        : `Venta de Tela Rib Pitillo acanalada por metro en Colombia. ${count || 9} tonos disponibles para confección femenina y juvenil.`,
  },

  // 6. TELA RIB (ACANALADA TRADICIONAL)
  {
    id: "rib-acanalado",
    name: "Tela Rib X Metros | Tela Acanalada",
    baseTitle: "Tela Rib",
    unifiedSlug: "tela-rib-x-metros-acanalada",
    aliases: ["tela-rib-colores", "rib-colores"],
    categorySlug: "rib",
    categoryName: "Rib",
    groqFilter: `*[_type == "product" && (title match "*Rib *" || title match "Rib *") && !(title match "*Pitillo*") && !(slug.current match "*pitillo*") && !(title match "*2x2*") && !(slug.current match "*2por2*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-rib-x-metros-acanalada" ||
      slug === "tela-rib-colores" ||
      slug === "rib-colores" ||
      (slug.startsWith("tela-rib-") && !slug.includes("pitillo") && !slug.includes("2por2") && !slug.includes("2x2")),
    cleanColorName: (title) =>
      title
        .replace(/^Rib\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.50 metros", visible: true, global: true },
      { name: "Estructura", value: "Tejido acanalado elástico", visible: true, global: true },
      { name: "Composición", value: "Poliéster / Elastano", visible: true, global: true },
      { name: "Elasticidad", value: "Alta", visible: true, global: true },
    ],
    usages: [
      { title: "Pretinas y Cuellos", slug: "pretinas" },
      { title: "Puños de Buzos", slug: "punos" },
      { title: "Camisetas y Prendas de Punto", slug: "camisetas" },
      { title: "Ropa Deportiva", slug: "deportiva" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Rib por metro para pretinas, cuellos, puños y prendas de punto acanaladas. Tejido resistente con excelente recuperación elástica. ${count} colores en stock.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Tela Rib Acanalada</strong> es el estándar para los complementos de prendas deportivas y urbanas: cuellos polo, puños de chaquetas, pretinas de joggers y buzos. También excelente para prendas completas acanaladas.</p><p>Elige tu color entre los ${count} tonos disponibles en Telas Real.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Rib ${variant} X Metros | Tela Acanalada - Telas Real Colombia`
        : `Tela Rib X Metros | Tela Acanalada (${count || 9} Colores) | Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Tela Rib ${variant} por metro en Telas Real. Acanalado elástico para pretinas, puños y prendas de punto.`
        : `Tela Rib tradicional acanalada por metro en Colombia. ${count || 9} colores disponibles para acabados textiles profesionales.`,
  },

  // 7. TELA CREPE (LIVIANA Y CHIFÓN)
  {
    id: "crepe-liviana",
    name: "Tela Crepe X Metros | Tela Liviana",
    baseTitle: "Tela Crepe",
    unifiedSlug: "tela-crepe-x-metros-liviana",
    aliases: ["tela-crepe-colores", "crepe-colores"],
    categorySlug: "crepe",
    categoryName: "Crepe",
    groqFilter: `*[_type == "product" && (title match "*Crepe*" || title match "*Chifon*") && !(title match "*Sublimado*") && !(slug.current match "*sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-crepe-x-metros-liviana" ||
      slug === "tela-crepe-colores" ||
      slug === "crepe-colores" ||
      slug.startsWith("tela-crepe-") ||
      slug.startsWith("tela-chifon-crepe-") ||
      slug.startsWith("crepe-"),
    cleanColorName: (title) =>
      title
        .replace(/^(Chifon\s*)?Crepe\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.50 metros", visible: true, global: true },
      { name: "Tacto", value: "Textura sutilmente granulada / crespón", visible: true, global: true },
      { name: "Caída", value: "Liviana, fluida y semitransparente", visible: true, global: true },
      { name: "Composición", value: "100% Poliéster", visible: true, global: true },
    ],
    usages: [
      { title: "Blusas Livianas", slug: "blusas" },
      { title: "Vestidos de Fiesta", slug: "vestidos" },
      { title: "Faldas Volátiles", slug: "faldas" },
      { title: "Pañoletas y Chales", slug: "accesorios" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Crepe por metro, ligera y con movimiento vaporoso. Textura clásica crespón con acabado mate elegante para vestidos sofisticados y blusas de alta costura. ${count} colores disponibles.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Tela Crepe</strong> es un tejido indispensable en confección femenina. Su caída etérea y textura refinada le otorgan a vestidos, camiseras y prendas formales un porte de distinción.</p><p>Descubre nuestra gama de ${count} tonos con envíos a toda Colombia.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Crepe ${variant} X Metros | Tela Liviana - Telas Real Colombia`
        : `Tela Crepe X Metros | Tela Liviana (${count || 8} Colores) | Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Tela Crepe ${variant} por metro en Colombia. Movimiento fluido, textura granulada elegante para blusas y vestidos.`
        : `Tela Crepe y Chifón Crepe por metro en Colombia. ${count || 8} colores vibrantes para moda femenina liviana y elegante.`,
  },

  // 8. TELA BRUSH STANDARD
  {
    id: "brush-standard",
    name: "Tela Brush Standard X Metros | Piel de Durazno",
    baseTitle: "Tela Brush Standard",
    unifiedSlug: "tela-brush-standard-x-metros",
    aliases: ["tela-brush-standard-colores"],
    categorySlug: "brush-standard",
    categoryName: "Brush Standard",
    groqFilter: `*[_type == "product" && (title match "*Brush Standard*" || slug.current match "*brush-standard*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-brush-standard-x-metros" ||
      slug === "tela-brush-standard-colores" ||
      slug.startsWith("tela-brush-standard-"),
    cleanColorName: (title) =>
      title
        .replace(/^Brush Standard\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.60 metros", visible: true, global: true },
      { name: "Tacto", value: "Suave tipo piel de durazno", visible: true, global: true },
      { name: "Composición", value: "100% Poliéster", visible: true, global: true },
      { name: "Línea", value: "Standard / Económica de alta rotación", visible: true, global: true },
    ],
    usages: [
      { title: "Pijamas Económicas", slug: "pijamas" },
      { title: "Sublimación", slug: "sublimacion" },
      { title: "Prendas de Descanso", slug: "descanso" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Brush Standard por metro con acabado piel de durazno. Una opción sumamente rentable y de alta calidad para pijamería masiva y prendas de descanso. ${count} colores disponibles.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Tela Brush Standard</strong> ofrece el balance perfecto entre suavidad táctil y precio competitivo para productores de confección en serie y talleres de pijamería.</p><p>Disponible en ${count} colores populares.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Brush Standard ${variant} X Metros - Telas Real Colombia`
        : `Tela Brush Standard X Metros (${count || 7} Colores) - Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Tela Brush Standard ${variant} por metro en Telas Real. Piel de durazno rendidora para confección y pijamería.`
        : `Catálogo de Tela Brush Standard por metro en Colombia. ${count || 7} colores disponibles al mejor precio mayorista.`,
  },

  // 9. TELA LICRA DEPORTIVA
  {
    id: "licra-deportiva",
    name: "Tela Licra Deportiva X Metros | Tela Licrada",
    baseTitle: "Tela Licra Deportiva",
    unifiedSlug: "tela-licra-deportiva-x-metros",
    aliases: ["tela-licra-deportiva-colores", "licra-deportiva-colores"],
    categorySlug: "licra-deportiva",
    categoryName: "Licra Deportiva",
    groqFilter: `*[_type == "product" && (title match "*Licra Deportiva*" || slug.current match "*licra-deportiva*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-licra-deportiva-x-metros" ||
      slug === "tela-licra-deportiva-colores" ||
      slug === "licra-deportiva-colores" ||
      slug.startsWith("tela-licra-deportiva-"),
    cleanColorName: (title) =>
      title
        .replace(/^Licra Deportiva\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.50 metros", visible: true, global: true },
      { name: "Elasticidad", value: "4 vías (Spandex deportivo de alto rebote)", visible: true, global: true },
      { name: "Composición", value: "Poliéster / Spandex", visible: true, global: true },
      { name: "Uso", value: "Fitness, compresión y rendimiento", visible: true, global: true },
    ],
    usages: [
      { title: "Leggings Deportivos", slug: "leggings" },
      { title: "Tops Fitness", slug: "tops" },
      { title: "Ciclistas y Bikers", slug: "bikers" },
      { title: "Trajes de Baño", slug: "banadores" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Licra Deportiva por metro con compresión anatómica, elasticidad 4 vías y secado rápido. Creada para leggings, bikers y ropa deportiva de alto rendimiento. ${count} colores disponibles.`,
    descriptionTpl: (count) =>
      `<p>Nuestra <strong>Licra Deportiva</strong> soporta máxima exigencia física sin transparentar ni perder su forma original. Ajuste ergonómico que estiliza y acompaña cada movimiento.</p><p>Elige tu tono entre los ${count} colores disponibles para confección activa.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Licra Deportiva ${variant} X Metros - Telas Real Colombia`
        : `Tela Licra Deportiva X Metros (${count || 6} Colores) - Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Tela Licra Deportiva ${variant} por metro. Máxima elasticidad y ajuste para leggings y ropa fitness en Colombia.`
        : `Venta de Tela Licra Deportiva por metro en Colombia. ${count || 6} colores disponibles para ropa de gimnasio y compresión.`,
  },

  // 10. TELA UVITA (TELA BURDA)
  {
    id: "uvita-burda",
    name: "Tela Uvita X Metros | Tela Burda",
    baseTitle: "Tela Uvita",
    unifiedSlug: "tela-uvita-x-metros-burda",
    aliases: ["tela-uvita-colores"],
    categorySlug: "uvita",
    categoryName: "Uvita",
    groqFilter: `*[_type == "product" && (title match "*Uvita*" || slug.current match "*uvita*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-uvita-x-metros-burda" ||
      slug === "tela-uvita-colores" ||
      slug.startsWith("tela-uvita-"),
    cleanColorName: (title) =>
      title
        .replace(/^Uvita\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.60 metros", visible: true, global: true },
      { name: "Estructura", value: "Burda liviana con reverso perchado suave", visible: true, global: true },
      { name: "Composición", value: "Poliéster / Algodón", visible: true, global: true },
    ],
    usages: [
      { title: "Buzos Livianos", slug: "buzos" },
      { title: "Joggers y Sudaderas", slug: "joggers" },
      { title: "Prendas Casuales", slug: "casual" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Uvita (Burda liviana) por metro. Ideal para buzos casuales, joggers modernos y conjuntos urbanos de media estación. ${count} colores disponibles.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Tela Uvita</strong> es un clásico de la confección urbana en Colombia. Es confortable, abrigada en su justa medida y muy fácil de trabajar en máquina plana y fileteadora.</p><p>Contamos con ${count} colores en inventario permanente.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Uvita ${variant} X Metros | Tela Burda - Telas Real Colombia`
        : `Tela Uvita X Metros | Tela Burda (${count || 6} Colores) - Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Tela Uvita ${variant} por metro en Colombia. Burda de alta calidad para buzos y joggers.`
        : `Tela Uvita tipo burda por metro en Colombia. ${count || 6} tonos disponibles con despacho inmediato.`,
  },

  // 11. TELA POLY LICRA
  {
    id: "poly-licra",
    name: "Tela Poly Licra X Metros | Tela Licrada",
    baseTitle: "Tela Poly Licra",
    unifiedSlug: "tela-poly-licra-x-metros",
    aliases: ["tela-poly-licra-colores"],
    categorySlug: "poly-licra",
    categoryName: "Poly Licra",
    groqFilter: `*[_type == "product" && (title match "*Poly Licra*" || slug.current match "*poly-licra*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-poly-licra-x-metros" ||
      slug === "tela-poly-licra-colores" ||
      slug.startsWith("tela-poly-licra-"),
    cleanColorName: (title) =>
      title
        .replace(/^Poly Licra\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.55 metros", visible: true, global: true },
      { name: "Elasticidad", value: "Alta elasticidad y recuperación", visible: true, global: true },
      { name: "Composición", value: "Poliéster / Spandex", visible: true, global: true },
    ],
    usages: [
      { title: "Blusas y Tops", slug: "blusas" },
      { title: "Vestidos de Baño", slug: "banadores" },
      { title: "Prendas Ajustadas", slug: "ajustadas" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Poly Licra por metro con elasticidad superior, acabado liso y excelente resistencia. Ideal para ropa ceñida y moda deportiva. ${count} tonos disponibles.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Poly Licra</strong> es sumamente elástica, fresca y durable. Acepta sublimación y ofrece colores firmes lavado tras lavado.</p><p>Elige entre los ${count} colores disponibles.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Poly Licra ${variant} X Metros - Telas Real Colombia`
        : `Tela Poly Licra X Metros (${count || 5} Colores) - Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Tela Poly Licra ${variant} por metro en Colombia. Tela elástica para prendas deportivas y ajustadas.`
        : `Catálogo de Tela Poly Licra por metro en Colombia. ${count || 5} colores disponibles para confección elástica.`,
  },

  // 12. TELA CARTAGO (TELA BURDA)
  {
    id: "cartago-burda",
    name: "Tela Cartago X Metros | Tela Burda",
    baseTitle: "Tela Cartago",
    unifiedSlug: "tela-cartago-x-metros-burda",
    aliases: ["tela-cartago-colores"],
    categorySlug: "cartago",
    categoryName: "Cartago",
    groqFilter: `*[_type == "product" && (title match "*Cartago*" || slug.current match "*cartago*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-cartago-x-metros-burda" ||
      slug === "tela-cartago-colores" ||
      slug.startsWith("tela-cartago-"),
    cleanColorName: (title) =>
      title
        .replace(/^Cartago\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.65 metros", visible: true, global: true },
      { name: "Textura", value: "Burda gruesa abrigada para buzos pesados", visible: true, global: true },
      { name: "Composición", value: "Poliéster / Algodón", visible: true, global: true },
    ],
    usages: [
      { title: "Hoodies y Buzos", slug: "hoodies" },
      { title: "Sudaderas Gruesas", slug: "sudaderas" },
      { title: "Chaquetas Urbanas", slug: "chaquetas" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Cartago (Burda pesada) por metro. El tejido rey para hoodies oversize, buzos abrigados y sudaderas urbanas de alta calidad. ${count} colores disponibles.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Tela Cartago</strong> entrega el cuerpo, peso y calidez necesarios para buzos y hoodies de estética contemporánea y urbana.</p><p>Disponible en ${count} colores esenciales.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Cartago ${variant} X Metros | Tela Burda - Telas Real Colombia`
        : `Tela Cartago X Metros | Tela Burda (${count || 4} Colores) - Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Tela Cartago ${variant} por metro en Colombia. Burda pesada para hoodies y buzos de moda urbana.`
        : `Venta de Tela Cartago burda por metro en Colombia. ${count || 4} colores para confección de sudaderas y hoodies.`,
  },

  // 13. TELA ACETATO
  {
    id: "acetato-licrada",
    name: "Tela Acetato X Metros | Tela Licrada",
    baseTitle: "Tela Acetato",
    unifiedSlug: "tela-acetato-x-metros-licrada",
    aliases: ["tela-acetato-colores"],
    categorySlug: "acetato",
    categoryName: "Acetato",
    groqFilter: `*[_type == "product" && (title match "*Acetato*" || slug.current match "*acetato*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-acetato-x-metros-licrada" ||
      slug === "tela-acetato-colores" ||
      slug.startsWith("tela-acetato-"),
    cleanColorName: (title) =>
      title
        .replace(/^Acetato\s*/i, "")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.50 metros", visible: true, global: true },
      { name: "Acabado", value: "Liso y brillante", visible: true, global: true },
      { name: "Composición", value: "100% Poliéster", visible: true, global: true },
    ],
    usages: [
      { title: "Forros", slug: "forros" },
      { title: "Disfraces y Danza", slug: "disfraces" },
      { title: "Prendas Deportivas", slug: "deportivas" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Acetato por metro con brillo característico y resistencia. Excelente para forros de chaquetas, disfraces, trajes de comparsa y prendas deportivas. ${count} tonos disponibles.`,
    descriptionTpl: (count) =>
      `<p>El <strong>Acetato</strong> es un textil tradicional valorado por su brillo, resistencia al roce y precio accesible.</p><p>Disponible en ${count} colores en Telas Real.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Acetato ${variant} X Metros - Telas Real Colombia`
        : `Tela Acetato X Metros (${count || 4} Colores) - Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Tela Acetato ${variant} por metro en Colombia. Tela con brillo para forros y disfraces.`
        : `Venta de Tela Acetato por metro en Colombia. ${count || 4} colores en Telas Real.`,
  },

  // 14. TELA RIB 2X2 (ACANALADO DOBLE)
  {
    id: "rib-2x2-acanalado",
    name: "Tela Rib 2X2 X Metros | Tela Acanalada",
    baseTitle: "Tela Rib 2X2",
    unifiedSlug: "tela-rib-2x2-x-metros-acanalada",
    aliases: ["tela-rib-2x2-colores", "rib-2x2-colores"],
    categorySlug: "rib-2x2",
    categoryName: "Rib 2X2",
    groqFilter: `*[_type == "product" && (title match "*2x2*" || slug.current match "*2por2*") && (title match "*Rib*" || slug.current match "*rib*") && !(title match "*Sublimado*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "tela-rib-2x2-x-metros-acanalada" ||
      slug === "tela-rib-2x2-colores" ||
      slug === "rib-2x2-colores" ||
      slug.includes("2por2") ||
      slug.includes("rib-2x2"),
    cleanColorName: (title) =>
      title
        .replace(/^Rib\s*/i, "")
        .replace(/\s*2x2\s*/i, " ")
        .replace(/\s*X Metros.*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Ancho", value: "1.50 metros", visible: true, global: true },
      { name: "Estructura", value: "Tejido acanalado doble (2x2 Rib)", visible: true, global: true },
      { name: "Composición", value: "Poliéster / Elastano", visible: true, global: true },
      { name: "Elasticidad", value: "Muy alta — recuperación doble canalé", visible: true, global: true },
    ],
    usages: [
      { title: "Pretinas y Puños", slug: "pretinas" },
      { title: "Cuellos de Buzos", slug: "cuellos" },
      { title: "Prendas Deportivas", slug: "deportiva" },
      { title: "Conjuntos Acanalados", slug: "conjuntos" },
    ],
    shortDescriptionTpl: (count) =>
      `Tela Rib 2X2 por metro con estructura acanalada doble de alta elasticidad y retorno. Ideal para pretinas, puños, cuellos y prendas de punto. ${count} colores disponibles.`,
    descriptionTpl: (count) =>
      `<p>La <strong>Tela Rib 2X2</strong> es el acabado textil preferido para los complementos más exigentes de la confección urbana y deportiva. Su doble acanalado garantiza ajuste, recuperación y durabilidad superior al Rib simple.</p><p>Elige entre los ${count} colores disponibles en Telas Real Colombia para entrega inmediata.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Tela Rib 2X2 ${variant} X Metros | Tela Acanalada - Telas Real Colombia`
        : `Tela Rib 2X2 X Metros | Tela Acanalada (${count || 9} Colores) | Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Compra Tela Rib 2X2 ${variant} por metro en Telas Real. Acanalado doble elástico para pretinas, puños y cuellos de prendas deportivas.`
        : `Tela Rib 2X2 acanalada doble por metro en Colombia. ${count || 9} colores disponibles para acabados textiles de alta calidad.`,
  },

  // 15. HILOS DE COSER 40/02
  {
    id: "hilo-de-coser-40-02",
    name: "Hilo de Coser 40/02 | Telas Real",
    baseTitle: "Hilo de Coser 40/02",
    unifiedSlug: "hilo-de-coser-40-02-colombia",
    aliases: ["hilos-de-coser-40-02-colores", "hilo-de-coser-colores"],
    categorySlug: "hilos",
    categoryName: "Hilos",
    groqFilter: `*[_type == "product" && (title match "*Hilo de Coser*" || slug.current match "*hilo-de-coser*") && stockStatus != "outOfStock" && stock_status != "outofstock" && count(images) > 0] | order(title asc)`,
    matchesSlug: (slug) =>
      slug === "hilo-de-coser-40-02-colombia" ||
      slug === "hilos-de-coser-40-02-colores" ||
      slug === "hilo-de-coser-colores" ||
      slug.startsWith("hilo-de-coser-40-02-"),
    cleanColorName: (title) =>
      title
        .replace(/^Hilo de Coser 40\/02\s*/i, "")
        .replace(/\|\s*.*/i, "")
        .trim(),
    attributes: [
      { name: "Calibre", value: "40/02", visible: true, global: true },
      { name: "Presentación", value: "Cono estándar de alta resistencia", visible: true, global: true },
      { name: "Composición", value: "100% Poliéster Spun", visible: true, global: true },
      { name: "Uso", value: "Máquina plana, fileteadora y costura manual", visible: true, global: true },
    ],
    usages: [
      { title: "Costura Plana", slug: "costura" },
      { title: "Fileteado", slug: "fileteado" },
      { title: "Confección General", slug: "confeccion" },
    ],
    shortDescriptionTpl: (count) =>
      `Cono de Hilo de coser calibre 40/02 en poliéster de alta tenacidad. Resistencia óptima para máquinas industriales y domésticas. Colección con ${count} colores indispensables.`,
    descriptionTpl: (count) =>
      `<p>El <strong>Hilo de Coser 40/02</strong> de Telas Real asegura costuras firmes, sin cortes ni deshilachados. Excelente lubricación para alto rendimiento en máquina plana y fileteadora.</p><p>Elige entre los ${count} colores disponibles para entrega inmediata.</p>`,
    seoTitleTpl: (variant, count) =>
      variant
        ? `Hilo de Coser 40/02 ${variant} | Cono de Hilo - Telas Real Colombia`
        : `Hilo de Coser 40/02 (${count || 12} Colores) | Telas Real Colombia`,
    seoDescriptionTpl: (variant, count) =>
      variant
        ? `Compra Hilo de Coser 40/02 ${variant} en Telas Real Colombia. Cono resistente para confección textil.`
        : `Hilos de coser calibre 40/02 por cono en Colombia. ${count || 12} colores para costura industrial y confección.`,
  },
]

export const UNIFIED_FABRICS = UNIFIED_FABRIC_CONFIGS

/**
 * Finds the unified fabric configuration for a given slug.
 * Checks both direct unified slugs/aliases and individual color variant slugs.
 */
export function findUnifiedFabricConfig(slug: string): UnifiedFabricConfig | null {
  const decoded = decodeURIComponent(slug).toLowerCase().trim()
  return (
    UNIFIED_FABRIC_CONFIGS.find((cfg) => {
      if (cfg.unifiedSlug === decoded) return true
      if (cfg.aliases && cfg.aliases.includes(decoded)) return true
      return cfg.matchesSlug(decoded)
    }) || null
  )
}

/**
 * Checks if a slug is a unified master slug (or alias).
 */
export function isMasterUnifiedSlug(slug: string, config: UnifiedFabricConfig): boolean {
  const decoded = decodeURIComponent(slug).toLowerCase().trim()
  if (config.unifiedSlug === decoded) return true
  if (config.aliases && config.aliases.includes(decoded)) return true
  return false
}

/**
 * Fetches and builds the complete unified product view for /producto/[slug]
 */
export async function getUnifiedProductData(
  config: UnifiedFabricConfig,
  currentSlug: string,
  colorQuery?: string
): Promise<any | null> {
  try {
    const rawProducts = await client.fetch(groq`
      ${config.groqFilter} {
        _id,
        "name": title,
        "slug": slug.current,
        price,
        pricePerKilo,
        rendimiento,
        "sale_price": coalesce(salePrice, sale_price),
        "image": images[0].asset->url + "?auto=format&w=800&q=80",
        "thumbnail": images[0].asset->url + "?auto=format&w=200&q=70",
        "images": images[]{ "src": asset->url + "?auto=format&w=1200&q=80", "id": _key, "thumbnail": asset->url + "?auto=format&w=200&q=70", "alt": alt },
        "categories": categories[]->{ "id": _id, name, "slug": slug.current, rendimiento, pricePerKilo },
        "tones": tones[]->{ title, value, "slug": slug.current },
        "usages": usages[]->{ title, "slug": slug.current },
        "attributes": attributes[]{ _key, name, value, visible, global },
        stockStatus,
        stock_status,
        badge,
        "short_description": coalesce(descriptionShort, short_description),
        shipping
      }
    `)

    if (!rawProducts || rawProducts.length === 0) return null

    // Filter strictly for in-stock variants
    const inStockList = rawProducts.filter(
      (p: any) =>
        p.stockStatus !== "outOfStock" &&
        p.stockStatus !== "outofstock" &&
        p.stock_status !== "outOfStock" &&
        p.stock_status !== "outofstock"
    )
    const activeList = inStockList.length > 0 ? inStockList : rawProducts

    const colorVariants: UnifiedColorVariant[] = activeList.map((p: any) => {
      const cleanName = config.cleanColorName(p.name) || p.tones?.[0]?.title || "Color"
      return {
        id: p._id,
        name: cleanName,
        fullName: p.name,
        slug: p.slug,
        price: p.price || config.defaultPrice || 11100,
        pricePerKilo: p.pricePerKilo,
        rendimiento: p.rendimiento,
        sale_price: p.sale_price,
        image: p.image,
        thumbnail: p.thumbnail,
        images: p.images || [{ src: p.image, id: p._id, thumbnail: p.thumbnail }],
        toneHex: p.tones?.[0]?.value || "#e2e8f0",
        toneTitle: p.tones?.[0]?.title || "Otros",
        stockStatus: p.stockStatus || "inStock",
        stock_status: (p.stockStatus || "inStock").toLowerCase(),
        attributes: p.attributes || [],
        badge: p.badge,
      }
    })

    const decodedSlug = decodeURIComponent(currentSlug).toLowerCase().trim()
    const isMaster = isMasterUnifiedSlug(decodedSlug, config)

    // Select active variant:
    // 1. By ?color= query param
    // 2. Or by individual slug if requested directly (e.g. /producto/tela-satin-azul-rey...)
    // 3. Or first in-stock variant
    const targetVariant =
      colorVariants.find(
        (v) =>
          (colorQuery &&
            (v.slug.toLowerCase() === colorQuery.toLowerCase() ||
              v.id === colorQuery ||
              v.name.toLowerCase() === colorQuery.toLowerCase())) ||
          (!isMaster &&
            (v.slug.toLowerCase() === decodedSlug || v.id.toLowerCase() === decodedSlug))
      ) ||
      colorVariants.find((v) => v.stockStatus === "inStock") ||
      colorVariants[0]

    const badgeText =
      config.id === "brush-piel-de-durazno"
        ? "MÁS VENDIDO"
        : (targetVariant.badge || undefined)

    const minPrice = Math.min(...colorVariants.map((v) => v.price))
    const representativePrice = targetVariant.price || minPrice || 11100

    return {
      _id: config.unifiedSlug,
      id: config.unifiedSlug,
      name: config.name,
      title: config.name,
      baseTitle: config.baseTitle,
      slug: config.unifiedSlug,
      price: representativePrice,
      regularPrice: representativePrice,
      regular_price: representativePrice,
      pricePerKilo: targetVariant.pricePerKilo || 0,
      rendimiento: targetVariant.rendimiento || "3.2",
      sale_price: targetVariant.sale_price,
      salePrice: targetVariant.sale_price,
      image: targetVariant.image,
      thumbnail: targetVariant.thumbnail,
      images: targetVariant.images,
      categories:
        targetVariant.categories && targetVariant.categories.length > 0
          ? targetVariant.categories
          : [{ name: config.categoryName, slug: config.categorySlug }],
      usages: config.usages,
      attributes: config.attributes,
      short_description: config.shortDescriptionTpl(colorVariants.length),
      description: config.descriptionTpl(colorVariants.length),
      colorVariants: colorVariants,
      selectedColorSlug: targetVariant.slug,
      selectedColorVariant: targetVariant,
      stockStatus: targetVariant.stockStatus || "inStock",
      stock_status: (targetVariant.stockStatus || "inStock").toLowerCase(),
      isDemo: false,
      isPurchasable: true,
      badge: badgeText,
      hasColorVariants: true,
      variantsCount: colorVariants.length,
      seoTitle: config.seoTitleTpl(targetVariant.name, colorVariants.length),
      seoDescription: config.seoDescriptionTpl(targetVariant.name, colorVariants.length),
    }
  } catch (error) {
    console.error(`Error in getUnifiedProductData for ${config.id}:`, error)
    return null
  }
}

const COLOR_HEX_MAP: Record<string, string> = {
  rojo: "#DC2626",
  azul: "#2563EB",
  "azul rey": "#1D4ED8",
  "azul oscuro": "#1E3A8A",
  marino: "#1E3A8A",
  negro: "#0F172A",
  blanco: "#F8FAFC",
  marfil: "#FEF3C7",
  beige: "#F5F5DC",
  verde: "#16A34A",
  esmeralda: "#059669",
  oliva: "#65A30D",
  militar: "#4D7C0F",
  amarillo: "#EAB308",
  mostaza: "#D97706",
  naranja: "#F97316",
  rosado: "#EC4899",
  rosa: "#F472B6",
  fucsia: "#D946EF",
  morado: "#9333EA",
  lila: "#C084FC",
  vino: "#881337",
  vinotinto: "#881337",
  cafe: "#78350F",
  gris: "#64748B",
  coral: "#FB7185",
  turquesa: "#06B6D4",
  cielo: "#38BDF8",
  dorado: "#D97706",
  plata: "#94A3B8",
}

function guessColorHex(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) return hex
  }
  return null
}

/**
 * Groups raw catalog products for /tienda and carousels,
 * aggregating multiple color variants into a single parent unified card.
 */
export function groupCatalogProducts(products: any[]): any[] {
  if (!products || products.length === 0) return []

  const groupedMap = new Map<string, { config: UnifiedFabricConfig; items: any[] }>()
  const standaloneProducts: any[] = []

  for (const product of products) {
    const slug = (product.slug || "").toLowerCase().trim()
    const config = findUnifiedFabricConfig(slug)

    if (config) {
      if (!groupedMap.has(config.id)) {
        groupedMap.set(config.id, { config, items: [] })
      }
      groupedMap.get(config.id)!.items.push(product)
    } else {
      standaloneProducts.push(product)
    }
  }

  const unifiedProducts: any[] = []

  for (const [, { config, items }] of groupedMap) {
    if (items.length === 0) continue

    // Find the best representative item (first in stock, or with best image)
    const bestItem = items[0]
    const count = items.length

    // Collect all unique tone swatches
    const tonesList: any[] = []
    const seenTones = new Set<string>()
    items.forEach((it) => {
      if (it.tones && Array.isArray(it.tones)) {
        it.tones.forEach((t: any) => {
          const hex = t?.value || guessColorHex(t?.title || "")
          if (hex && !seenTones.has(hex)) {
            seenTones.add(hex)
            tonesList.push({ hex, title: t?.title || "" })
          }
        })
      }
      if (tonesList.length < 6) {
        const guessed = guessColorHex(it.name || it.title || "")
        if (guessed && !seenTones.has(guessed)) {
          seenTones.add(guessed)
          tonesList.push({ hex: guessed, title: it.name || it.title || "" })
        }
      }
    })

    const badge =
      config.id === "brush-piel-de-durazno"
        ? "MÁS VENDIDO"
        : (bestItem.badge || undefined)

    unifiedProducts.push({
      ...bestItem,
      id: config.unifiedSlug,
      _id: config.unifiedSlug,
      name: config.name,
      slug: config.unifiedSlug,
      badge: badge,
      hasColorVariants: true,
      variantsCount: count,
      colorPreviewTones: tonesList.slice(0, 6),
      categorySlugs: [
        ...(bestItem.categorySlugs || []),
        config.categorySlug,
        "colores",
        "con-variaciones",
      ],
      categories: bestItem.categories || [{ name: config.categoryName, slug: config.categorySlug }],
    })
  }

  // Combine unified fabrics at the top followed by standalone products
  return [...unifiedProducts, ...standaloneProducts]
}
