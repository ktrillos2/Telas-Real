export interface PqrTypeDefinition {
  id: "peticion" | "queja" | "reclamo" | "sugerencia" | "felicitacion";
  prefix: "P" | "Q" | "R" | "S" | "F";
  title: string;
  description: string;
  startingNumber: number;
}

export const PQRS_TYPES: PqrTypeDefinition[] = [
  {
    id: "peticion",
    prefix: "P",
    title: "Petición",
    description:
      "Solicitud de información, documentos, aclaraciones o una gestión relacionada con nuestros productos o servicios.",
    startingNumber: 1, // Inicia en P0001
  },
  {
    id: "queja",
    prefix: "Q",
    title: "Queja",
    description:
      "Manifestación de inconformidad relacionada principalmente con la atención, el trato o el comportamiento recibido.",
    startingNumber: 1, // Inicia en Q0001
  },
  {
    id: "reclamo",
    prefix: "R",
    title: "Reclamo",
    description:
      "Solicitud de solución frente a un producto, servicio, cobro, entrega o compromiso que consideras incumplido o defectuoso.",
    startingNumber: 4, // Inicia en R0004
  },
  {
    id: "sugerencia",
    prefix: "S",
    title: "Sugerencia",
    description:
      "Propuesta o recomendación para mejorar un producto, servicio, proceso o forma de atención.",
    startingNumber: 1, // Inicia en S0001
  },
  {
    id: "felicitacion",
    prefix: "F",
    title: "Felicitación",
    description:
      "Reconocimiento a una persona, equipo, tienda, producto o experiencia positiva.",
    startingNumber: 1, // Inicia en F0001
  },
];

export const PQRS_TIENDAS = [
  "T1 E-commerce",
  "T2 Tienda Alquería",
  "T3 Tienda Cúcuta",
  "T4 Tienda Alquería CAI",
  "T5 Tienda Policarpa The Store",
  "T6 Tienda Medellín",
  "T7 Tienda Pereira",
  "T8 Tienda Bucaramanga",
  "T9 Tienda Policarpa",
  "T10 Tienda Medellín The Showroom",
  "T11 Tienda Barranquilla",
  "T12 Tienda Cali",
  "Tienda Cali Centro",
  "T13 Tienda Pereira 2",
] as const;

export type PqrTienda = (typeof PQRS_TIENDAS)[number];

/**
 * Genera el número de radicado consecutivo oficial de PQRS en formato:
 * {PREFIJO}{CONSECUTIVO_4_DIGITOS}-{AÑO}
 * Ejemplo: P0001-2026, R0004-2026
 */
export async function generatePqrRadicado(
  tipoId: string,
  client: any
): Promise<string> {
  const tipoDef =
    PQRS_TYPES.find((t) => t.id === tipoId) || PQRS_TYPES[0];
  const prefix = tipoDef.prefix;

  const currentYear = new Date().toLocaleDateString("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
  });

  // Consultar en Sanity los radicados existentes con el prefijo y año correspondiente
  const existingRecords: { radicado?: string }[] = await client.fetch(
    `*[_type == "pqr" && radicado match $pattern]{ radicado }`,
    { pattern: `${prefix}*-${currentYear}` }
  );

  let maxFound = 0;
  const regex = new RegExp(`^${prefix}(\\d{4})-${currentYear}$`, "i");

  for (const item of existingRecords) {
    if (item.radicado) {
      const match = item.radicado.trim().match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxFound) {
          maxFound = num;
        }
      }
    }
  }

  // Si maxFound es menor que el startingNumber requerido, arranca en startingNumber.
  // Si ya alcanzó o superó el startingNumber, asigna el siguiente consecutivo.
  const nextNumber =
    maxFound >= tipoDef.startingNumber
      ? maxFound + 1
      : tipoDef.startingNumber;

  const formattedNumber = String(nextNumber).padStart(4, "0");
  return `${prefix}${formattedNumber}-${currentYear}`;
}
