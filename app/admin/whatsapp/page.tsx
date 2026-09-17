'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    dataUrl?: string | null;
  } | null;
}

export default function WhatsAppAdminPage() {
  const [botState, setBotState] = useState<BotState | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBotState(data);
        setErrorMessage(null);
      } else {
        setBotState(prev => prev ? { ...prev, status: 'UNREACHABLE' } : null);
      }
    } catch {
      setBotState(prev => prev ? { ...prev, status: 'UNREACHABLE' } : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3500);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que deseas desconectar la cuenta de WhatsApp?')) {
      return;
    }

    setDisconnecting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/whatsapp', {
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
        });
        // Esperar 2 segundos para que el bot genere nuevo QR
        setTimeout(() => {
          fetchStatus();
        }, 2000);
      } else {
        setErrorMessage(data.error || 'No se pudo desconectar la sesión.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión al intentar desconectar.');
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = botState?.status === 'CONNECTED';
  const hasQr = Boolean(botState?.qrData?.dataUrl);

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
                  : botState?.status === 'QR_READY'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-semibold text-slate-700">
              {isConnected
                ? 'Conectado'
                : botState?.status === 'QR_READY'
                ? 'Esperando escaneo'
                : botState?.status === 'UNREACHABLE'
                ? 'Servicio apagado'
                : 'Iniciando...'}
            </span>
          </div>
        </div>
      </header>

      {/* Contenido Central: Solo QR o Estado con Botón de Desconexión */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 text-center transition-all">
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
            /* Estado Conectado: Solo Status y Botón Desconectarse */
            <div className="py-6 flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-4xl shadow-inner">
                🟢
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  WhatsApp Conectado
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

              <div className="w-full pt-4 border-t border-slate-100">
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] border border-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disconnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      Desconectando...
                    </>
                  ) : (
                    <>🔌 Desconectarse</>
                  )}
                </button>
              </div>
            </div>
          ) : hasQr ? (
            /* Estado No Conectado: Solo Código QR para Escanear */
            <div className="py-4 flex flex-col items-center gap-4">
              <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={botState?.qrData?.dataUrl || ''}
                  alt="Código QR de WhatsApp"
                  className="w-56 h-56 rounded-lg object-contain"
                />
              </div>

              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Abre WhatsApp en tu teléfono &gt; <strong>Ajustes</strong> &gt;{' '}
                <strong>Dispositivos vinculados</strong> y escanea este código.
              </p>

              <button
                onClick={fetchStatus}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 mt-1"
              >
                🔄 Actualizar código
              </button>
            </div>
          ) : (
            /* Estado Esperando Generación del QR */
            <div className="py-10 flex flex-col items-center gap-3">
              <div className="text-3xl animate-bounce">⏳</div>
              <p className="text-sm font-semibold text-slate-800">
                {botState?.status === 'UNREACHABLE'
                  ? 'Servicio de WhatsApp no accesible'
                  : 'Generando nuevo código QR...'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                {botState?.status === 'UNREACHABLE'
                  ? 'Verifica que el servicio esté activo en Railway.'
                  : 'Espera unos segundos mientras el servidor inicia la sesión.'}
              </p>
              <button
                onClick={fetchStatus}
                className="mt-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
              >
                Reintentar conexión
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
