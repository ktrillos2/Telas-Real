import { getCoordinadoraConfig } from './config';
import { CoordinadoraTokenResponse } from './types';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // Unix timestamp en milisegundos
}

// Caché en memoria del proceso servidor de Node.js
let tokenCache: CachedToken | null = null;
let tokenPromise: Promise<string> | null = null;

// Margen de seguridad antes de la expiración real (60 segundos)
const EXPIRATION_BUFFER_MS = 60 * 1000;

export class CoordinadoraAuthError extends Error {
  constructor(message: string, public statusCode: number = 401, public details?: unknown) {
    super(message);
    this.name = 'CoordinadoraAuthError';
  }
}

/**
 * Obtiene el token de autenticación de Coordinadora vía OAuth 2.0 (client_credentials).
 * Utiliza caché server-side con renovación automática basada en expires_in.
 */
export async function getCoordinadoraToken(forceRefresh = false): Promise<string> {
  const config = getCoordinadoraConfig();

  if (!config.username || !config.password) {
    throw new CoordinadoraAuthError(
      'Faltan las credenciales de Coordinadora (COORDINADORA_USERNAME / COORDINADORA_PASSWORD) en las variables de entorno.',
      401
    );
  }

  const now = Date.now();

  // Si existe un token en caché y aún no ha expirado (con margen de 60s), reusarlo
  if (!forceRefresh && tokenCache && now < tokenCache.expiresAt - EXPIRATION_BUFFER_MS) {
    return tokenCache.accessToken;
  }

  // Si ya hay una solicitud de token en curso, esperar la misma promesa para evitar peticiones duplicadas
  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    try {
      const authHeader = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`;
      const url = `${config.baseUrl}/oauth/token`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader,
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials'
          }).toString(),
          signal: controller.signal,
          cache: 'no-store'
        });
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          throw new CoordinadoraAuthError('Timeout al intentar conectar con el servicio de autenticación de Coordinadora', 504);
        }
        throw new CoordinadoraAuthError(`Error de red al conectar con Coordinadora: ${fetchErr.message}`, 502);
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        let errorBody: any = null;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }

        if (response.status === 401 || response.status === 403) {
          throw new CoordinadoraAuthError(
            'Credenciales de Coordinadora inválidas o no autorizadas.',
            401,
            errorBody
          );
        }

        throw new CoordinadoraAuthError(
          `Error al solicitar token de Coordinadora (HTTP ${response.status})`,
          response.status,
          errorBody
        );
      }

      const data: CoordinadoraTokenResponse = await response.json();

      // Tolerancia expresa al typo "acces_token" reportado en la documentación
      const accessToken = data.access_token ?? data.acces_token;

      if (!accessToken || typeof accessToken !== 'string') {
        throw new CoordinadoraAuthError(
          'La respuesta de autenticación de Coordinadora no contiene un token de acceso válido.',
          500,
          data
        );
      }

      const expiresInSeconds = typeof data.expires_in === 'number' && data.expires_in > 0 
        ? data.expires_in 
        : 3600;

      tokenCache = {
        accessToken,
        expiresAt: Date.now() + (expiresInSeconds * 1000)
      };

      return accessToken;
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
}

/**
 * Función auxiliar para limpiar la caché del token (útil en tests o ante errores 401 en el cotizador).
 */
export function clearTokenCache(): void {
  tokenCache = null;
  tokenPromise = null;
}
