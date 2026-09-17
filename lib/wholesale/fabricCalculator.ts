/**
 * Motor centralizado de cálculo de progreso textil para clientes mayoristas.
 * Telas Real ERP - Fuente única de verdad matemática.
 */

export interface CalculateFabricProgressParams {
  objetivoKg: number;
  kgCumplido: number;
  rendimiento?: number; // Metros por 1 KG (por defecto 3.3)
  precioKg?: number;    // Precio por KG para cálculo monetario (opcional)
}

export interface FabricProgressResult {
  kgCumplido: number;
  mtCumplido: number;
  faltanteKg: number;
  faltanteMt: number;
  dinero: number;
  faltanteDinero: number;
  porcentaje: number;
  cumplimiento: 'SI' | 'NO';
}

export interface MonthlyProgressRecord extends FabricProgressResult {
  _key?: string;
  mes: string;
  mesNumero: number;
  anio: number;
  updatedAt?: string;
  updatedBy?: string;
  nota?: string;
}

export const MONTH_NAMES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE'
] as const;

export type MonthName = typeof MONTH_NAMES[number];

/**
 * Obtiene el número de mes (1 a 12) a partir del nombre en español.
 */
export function getMonthNumber(monthName: string): number {
  const clean = String(monthName || '').trim().toUpperCase();
  const index = MONTH_NAMES.indexOf(clean as MonthName);
  return index >= 0 ? index + 1 : 1;
}

/**
 * Obtiene el nombre del mes actual en mayúsculas (ej: "SEPTIEMBRE").
 */
export function getCurrentMonthName(): MonthName {
  const currentMonthIndex = new Date().getMonth(); // 0 a 11
  return MONTH_NAMES[currentMonthIndex];
}

/**
 * Obtiene el año actual (ej: 2026).
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Redondea un número a un número específico de decimales de forma segura.
 */
export function roundTo(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Función central pura para calcular el progreso de consumo de tela.
 * 
 * Reglas de negocio:
 * 1. mtCumplido = kgCumplido * rendimiento (ej: 400 * 3.3 = 1320 MT)
 * 2. faltanteKg = max(0, objetivoKg - kgCumplido) (ej: 684.5 - 400 = 284.5 KG)
 * 3. faltanteMt = faltanteKg * rendimiento (ej: 284.5 * 3.3 = 938.85 MT)
 * 4. cumplimiento = kgCumplido >= objetivoKg ? 'SI' : 'NO'
 */
export function calculateFabricProgress({
  objetivoKg,
  kgCumplido,
  rendimiento = 3.3,
  precioKg = 0
}: CalculateFabricProgressParams): FabricProgressResult {
  const safeObjetivo = Math.max(0, Number(objetivoKg) || 0);
  const safeCumplido = Math.max(0, Number(kgCumplido) || 0);
  const safeRendimiento = Number(rendimiento) > 0 ? Number(rendimiento) : 3.3;
  const safePrecio = Math.max(0, Number(precioKg) || 0);

  // 1. Metros cumplidos
  const mtCumplido = roundTo(safeCumplido * safeRendimiento, 2);

  // 2. Faltantes en KG y MT (nunca negativos)
  const faltanteKg = safeCumplido >= safeObjetivo 
    ? 0 
    : roundTo(safeObjetivo - safeCumplido, 2);

  const faltanteMt = roundTo(faltanteKg * safeRendimiento, 2);

  // 3. Cálculos monetarios
  const dinero = Math.round(safeCumplido * safePrecio);
  const faltanteDinero = Math.round(faltanteKg * safePrecio);

  // 4. Porcentaje de cumplimiento
  let porcentaje = 0;
  if (safeObjetivo > 0) {
    porcentaje = roundTo((safeCumplido / safeObjetivo) * 100, 1);
  } else if (safeCumplido > 0) {
    porcentaje = 100;
  }

  // 5. Estado de cumplimiento
  const cumplimiento: 'SI' | 'NO' = safeCumplido >= safeObjetivo && safeObjetivo > 0 ? 'SI' : 'NO';

  return {
    kgCumplido: safeCumplido,
    mtCumplido,
    faltanteKg,
    faltanteMt,
    dinero,
    faltanteDinero,
    porcentaje,
    cumplimiento
  };
}
