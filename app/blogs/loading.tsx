import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function BlogsLoading() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section Skeleton */}
        <section className="py-16 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <Skeleton className="h-12 w-3/4 md:w-1/2 mx-auto mb-4" />
              <Skeleton className="h-6 w-2/3 md:w-1/3 mx-auto" />
            </div>

            {/* Search Bar Skeleton */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input disabled placeholder="Cargando..." className="pl-10 h-12" />
              </div>
            </div>
          </div>
        </section>

        {/* Blog Grid Skeleton */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
                  <Skeleton className="h-56 w-full" />
                  <div className="p-6 flex-1 flex flex-col space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
