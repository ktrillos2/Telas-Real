import { notFound } from "next/navigation"

/**
 * Portal Mayorista desactivado temporalmente en la web pública a petición del usuario.
 * Todo el código original y la integración ERP se encuentran respaldados en `app/mayorista/page.tsx.bak`
 * para ser reactivados cuando se decida reabrir el canal mayorista en la plataforma.
 */
export default function MayoristaPage() {
    notFound()
}
