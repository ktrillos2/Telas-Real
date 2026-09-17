'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface BotState {
  status: 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATED' | 'CONNECTED' | 'DISCONNECTED' | 'UNREACHABLE' | 'PRODUCTION_RESTRICTED';
  isTestMode: boolean;
  testPhone: string;
  isProductionRestricted?: boolean;
  connectedInfo?: {
    user: string;
    name: string;
  } | null;
  hasQr: boolean;
  qrData?: {
    hasQr: boolean;
    dataUrl?: string | null;
  } | null;
  recentHistory?: Array<{
    timestamp: string;
    direction: 'IN' | 'OUT';
    phone: string;
    template: string;
    snippet: string;
  }>;
}

const TEMPLATES = [
  {
    id: 'ORDER_CONFIRMATION',
    title: 'Confirmación de Compra',
    icon: '🎉',
    badge: 'Post-Venta',
    description: 'Se envía inmediatamente al confirmar el pago en la web. Incluye detalle de telas, valor total y número de pedido.',
    sample: 'Hola Keyner, tu pedido #TR-7821 por $89.500 ha sido confirmado. Estamos preparando tus cortes de tela...',
  },
  {
    id: 'ORDER_DISPATCH',
    title: 'Envío de Pedido (Coordinadora)',
    icon: '🚚',
    badge: 'Logística',
    description: 'Notifica que el paquete salió de bodega con la guía oficial de Coordinadora Mercantil y enlace de rastreo en vivo.',
    sample: 'Tu pedido #TR-7821 ya va en camino con Coordinadora. Guía: 75892104523. Haz clic para rastrearlo...',
  },
  {
    id: 'CART_REMINDER',
    title: 'Recordatorio de Carrito',
    icon: '⏰',
    badge: 'Conversión',
    description: 'Recupera clientes que dejaron telas seleccionadas en el carrito antes de que se agote la referencia.',
    sample: 'Tus telas te están esperando en Telas Real. Notamos que dejaste rollos pendientes. Continúa tu compra aquí...',
  },
  {
    id: 'SATISFACTION_SURVEY',
    title: 'Encuesta de Satisfacción',
    icon: '⭐',
    badge: 'Fidelización',
    description: 'Pide una calificación de 1 a 5 tras recibir el paquete. El bot responde automáticamente según el puntaje recibido.',
    sample: '¿Cómo calificarías tu experiencia con Telas Real del 1 al 5? Responde con un número del 1 al 5...',
  },
  {
    id: 'PROMOTIONS',
    title: 'Novedades y Promociones',
    icon: '✨',
    badge: 'Marketing',
    description: 'Aviso sobre nuevas referencias textiles en tendencia (Rib, Lino, Scuba) o promociones de temporada.',
    sample: '¡Nuevas Telas Rib y Scuba con 15% OFF! Llegaron nuevos rollos con acabados premium. Conócelas en la tienda...',
  },
];

export default function WhatsAppAdminPage() {
  const [botState, setBotState] = useState<BotState | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingTemplate, setSendingTemplate] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setBotState(data);
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
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleTestSend = async (templateId: string) => {
    setSendingTemplate(templateId);
    setAlertInfo(null);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', template: templateId }),
      });

      const data = await res.json();

      if (data.success) {
        setAlertInfo({
          type: 'success',
          message: `✅ ¡Mensaje enviado con éxito al número ${data.to || '3133087069'}! Revisa tu WhatsApp.`,
        });
        fetchStatus();
      } else {
        setAlertInfo({
          type: 'error',
          message: `❌ Error: ${data.message || data.error || 'No se pudo enviar el mensaje.'}`,
        });
      }
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: `❌ Error de red: ${err.message}`,
      });
    } finally {
      setSendingTemplate(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Conectado y Operativo
          </span>
        );
      case 'QR_READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Listo para Escaneo QR
          </span>
        );
      case 'AUTHENTICATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Sesión Autenticada
          </span>
        );
      case 'INITIALIZING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
            Iniciando Servicio...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Servicio Desconectado
          </span>
        );
    }
  };

  if (botState?.status === 'PRODUCTION_RESTRICTED' || botState?.isProductionRestricted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center text-3xl mb-4">
            🔒
          </div>
          <h1 className="text-xl font-bold mb-2 text-white">Panel de Pruebas Restringido</h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Por seguridad y privacidad de los clientes, este panel de pruebas, vinculación QR y simulación de mensajes de WhatsApp está habilitado <strong>únicamente en tu entorno local de desarrollo</strong>.
          </p>
          <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3.5 mb-6 text-xs text-slate-300 text-left font-mono space-y-1">
            <p>• Servidor web: <span className="text-emerald-400">http://localhost:3000/admin/whatsapp</span></p>
            <p>• Servicio bot: <span className="text-emerald-400">pnpm run whatsapp:bot</span></p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition"
          >
            ← Volver al Panel de Administración
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-md">
              💬
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Automatización de WhatsApp
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Telas Real • Notificaciones Transaccionales y Respuestas Automáticas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            {getStatusBadge(botState?.status)}
            <button
              onClick={fetchStatus}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300 flex items-center gap-1"
              title="Actualizar estado"
            >
              🔄 Refrescar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner de Seguridad - Modo de Pruebas */}
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl p-2 bg-white rounded-xl shadow-xs border border-emerald-200">
              🛡️
            </div>
            <div>
              <h2 className="text-base font-semibold text-emerald-950">
                Modo de Pruebas Restringido Activo
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800/90 mt-0.5">
                El bot <strong className="underline decoration-emerald-500">únicamente interactúa y responde</strong> al número autorizado: <span className="font-mono bg-white px-2 py-0.5 rounded text-emerald-900 border border-emerald-300 font-bold">+57 {botState?.testPhone || '3133087069'}</span>. Cualquier mensaje de clientes reales o grupos está 100% bloqueado.
              </p>
            </div>
          </div>
          <div className="text-xs text-emerald-700 bg-white/80 px-3 py-2 rounded-lg border border-emerald-200 self-stretch sm:self-auto text-center">
            🔒 Seguridad Garantizada
          </div>
        </div>

        {/* Feedback Alert */}
        {alertInfo && (
          <div
            className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between transition-all ${
              alertInfo.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <span>{alertInfo.message}</span>
            <button
              onClick={() => setAlertInfo(null)}
              className="text-xs underline hover:opacity-75 ml-4"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Grid de Estado y Vinculación QR */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjeta de Vinculación QR */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Vinculación con WhatsApp
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Escanea con tu WhatsApp para conectar el bot
            </p>

            {loading ? (
              <div className="w-56 h-56 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm animate-pulse">
                Comprobando estado...
              </div>
            ) : botState?.status === 'CONNECTED' ? (
              <div className="w-full py-8 px-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mb-3 shadow-inner">
                  ✓
                </div>
                <h3 className="font-bold text-emerald-900 text-base">
                  ¡Cuenta Vinculada con Éxito!
                </h3>
                <p className="text-xs text-emerald-700 mt-1">
                  Número activo: <span className="font-mono font-semibold">+{botState.connectedInfo?.user || 'Conectado'}</span>
                </p>
                <div className="mt-4 pt-4 border-t border-emerald-200 w-full text-xs text-slate-600 space-y-1 text-left">
                  <p>• <strong>Sesión:</strong> Persistente (LocalAuth)</p>
                  <p>• <strong>Auto-respuesta:</strong> Habilitada</p>
                  <p>• <strong>Destino seguro:</strong> {botState.testPhone}</p>
                </div>
              </div>
            ) : botState?.qrData?.dataUrl ? (
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={botState.qrData.dataUrl}
                    alt="Código QR de WhatsApp"
                    className="w-56 h-56 rounded-lg"
                  />
                </div>
                <p className="text-xs font-semibold text-emerald-700 mt-3 animate-pulse">
                  📲 Apunta la cámara de WhatsApp a este código
                </p>
              </div>
            ) : (
              <div className="w-full py-8 px-4 bg-amber-50/60 rounded-2xl border border-amber-200 flex flex-col items-center">
                <div className="text-3xl mb-2">⏳</div>
                <h3 className="font-bold text-amber-900 text-sm">
                  {botState?.status === 'UNREACHABLE' ? 'Bot Apagado' : 'Generando Código QR...'}
                </h3>
                <p className="text-xs text-amber-800/80 mt-1 max-w-xs">
                  {botState?.status === 'UNREACHABLE'
                    ? 'Inicia el bot ejecutando en tu terminal: pnpm run whatsapp:bot'
                    : 'Espere unos segundos mientras se inicializa el cliente de WhatsApp.'}
                </p>
              </div>
            )}

            {/* Instrucciones Rápidas */}
            <div className="w-full mt-6 text-left text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-4">
              <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                Paso a Paso en tu Celular:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Abre WhatsApp en tu teléfono.</li>
                <li>Toca en <strong>Ajustes / Configuración</strong>.</li>
                <li>Elige <strong>Dispositivos vinculados</strong>.</li>
                <li>Toca en <strong>Vincular un dispositivo</strong> y escanea el código.</li>
              </ol>
            </div>
          </div>

          {/* Tarjeta de Guía de Auto-Respuestas */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Flujo de Respuestas Inteligentes
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Filtro 3133087069
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Cuando escribas desde tu número de prueba <span className="font-mono font-bold text-slate-700">3133087069</span>, el bot responderá inmediatamente según el texto o número que envíes:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <span>💬</span>
                    <span>Envías: &quot;Hola&quot; o &quot;Menú&quot;</span>
                  </div>
                  <p className="text-slate-600">
                    Responde con el saludo oficial y el menú interactivo de 5 opciones de Telas Real.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <span>⭐</span>
                    <span>Envías: &quot;1&quot; al &quot;5&quot; (Encuesta)</span>
                  </div>
                  <p className="text-slate-600">
                    Agradece la calificación recibida o canaliza casos insatisfechos con calidad.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <span>🚚</span>
                    <span>Envías: &quot;2&quot; o &quot;Envíos&quot;</span>
                  </div>
                  <p className="text-slate-600">
                    Informa tiempos de entrega de 1 a 3 días con Coordinadora Mercantil y rastreo de guía.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <span>🌐</span>
                    <span>Envías: &quot;4&quot; o &quot;Catálogo&quot;</span>
                  </div>
                  <p className="text-slate-600">
                    Proporciona el enlace directo a la tienda virtual y lista de telas principales.
                  </p>
                </div>
              </div>
            </div>

            {/* Historial Reciente de Mensajes */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                Registro de Actividad en Tiempo Real
              </h3>
              {botState?.recentHistory && botState.recentHistory.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                  {botState.recentHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.direction === 'IN'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.direction === 'IN' ? 'ENTRANTE' : 'SALIENTE'}
                        </span>
                        <span className="font-mono text-slate-600">{item.phone}</span>
                      </div>
                      <span className="text-slate-500 truncate max-w-xs">{item.snippet}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Aún no hay mensajes en la sesión actual. Los mensajes aparecerán aquí a medida que interactúes.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Sección de Banco de Pruebas: 5 Plantillas Oficiales */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Banco de Pruebas de Mensajería
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Haz clic en cualquier plantilla para enviarla inmediatamente a tu número de prueba: <strong className="text-slate-800">+57 {botState?.testPhone || '3133087069'}</strong>
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-300 self-start sm:self-auto">
              5 Automatizaciones Disponibles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEMPLATES.map((tpl) => {
              const isSending = sendingTemplate === tpl.id;
              const isConnected = botState?.status === 'CONNECTED';

              return (
                <div
                  key={tpl.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                        {tpl.icon}
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {tpl.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mb-1">
                      {tpl.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      {tpl.description}
                    </p>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 mb-5 italic line-clamp-3">
                      &quot;{tpl.sample}&quot;
                    </div>
                  </div>

                  <button
                    onClick={() => handleTestSend(tpl.id)}
                    disabled={isSending || !isConnected}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                      !isConnected
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : isSending
                        ? 'bg-emerald-700 text-white cursor-wait'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow active:scale-[0.98]'
                    }`}
                  >
                    {isSending ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enviando al 3133087069...</span>
                      </>
                    ) : !isConnected ? (
                      <span>Conecta WhatsApp primero</span>
                    ) : (
                      <>
                        <span>Enviar Prueba a 3133087069</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer Obligatorio según GEMINI.md (Reglas 29, 30, 31, 32) */}
      <footer className="bg-slate-900 text-slate-300 py-6 px-4 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <span>
              © {new Date().getFullYear()} Telas Real. Todos los derechos reservados.
            </span>
          </div>

          <div>
            <Link
              href="https://www.kytcode.lat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-slate-200 hover:text-white transition-colors"
            >
              <span>Desarrollado por K&amp;T</span>
              {/* Icono de corazón blanco por estar sobre fondo oscuro (Regla 31) */}
              <svg
                className="w-3.5 h-3.5 text-white fill-white inline-block"
                viewBox="0 0 24 24"
                aria-label="heart"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
