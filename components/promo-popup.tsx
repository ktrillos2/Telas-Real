"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

interface PromoPopupProps {
  config?: {
    isActive?: boolean;
    delaySeconds?: number;
    badgeText?: string;
    imageUrl?: string;
    brandText?: string;
    subtitle1?: string;
    title?: string;
    subtitle2?: string;
  };
}

export function PromoPopup({ config }: PromoPopupProps) {
  const [showBadge, setShowBadge] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!config?.isActive) return;
    
    // Mostrar la etiqueta flotante después del tiempo configurado
    const delay = (config.delaySeconds || 5) * 1000;
    const timer = setTimeout(() => {
      setShowBadge(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [config]);

  if (!config?.isActive) return null;

  return (
    <>
      {/* Etiqueta flotante */}
      <AnimatePresence>
        {showBadge && !isOpen && (
          <motion.button
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => setIsOpen(true)}
            style={{ 
              writingMode: "vertical-rl", 
              textOrientation: "mixed", 
              transform: "rotate(180deg) translateY(50%)" 
            }}
            className="fixed left-0 top-1/2 z-50 bg-white text-[#333] font-black py-6 px-3 rounded-l-none rounded-r-2xl shadow-[4px_0_15px_rgba(0,0,0,0.15)] hover:bg-gray-50 flex items-center justify-center transition-all hover:pr-4 border border-l-0 border-gray-200"
          >
            <span className="text-xl md:text-2xl tracking-widest whitespace-nowrap">
              {config.badgeText || "10% OFF"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlay y Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Fondo oscuro desenfocado */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-[900px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 max-h-[90vh]"
            >
              {/* Botón Cerrar */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-20 p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg"
              >
                <X size={20} />
              </button>

              {/* Lado Izquierdo - Imagen */}
              <div className="w-full md:w-1/2 relative min-h-[200px] sm:min-h-[300px] md:min-h-[500px] bg-gray-100">
                <Image
                  src={config.imageUrl || "/og-image.png"} 
                  alt={config.title || "Promoción especial"}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Lado Derecho - Contenido y Formulario */}
              <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-center overflow-y-auto">
                <div className="text-center mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold tracking-[0.2em] mb-4 uppercase text-black">
                    {config.brandText || "TELAS REAL"}
                  </h2>
                  <p className="text-gray-700 mb-1 text-sm md:text-base">
                    {config.subtitle1 || "Regístrate ahora y recibe"}
                  </p>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-black mb-2 leading-tight">
                    {config.title || "10% de descuento"}
                  </h3>
                  <p className="text-gray-700 text-sm md:text-base">
                    {config.subtitle2 || "en tu primera compra"}
                  </p>
                </div>

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsOpen(false); }}>
                  <div>
                    <input
                      type="text"
                      placeholder="Nombre"
                      required
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all rounded-sm text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      required
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all rounded-sm text-sm"
                    />
                  </div>
                  <div className="flex">
                    <select className="px-3 py-3 border border-gray-300 border-r-0 focus:outline-none bg-white rounded-l-sm text-sm">
                      <option>🇨🇴</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="WhatsApp"
                      required
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all rounded-r-sm text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Fecha de cumpleaños"
                      onFocus={(e) => (e.target.type = "date")}
                      onBlur={(e) => (e.target.type = e.target.value ? "date" : "text")}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all rounded-sm text-gray-500 text-sm"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full mt-8 bg-[#bacbd6] hover:bg-[#a6b8c4] text-black font-bold py-3 md:py-4 transition-colors text-sm md:text-base rounded-sm tracking-wide shadow-sm"
                  >
                    Registrarme
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
