import Link from "next/link"
import { Home, Search, Scissors } from "lucide-react"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Icon */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02]">
        <Scissors className="w-[120vw] h-[120vw] text-[#0F172A] -rotate-12" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <h1 className="text-[120px] md:text-[180px] font-light text-[#0F172A] leading-none tracking-tighter mb-4">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-normal text-[#0F172A] mb-4">
          Página no encontrada
        </h2>
        
        <p className="text-gray-500 font-light text-lg mb-12">
          La página que buscas no existe, ha sido movida o el enlace es incorrecto.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 bg-[#0F172A] hover:bg-gray-800 text-white px-8 py-3.5 rounded-full text-sm font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Volver al inicio
          </Link>
          
          <Link
            href="/tienda"
            className="flex items-center gap-2 bg-transparent hover:bg-gray-50 text-[#0F172A] border border-gray-200 px-8 py-3.5 rounded-full text-sm font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Search className="w-4 h-4" />
            Ir a la tienda
          </Link>
        </div>

        <div className="mt-16 text-sm text-gray-400">
          ¿Necesitas ayuda? <Link href="/pqr" className="text-gray-600 hover:text-[#0F172A] underline underline-offset-4">Contáctanos</Link>
        </div>
      </div>
    </main>
  )
}
