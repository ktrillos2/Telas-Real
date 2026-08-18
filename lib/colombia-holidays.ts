/**
 * Utilidad de cálculo de días festivos oficiales y días hábiles en Colombia.
 * Basado en la Ley 51 de 1983 (Ley Emiliani), festivos inamovibles y calendario litúrgico de Pascua.
 */

export interface ColombianHoliday {
  name: string;
  dateString: string; // Formato YYYY-MM-DD
}

/**
 * Obtiene las partes de la fecha en la zona horaria oficial de Colombia (America/Bogota, UTC-5).
 */
export function getColombiaDateParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });

  // Determinar día de la semana numérico en Colombia (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
  const isoStr = `${partMap.year}-${partMap.month.padStart(2, '0')}-${partMap.day.padStart(2, '0')}T${(partMap.hour || '12').padStart(2, '0')}:${(partMap.minute || '00').padStart(2, '0')}:00-05:00`;
  const colombiaDateObj = new Date(isoStr);
  const dayOfWeek = colombiaDateObj.getDay();

  return {
    year: parseInt(partMap.year, 10),
    month: parseInt(partMap.month, 10),
    day: parseInt(partMap.day, 10),
    hour: parseInt(partMap.hour, 10),
    minute: parseInt(partMap.minute, 10),
    second: parseInt(partMap.second, 10),
    dayOfWeek, // 0 = Domingo, 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes, 6 = Sábado
    dateString: `${partMap.year}-${partMap.month.padStart(2, '0')}-${partMap.day.padStart(2, '0')}`,
  };
}

/**
 * Algoritmo de Meeus/Butcher para el cálculo del Domingo de Pascua (Resurrección).
 */
export function getEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Marzo, 4 = Abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * Traslada una fecha al siguiente lunes según la regla de la Ley Emiliani.
 * Si ya es lunes, permanece en ese día.
 */
function shiftToNextMonday(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = d.getUTCDay();
  if (dayOfWeek !== 1) {
    const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    d.setUTCDate(d.getUTCDate() + daysToAdd);
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
}

function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Devuelve la lista completa de los 18 días festivos de Colombia para un año determinado.
 */
export function getColombianHolidays(year: number): ColombianHoliday[] {
  const holidays: ColombianHoliday[] = [];

  // 1. Festivos Fijos (Inamovibles - 6)
  holidays.push({ name: 'Año Nuevo', dateString: formatDateString(year, 1, 1) });
  holidays.push({ name: 'Día del Trabajo', dateString: formatDateString(year, 5, 1) });
  holidays.push({ name: 'Día de la Independencia Nacional', dateString: formatDateString(year, 7, 20) });
  holidays.push({ name: 'Batalla de Boyacá', dateString: formatDateString(year, 8, 7) });
  holidays.push({ name: 'Inmaculada Concepción', dateString: formatDateString(year, 12, 8) });
  holidays.push({ name: 'Navidad', dateString: formatDateString(year, 12, 25) });

  // 2. Festivos con Ley Emiliani (Se trasladan al siguiente lunes - 7)
  holidays.push({ name: 'Reyes Magos', dateString: shiftToNextMonday(year, 1, 6) });
  holidays.push({ name: 'Día de San José', dateString: shiftToNextMonday(year, 3, 19) });
  holidays.push({ name: 'San Pedro y San Pablo', dateString: shiftToNextMonday(year, 6, 29) });
  holidays.push({ name: 'Asunción de la Virgen', dateString: shiftToNextMonday(year, 8, 15) });
  holidays.push({ name: 'Día de la Raza', dateString: shiftToNextMonday(year, 10, 12) });
  holidays.push({ name: 'Todos los Santos', dateString: shiftToNextMonday(year, 11, 1) });
  holidays.push({ name: 'Independencia de Cartagena', dateString: shiftToNextMonday(year, 11, 11) });

  // 3. Festivos basados en la Pascua (5)
  const easter = getEasterSunday(year);
  const easterDate = new Date(Date.UTC(year, easter.month - 1, easter.day));

  // Jueves Santo: Pascua - 3 días
  const juevesSanto = new Date(easterDate);
  juevesSanto.setUTCDate(juevesSanto.getUTCDate() - 3);
  holidays.push({
    name: 'Jueves Santo',
    dateString: formatDateString(juevesSanto.getUTCFullYear(), juevesSanto.getUTCMonth() + 1, juevesSanto.getUTCDate()),
  });

  // Viernes Santo: Pascua - 2 días
  const viernesSanto = new Date(easterDate);
  viernesSanto.setUTCDate(viernesSanto.getUTCDate() - 2);
  holidays.push({
    name: 'Viernes Santo',
    dateString: formatDateString(viernesSanto.getUTCFullYear(), viernesSanto.getUTCMonth() + 1, viernesSanto.getUTCDate()),
  });

  // Ascensión del Señor: Pascua + 43 días (40 días después + Emiliani al lunes = +43 días)
  const ascension = new Date(easterDate);
  ascension.setUTCDate(ascension.getUTCDate() + 43);
  holidays.push({
    name: 'Ascensión del Señor',
    dateString: formatDateString(ascension.getUTCFullYear(), ascension.getUTCMonth() + 1, ascension.getUTCDate()),
  });

  // Corpus Christi: Pascua + 64 días (60 días después + Emiliani al lunes = +64 días)
  const corpus = new Date(easterDate);
  corpus.setUTCDate(corpus.getUTCDate() + 64);
  holidays.push({
    name: 'Corpus Christi',
    dateString: formatDateString(corpus.getUTCFullYear(), corpus.getUTCMonth() + 1, corpus.getUTCDate()),
  });

  // Sagrado Corazón de Jesús: Pascua + 71 días (68 días después + Emiliani al lunes = +71 días)
  const sagradoCorazon = new Date(easterDate);
  sagradoCorazon.setUTCDate(sagradoCorazon.getUTCDate() + 71);
  holidays.push({
    name: 'Sagrado Corazón de Jesús',
    dateString: formatDateString(sagradoCorazon.getUTCFullYear(), sagradoCorazon.getUTCMonth() + 1, sagradoCorazon.getUTCDate()),
  });

  return holidays;
}

/**
 * Verifica si una fecha específica (en hora de Colombia) es un día festivo oficial en Colombia.
 */
export function getColombianHoliday(date: Date = new Date()): { isHoliday: boolean; holidayName?: string } {
  const parts = getColombiaDateParts(date);
  const holidays = getColombianHolidays(parts.year);
  const found = holidays.find((h) => h.dateString === parts.dateString);

  if (found) {
    return {
      isHoliday: true,
      holidayName: found.name,
    };
  }

  return { isHoliday: false };
}

/**
 * Verifica si la fecha actual en Colombia corresponde a un fin de semana (Sábado o Domingo).
 */
export function isWeekendInColombia(date: Date = new Date()): boolean {
  const { dayOfWeek } = getColombiaDateParts(date);
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Domingo, 6 = Sábado
}

/**
 * Determina si la fecha corresponde a un día hábil laboral en Colombia (Lunes a Viernes no festivo).
 */
export function isColombianBusinessDay(date: Date = new Date()): boolean {
  if (isWeekendInColombia(date)) {
    return false;
  }
  const holiday = getColombianHoliday(date);
  return !holiday.isHoliday;
}

/**
 * Obtiene el siguiente día hábil laboral en Colombia a partir de una fecha dada,
 * saltando fines de semana y días festivos.
 */
export function getNextColombianBusinessDay(fromDate: Date = new Date()): Date {
  const parts = getColombiaDateParts(fromDate);
  // Comenzamos al día siguiente a las 12:00:00 en Colombia para evitar bordes de medianoche
  let currentTarget = new Date(`${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T12:00:00-05:00`);

  // Avanzamos día a día hasta encontrar un día hábil
  do {
    currentTarget.setDate(currentTarget.getDate() + 1);
  } while (!isColombianBusinessDay(currentTarget));

  return currentTarget;
}
