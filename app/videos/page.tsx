import { client } from "@/sanity/lib/client"
import { VideoFeed } from "@/components/video-feed"
import { Metadata } from "next"
import { VideoOff } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Videos y Reels | Telas Real",
    description: "Explora nuestros videos verticales, inspírate y descubre la mejor forma de usar nuestras telas.",
}

export const revalidate = 60 // Revalidate every 60 seconds

export default async function VideosPage() {
    const data = await client.fetch(`
        *[_type == "shortVideo" && isActive == true] | order(_createdAt desc) {
            "id": _id,
            title,
            description,
            likes,
            "videoUrl": videoFile.asset->url,
            "thumbnailUrl": thumbnail.asset->url,
            relatedProduct->{
                "name": title,
                "slug": slug.current,
                price,
                salePrice,
                "image": images[0].asset->url
            }
        }
    `)

    if (data.length === 0) {
        return (
            <div className="min-h-[100dvh] bg-background pb-[64px] lg:pb-0 flex flex-col">
                <div className="container mx-auto px-4 flex-1 flex flex-col items-center justify-center py-12">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-primary/20">
                        <VideoOff className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-light mb-3 text-center text-primary">Aún no hay videos</h2>
                    <p className="text-center text-muted-foreground font-light mb-8 max-w-md leading-relaxed md:text-lg">
                        Estamos preparando contenido increíble para ti. ¡Vuelve pronto para inspirarte con nuestras telas!
                    </p>
                    <Link href="/tienda">
                        <button className="bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-medium hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 shadow-md">
                            Explorar Tienda
                        </button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        // Mobile: pantalla completa (sin header). Desktop: descuenta el header
        <div className="h-[100dvh] lg:h-[calc(100dvh-150px)] bg-zinc-950 flex flex-col w-full overflow-hidden">
            <div className="hidden lg:flex w-full max-w-[450px] mx-auto justify-between items-end my-4 px-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-white">Reels</h1>
                    <p className="text-sm text-zinc-400">Inspiración en movimiento</p>
                </div>
            </div>
            <div className="flex-1 w-full relative min-h-0">
                <VideoFeed videos={data} />
            </div>
        </div>
    )
}
