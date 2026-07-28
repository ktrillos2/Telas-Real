import Link from "next/link"
import { Search, Home, PackageX } from "lucide-react"

export default function ProductNotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Icon */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02]">
        <PackageX className="w-[120vw] h-[120vw] text-[#0F172A] -rotate-12" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <div className="mb-6 flex justify-center">
          <PackageX className="w-20 h-20 text-gray-300 stroke-[1]" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-normal text-[#0F172A] mb-4">
          Producto no encontrado
        </h1>
        
        <p className="text-gray-500 font-light text-lg mb-12">
          El producto que buscas está agotado, ha sido descontinuado o el enlace es incorrecto.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/tienda"
            className="flex items-center gap-2 bg-[#0F172A] hover:bg-gray-800 text-white px-8 py-3.5 rounded-full text-sm font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Search className="w-4 h-4" />
            Ver todo el catálogo
          </Link>
          
          <Link
            href="/"
            className="flex items-center gap-2 bg-transparent hover:bg-gray-50 text-[#0F172A] border border-gray-200 px-8 py-3.5 rounded-full text-sm font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Ir al inicio
          </Link>
        </div>

        <div className="mt-16 text-sm text-gray-400">
          ¿Buscabas algo específico? <Link href="/pqr" className="text-gray-600 hover:text-[#0F172A] underline underline-offset-4">Solicitar cotización</Link>
        </div>
      </div>
    </main>
  )
}
