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
    title?: string;
    description?: string;
    buttonText?: string;
  };
}

export function PromoPopup({ config }: PromoPopupProps) {
  const [showBadge, setShowBadge] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  console.log("PromoPopup config received:", config);

  useEffect(() => {
    if (!config?.isActive) return;
    
    // Mostrar la etiqueta o el modal después del tiempo configurado
    const delay = (config.delaySeconds || 5) * 1000;
    const timer = setTimeout(() => {
      // Si ya cerró el popup en esta sesión, solo mostramos la etiqueta
      const hasSeen = sessionStorage.getItem("telasreal_promo_seen");
      if (hasSeen) {
        setShowBadge(true);
      } else {
        setIsOpen(true);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [config]);

  const handleClose = () => {
    setIsOpen(false);
    setShowBadge(true);
    sessionStorage.setItem("telasreal_promo_seen", "true");
  };

  if (!config?.isActive) {
    console.log("PromoPopup is NOT active or config is missing. Returning null.");
    return null;
  }

  console.log("PromoPopup IS active. Rendering...");

  return (
    <>
      {/* Etiqueta flotante */}
      <AnimatePresence>
        {showBadge && !isOpen && (
          <motion.button
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => setIsOpen(true)}
            style={{ 
              writingMode: "vertical-rl", 
              textOrientation: "mixed", 
              transform: "translateY(-50%)" 
            }}
            className="fixed right-0 top-1/2 z-50 bg-white text-[#333] font-black py-4 px-2 rounded-r-none rounded-l-2xl shadow-[-4px_0_15px_rgba(0,0,0,0.15)] hover:bg-gray-50 flex items-center justify-center transition-all hover:pl-4 border border-r-0 border-gray-200"
          >
            <span className="text-sm md:text-base tracking-widest whitespace-nowrap">
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
              onClick={handleClose}
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
                onClick={handleClose}
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
                  <h3 className="text-3xl md:text-4xl font-extrabold text-black mb-4 leading-tight">
                    {config.title || "10% de descuento en tu primera compra"}
                  </h3>
                  {config.description && (
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                      {config.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleClose}
                  className="w-full mt-4 bg-black hover:bg-gray-800 text-white font-bold py-3 md:py-4 transition-colors text-sm md:text-base rounded-sm tracking-wide shadow-sm"
                >
                  {config.buttonText || "Entendido"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
