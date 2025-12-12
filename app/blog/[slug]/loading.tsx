import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"

export default function BlogPostLoading() {
    return (
        <div className="min-h-screen">
            <Header />
            <main>
                <article className="container mx-auto px-4 py-12 max-w-4xl">
                    <div className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground mb-8 opacity-50">
                        <ArrowLeft className="h-4 w-4" />
                        Volver al blog
                    </div>

                    <div className="mb-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-12 w-1/2" />
                    </div>

                    <Skeleton className="aspect-[16/9] w-full mb-8 rounded-lg" />

                    <div className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <div className="h-8" />
                        <Skeleton className="h-8 w-1/3 mb-4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </article>
            </main>
            <Footer />
        </div>
    )
}
