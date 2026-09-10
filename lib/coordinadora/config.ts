/**
 * Configuración y validación de variables de entorno para Coordinadora.
 * TODAS estas variables viven únicamente del lado del servidor.
 */

export interface CoordinadoraConfig {
  env: 'test' | 'production';
  baseUrl: string;
  username: string;
  password: string;
  nit: string;
  div: string;
  cuenta: string;
  producto: string;
  origenDane: string;
  nivelServicio: string;
  ublDefault: string;
  timeoutMs: number;
}

export function getCoordinadoraConfig(): CoordinadoraConfig {
  const env = (process.env.COORDINADORA_ENV === 'production' ? 'production' : 'test') as 'test' | 'production';
  
  const defaultBaseUrl = env === 'production' 
    ? 'https://api.coordinadora.tech'
    : 'https://api-test.coordinadora.tech';

  const baseUrl = (process.env.COORDINADORA_API_BASE_URL || defaultBaseUrl).replace(/\/+$/, '');

  const username = process.env.COORDINADORA_USERNAME?.trim() || '';
  const password = process.env.COORDINADORA_PASSWORD?.trim() || '';
  const nit = process.env.COORDINADORA_NIT?.trim() || '';
  const div = process.env.COORDINADORA_DIV?.trim() || '';
  const cuenta = process.env.COORDINADORA_CUENTA?.trim() || '';
  const producto = process.env.COORDINADORA_PRODUCTO?.trim() || '0';
  const origenDane = process.env.COORDINADORA_ORIGEN_DANE?.trim() || '11001000';
  const nivelServicio = process.env.COORDINADORA_NIVEL_SERVICIO?.trim() || '';
  const ublDefault = process.env.COORDINADORA_UBL_DEFAULT?.trim() || '0';

  return {
    env,
    baseUrl,
    username,
    password,
    nit,
    div,
    cuenta,
    producto,
    origenDane,
    nivelServicio,
    ublDefault,
    timeoutMs: 12000 // 12 segundos de timeout para llamadas a Coordinadora
  };
}

/**
 * Valida si las credenciales mínimas para autenticar y cotizar están presentes.
 */
export function isCoordinadoraConfigured(): boolean {
  const config = getCoordinadoraConfig();
  return Boolean(config.username && config.password && config.nit && config.cuenta);
}
