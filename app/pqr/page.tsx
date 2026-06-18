import { Metadata } from "next";
import { PqrForm } from "@/components/pqr-form";
import { MessageSquare, ShieldCheck, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Peticiones, Quejas, Reclamos y Sugerencias (PQR) | Telas Real",
  description: "Formulario para el registro de peticiones, quejas, reclamos y sugerencias de Telas Real. Estamos para escucharte.",
};

export default function PqrPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#E8F4F8] to-[#F8FAFC] py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] rounded-full bg-white opacity-40 blur-3xl mix-blend-overlay"></div>
          <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[100%] rounded-full bg-primary/10 opacity-50 blur-3xl mix-blend-overlay"></div>
        </div>
        
        <div className="relative z-10 mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-white/60 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md mb-4 shadow-sm">
            <span>Estamos para escucharte</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#1a202c] drop-shadow-sm">
            Centro de Ayuda y <span className="text-primary">PQRS</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            En Telas Real tu opinión es fundamental. Déjanos tus peticiones, quejas, reclamos o sugerencias y nuestro equipo te responderá a la brevedad.
          </p>
        </div>
      </section>

      {/* Info Cards Section */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 hidden md:block">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: MessageSquare,
              title: "Atención Personalizada",
              description: "Cada caso es revisado a detalle por nuestro equipo experto."
            },
            {
              icon: Clock,
              title: "Respuestas Rápidas",
              description: "Nos esforzamos por contestar en menos de 24 horas hábiles."
            },
            {
              icon: ShieldCheck,
              title: "Seguridad y Privacidad",
              description: "Tus datos están protegidos bajo nuestras políticas de privacidad."
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg shadow-black/5 p-8 flex flex-col items-center text-center border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 group">
              <div className="h-14 w-14 bg-[#E8F4F8] rounded-2xl flex items-center justify-center mb-5 text-[#1a202c] transition-colors group-hover:bg-[#1a202c] group-hover:text-white shadow-inner">
                <item.icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Form Section */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden backdrop-blur-xl">
          <div className="bg-gradient-to-r from-[#E8F4F8] to-white px-8 py-8 border-b border-gray-100 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/60 to-transparent"></div>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1a202c] relative z-10">
              Formulario de Solicitud
            </h2>
            <p className="text-gray-600 mt-2 text-sm md:text-base relative z-10">
              Por favor, completa los campos a continuación. Los campos indicados con asterisco (*) son obligatorios.
            </p>
          </div>
          <div className="p-6 sm:p-10 lg:p-12">
            <PqrForm />
          </div>
        </div>
      </section>
    </main>
  );
}
