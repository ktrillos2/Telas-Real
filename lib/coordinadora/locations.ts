import rawPoblaciones from '@/data/coordinadora/poblaciones.json';
import { CoordinadoraPopulation } from './types';

const poblaciones: CoordinadoraPopulation[] = rawPoblaciones as CoordinadoraPopulation[];

// Mapa por código DANE para búsquedas O(1)
const poblacionesByDane = new Map<string, CoordinadoraPopulation>();
poblaciones.forEach(p => {
  poblacionesByDane.set(p.dane, p);
});

// Normalizador de texto para comparaciones sin acentos ni mayúsculas
function normalizeStr(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Lista única ordenada de departamentos
const departmentsList: string[] = Array.from(
  new Set(poblaciones.map(p => p.departamento))
).sort((a, b) => a.localeCompare(b, 'es'));

/**
 * Retorna todas las poblaciones disponibles.
 */
export function getAllPopulations(): CoordinadoraPopulation[] {
  return poblaciones;
}

/**
 * Retorna todos los departamentos en orden alfabético.
 */
export function getDepartments(): string[] {
  return departmentsList;
}

/**
 * Retorna las poblaciones pertenecientes a un departamento dado.
 * Es tolerante a diferencias de acentuación o variaciones como "Valle" vs "Valle del Cauca".
 */
export function getPopulationsByDepartment(department: string): CoordinadoraPopulation[] {
  if (!department) return [];
  const normalizedInput = normalizeStr(department);

  return poblaciones.filter(p => {
    const normDept = normalizeStr(p.departamento);
    if (normDept === normalizedInput) return true;
    if (
      (normalizedInput === 'valle del cauca' && normDept === 'valle') ||
      (normalizedInput === 'valle' && normDept === 'valle del cauca')
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Busca una población específica por su código DANE de 8 dígitos.
 */
export function findPopulationByDane(dane: string): CoordinadoraPopulation | undefined {
  if (!dane) return undefined;
  const cleanDane = String(dane).trim().padStart(8, '0');
  return poblacionesByDane.get(cleanDane);
}

/**
 * Busca una población por nombre de ciudad y departamento.
 */
export function findPopulationByCityAndDept(
  cityName: string,
  departmentName?: string
): CoordinadoraPopulation | undefined {
  if (!cityName) return undefined;
  const normCity = normalizeStr(cityName);
  const normDept = departmentName ? normalizeStr(departmentName) : null;

  // 1. Coincidencia exacta con displayName o nombre dentro del departamento
  if (normDept) {
    const deptPob = getPopulationsByDepartment(departmentName!);
    const match = deptPob.find(p => {
      const pDisplay = normalizeStr(p.displayName);
      const pNombre = normalizeStr(p.nombre);
      return pDisplay === normCity || pNombre.includes(normCity) || normCity.includes(pDisplay);
    });
    if (match) return match;
  }

  // 2. Coincidencia global si no se encontró en el departamento
  return poblaciones.find(p => {
    const pDisplay = normalizeStr(p.displayName);
    return pDisplay === normCity;
  });
}

/**
 * Verifica si el destino permite Recaudo Contra Entrega según la matriz oficial.
 */
export function isContraentregaAvailable(dane: string): boolean {
  const pob = findPopulationByDane(dane);
  return Boolean(pob?.aplicaContraentrega);
}
