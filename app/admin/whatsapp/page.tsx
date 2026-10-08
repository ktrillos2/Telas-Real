'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface BotState {
  status: 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATED' | 'CONNECTED' | 'DISCONNECTED' | 'UNREACHABLE';
  isTestMode?: boolean;
  testPhone?: string;
  connectedInfo?: {
    user?: string;
    name?: string;
  } | null;
  hasQr?: boolean;
  qrData?: {
    hasQr?: boolean;
    qr?: string | null;
    dataUrl?: string | null;
  } | null;
}

const QR_VALIDITY_SECONDS = 25;

export default function WhatsAppAdminPage() {
  const [botState, setBotState] = useState<BotState | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Control de pruebas de mensaje
  const [testPhone, setTestPhone] = useState('3014453123');
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Control de caducidad en vivo del QR (25 segundos por código de WhatsApp Web)
  const [timeLeft, setTimeLeft] = useState<number>(QR_VALIDITY_SECONDS);
  const [isQrExpired, setIsQrExpired] = useState(false);
  const lastQrRef = useRef<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data: BotState = await res.json();
        setBotState(data);
        setErrorMessage(null);

        // Si llegó un QR nuevo, reiniciar el temporizador de vigencia
        const incomingQr = data.qrData?.qr || data.qrData?.dataUrl || null;
        if (incomingQr && incomingQr !== lastQrRef.current) {
          lastQrRef.current = incomingQr;
          setTimeLeft(QR_VALIDITY_SECONDS);
          setIsQrExpired(false);
        }

        // Si ya está conectado o autenticado, limpiar estados de QR
        if (data.status === 'CONNECTED' || data.status === 'AUTHENTICATED') {
          setIsQrExpired(false);
          setRefreshing(false);
        }
      } else {
        setBotState(prev => prev ? { ...prev, status: 'UNREACHABLE' } : null);
      }
    } catch {
      setBotState(prev => prev ? { ...prev, status: 'UNREACHABLE' } : null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Intervalo adaptativo de consulta según el estado actual
  useEffect(() => {
    fetchStatus();

    const pollInterval = refreshing || botState?.status === 'AUTHENTICATED' || botState?.status === 'INITIALIZING'
      ? 2000
      : botState?.status === 'QR_READY'
      ? 3000
      : 8000;

    const interval = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(interval);
  }, [fetchStatus, refreshing, botState?.status]);

  // Temporizador de cuenta regresiva para el QR en pantalla
  useEffect(() => {
    if (botState?.status !== 'QR_READY' || !botState?.qrData?.dataUrl || isQrExpired || refreshing) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsQrExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [botState?.status, botState?.qrData?.dataUrl, isQrExpired, refreshing]);

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que deseas desconectar la cuenta de WhatsApp?')) {
      return;
    }

    setDisconnecting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/whatsapp?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });

      const data = await res.json();
      if (data.success) {
        setBotState({
          status: 'DISCONNECTED',
          hasQr: false,
          connectedInfo: null,
          qrData: null
        });
        lastQrRef.current = null;
        setTimeout(fetchStatus, 1500);
        setTimeout(fetchStatus, 4000);
      } else {
        setErrorMessage(data.error || 'No se pudo desconectar la sesión.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión al intentar desconectar.');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRefreshQr = async () => {
    setRefreshing(true);
    setIsQrExpired(false);
    setErrorMessage(null);
    lastQrRef.current = null;

    setBotState(prev => prev ? {
      ...prev,
      status: 'INITIALIZING',
      hasQr: false,
      qrData: null
    } : null);

    try {
      const res = await fetch(`/api/whatsapp?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });

      const data = await res.json();
      if (data.success) {
        setTimeout(fetchStatus, 2000);
        setTimeout(fetchStatus, 4000);
        setTimeout(fetchStatus, 6500);
      } else {
        setErrorMessage(data.error || 'No se pudo regenerar el código QR.');
        setRefreshing(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión al regenerar.');
      setRefreshing(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) {
      setTestError('Ingresa un número de teléfono válido.');
      return;
    }

    setTestSending(true);
    setTestSuccess(null);
    setTestError(null);

    try {
      const cleanTarget = testPhone.replace(/\D/g, '');
      const formattedPhone = cleanTarget.startsWith('57') ? cleanTarget : `57${cleanTarget}`;

      const res = await fetch(`/api/whatsapp?_t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: formattedPhone,
          customMessage: '✨ *Telas Real* | Mensaje de prueba exitoso.\n\nHola! Tu bot de WhatsApp está conectado y listo para enviar notificaciones automáticas de pedidos.',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestSuccess(`¡Mensaje de prueba enviado con éxito a +57 ${cleanTarget.replace(/^57/, '')}!`);
      } else {
        setTestError(data.error || data.message || 'No se pudo enviar el mensaje.');
      }
    } catch (err: any) {
      setTestError(err.message || 'Error de conexión al enviar el mensaje de prueba.');
    } finally {
      setTestSending(false);
    }
  };

  const isConnected = botState?.status === 'CONNECTED';
  const isAuthenticated = botState?.status === 'AUTHENTICATED';
  const hasQr = Boolean(botState?.qrData?.dataUrl) && botState?.status === 'QR_READY' && !refreshing;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Header Minimalista */}
      <header className="bg-white border-b border-slate-200/80 py-4 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            ← Volver a la tienda
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : isAuthenticated
                  ? 'bg-blue-500 animate-pulse'
                  : botState?.status === 'QR_READY'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">
              {isConnected
                ? 'Conectado'
                : isAuthenticated
                ? 'Sincronizando chats...'
                : botState?.status === 'QR_READY'
                ? isQrExpired
                  ? 'Código QR caducado'
                  : `Esperando escaneo (${timeLeft}s)`
                : botState?.status === 'UNREACHABLE'
                ? 'Servicio apagado'
                : 'Iniciando navegador...'}
            </span>
          </div>
        </div>
      </header>

      {/* Contenido Central: Solo QR o Estado con Botón de Prueba y Desconexión */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 text-center transition-all">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
            WhatsApp Telas Real
          </h1>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-slate-500">Verificando estado del bot...</p>
            </div>
          ) : isConnected ? (
            /* Estado Conectado: Status, Botón de Prueba a +57 301 4453123 y Desconectar */
            <div className="py-4 flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-3xl shadow-inner">
                🟢
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  WhatsApp Conectado y Operativo
                </span>
                {botState?.connectedInfo?.user && (
                  <p className="text-sm font-mono font-medium text-slate-700 mt-1">
                    +{botState.connectedInfo.user}
                  </p>
                )}
                {botState?.connectedInfo?.name && (
                  <p className="text-xs text-slate-500">
                    {botState.connectedInfo.name}
                  </p>
                )}
              </div>

              {/* Sección de Prueba de Envío */}
              <div className="w-full p-4 bg-slate-50 border border-slate-200/90 rounded-2xl text-left flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🧪</span> Mensaje de Prueba
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Envía un mensaje de prueba inmediato a este número para confirmar que los mensajes salen correctamente:
                </p>

                {/* Input de Número */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-2 rounded-xl">
                    🇨🇴 +57
                  </span>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="301 4453123"
                    className="flex-1 text-xs font-mono font-medium text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Feedback de envío */}
                {testSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2 animate-in fade-in duration-200">
                    <span>✅</span>
                    <span className="flex-1">{testSuccess}</span>
                  </div>
                )}

                {testError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2 animate-in fade-in duration-200">
                    <span>❌</span>
                    <span className="flex-1">{testError}</span>
                  </div>
                )}

                {/* Botón Principal de Envío de Prueba */}
                <button
                  onClick={handleSendTestMessage}
                  disabled={testSending}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testSending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando mensaje a +57 {testPhone.replace(/\D/g, '').replace(/^57/, '')}...
                    </>
                  ) : (
                    <>
                      💬 Enviar mensaje de prueba a +57 {testPhone.replace(/\D/g, '').replace(/^57/, '') || '301 4453123'}
                    </>
                  )}
                </button>
              </div>

              {/* Botón de Desconexión */}
              <div className="w-full pt-2 border-t border-slate-100">
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100 active:scale-[0.98] border border-rose-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disconnecting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      Desconectando...
                    </>
                  ) : (
                    <>🔌 Desconectar sesión de WhatsApp</>
                  )}
                </button>
              </div>
            </div>
          ) : isAuthenticated ? (
            /* Estado Autenticado: QR Escaneado con éxito, sincronizando chats */
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  Dispositivo Vinculado
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  Sincronizando chats y mensajes...
                </p>
                <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                  WhatsApp Web se está conectando en el servidor. En pocos segundos verás la confirmación aquí.
                </p>
              </div>
            </div>
          ) : hasQr ? (
            /* Estado No Conectado: Código QR con indicador de vigencia y overlay de expiración */
            <div className="py-4 flex flex-col items-center gap-4">
              <div className="relative p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={botState?.qrData?.dataUrl || ''}
                  alt="Código QR de WhatsApp"
                  className={`w-56 h-56 rounded-lg object-contain transition-all duration-300 ${
                    isQrExpired ? 'opacity-20 blur-[2px]' : 'opacity-100'
                  }`}
                />

                {/* Overlay interactivo cuando el QR expira (idéntico al comportamiento oficial de WhatsApp Web) */}
                {isQrExpired && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center gap-2">
                    <span className="text-3xl">⚠️</span>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      Código QR caducado
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-[180px]">
                      Los códigos de WhatsApp duran 25 segundos por seguridad.
                    </p>
                    <button
                      onClick={handleRefreshQr}
                      disabled={refreshing}
                      className="mt-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      🔄 Recargar código
                    </button>
                  </div>
                )}
              </div>

              {/* Barra de progreso de vigencia o estado */}
              {!isQrExpired && (
                <div className="w-full max-w-[230px] flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Código activo
                  </span>
                  <span className="font-mono text-slate-600 font-semibold">
                    {timeLeft}s restantes
                  </span>
                </div>
              )}

              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Abre WhatsApp en tu teléfono &gt; <strong>Ajustes</strong> &gt;{' '}
                <strong>Dispositivos vinculados</strong> y escanea este código.
              </p>

              <button
                onClick={handleRefreshQr}
                disabled={refreshing}
                className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 mt-1 cursor-pointer disabled:opacity-50"
              >
                {refreshing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    Generando nuevo código...
                  </>
                ) : (
                  <>🔄 Generar nuevo código QR</>
                )}
              </button>
            </div>
          ) : (
            /* Estado Esperando Generación del QR / Reiniciando */
            <div className="py-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-800">
                {refreshing || botState?.status === 'INITIALIZING'
                  ? 'Generando nuevo código QR fresco...'
                  : botState?.status === 'UNREACHABLE'
                  ? 'Servicio de WhatsApp no accesible'
                  : 'Iniciando sesión en Railway...'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                {botState?.status === 'UNREACHABLE'
                  ? 'Verifica que el servicio esté activo en Railway.'
                  : 'El servidor está abriendo una sesión limpia de WhatsApp Web. En pocos segundos aparecerá el código aquí.'}
              </p>
              <button
                onClick={fetchStatus}
                className="mt-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                Comprobar estado ahora
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer Reglamentario (GEMINI.md) */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Telas Real. Todos los derechos reservados.</span>
          <a
            href="https://www.kytcode.lat"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-700 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
          >
            Desarrollado por K&amp;T <span className="text-black">♥</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
