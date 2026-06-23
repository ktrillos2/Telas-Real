"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { ExternalLink, X } from "lucide-react"

export function PollaModal({ eventData, orderData }: { eventData: any, orderData: any }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Validaciones básicas
    if (!eventData || !eventData.isActive || !orderData) return

    // Chequear si es contraentrega
    const paymentMethod = orderData.paymentMethod || orderData.formData?.paymentMethod
    if (paymentMethod === "cod") return

    // Chequear fechas del evento
    const now = new Date()
    const startDate = eventData.startDate ? new Date(eventData.startDate) : null
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null

    const isAfterStart = !startDate || now >= startDate
    const isBeforeEnd = !endDate || now <= endDate

    if (isAfterStart && isBeforeEnd) {
      // Trigger modal and confetti after a small delay to let the page load
      const timer = setTimeout(() => {
        setIsOpen(true)
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#FFCD00', '#003087', '#C8102E'], // Amarillo, Azul, Rojo (Colombia)
          zIndex: 9999
        })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [eventData, orderData])

  if (!eventData) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-lg"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative border border-slate-100">
              {/* Bandera de Colombia Diagonal */}
              <div className="absolute top-6 -left-14 w-48 -rotate-45 z-20 pointer-events-none flex flex-col shadow-sm">
                <div className="w-full h-4 bg-[#FFCD00]" />
                <div className="w-full h-2 bg-[#003087]" />
                <div className="w-full h-2 bg-[#C8102E]" />
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="p-8 md:p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.04] z-0">
                  <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-primary blur-3xl" />
                  <div className="absolute bottom-1/4 -right-20 w-64 h-64 rounded-full bg-primary blur-3xl" />
                </div>
                
                <div className="relative z-10">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-primary/20">
                    ¡Sorpresa!
                  </span>
                  
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight text-balance">
                    {eventData.title || "¡Participa en la Polla Telas Real!"}
                  </h2>
                  
                  <p className="text-lg text-slate-600 mb-8 font-medium leading-relaxed">
                    {eventData.description || "Como gracias por tu compra, te invitamos a participar en nuestro evento especial."}
                  </p>
                  
                  <a 
                    href={eventData.formLink || "https://docs.google.com/forms/d/e/1FAIpQLScKihfs_1F3qLaJnKNyclIrL__ERWs9yXk89QbmJzZ7GABhSQ/viewform"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-wider rounded-xl shadow-[0_10px_20px_rgba(var(--primary),0.3)] hover:shadow-[0_15px_30px_rgba(var(--primary),0.4)] hover:-translate-y-1 transition-all duration-300 group"
                  >
                    ¡Quiero Participar!
                    <ExternalLink className="w-5 h-5 ml-3 group-hover:rotate-12 transition-transform" />
                  </a>
                  
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="mt-5 text-sm text-slate-400 font-medium hover:text-slate-600 underline underline-offset-4 transition-colors"
                  >
                    No gracias, en otro momento
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
