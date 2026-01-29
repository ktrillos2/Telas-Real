import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { client } from "@/sanity/lib/client"

export const revalidate = 3600 // Revalidate every hour

function formatDate(dateString: string) {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default async function BlogsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams
  const currentPage = Number(page) || 1
  const postsPerPage = 9
  const posts = await client.fetch(`
    *[_type == "post"] | order(publishedAt desc) [0...${postsPerPage}] {
      _id,
      title,
      slug,
      excerpt,
      mainImage {
        asset -> {
          url
        }
      },
      publishedAt,
      author,
      category
    }
  `)

  // Calculate pagination (simple version - in production you'd get total from API)
  const hasMore = posts.length === postsPerPage

  return (
    <div className="min-h-screen">
      <main>
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-light mb-4 text-balance">Blog de Telas Real</h1>
            <p className="text-xl font-light text-muted-foreground mb-6 text-pretty max-w-2xl mx-auto">
              Consejos, guías y tendencias del mundo de las telas
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="search" placeholder="Buscar artículos..." className="pl-10 h-12" />
              </div>
            </div>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: any) => (
                <Link key={post._id} href={`/blog/${post.slug.current}`}>
                  <article className="group">
                    <div className="mb-4">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={post.mainImage?.asset?.url || "/placeholder.svg"}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs font-light text-muted-foreground">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded">{post.category || "General"}</span>
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <h3
                        className="font-medium text-lg group-hover:text-primary transition-colors text-balance"
                      >
                        {post.title}
                      </h3>
                      <p className="text-sm font-light text-muted-foreground text-pretty">
                        {post.excerpt}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-12">
              {currentPage > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/blogs?page=${currentPage - 1}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Link>
                </Button>
              )}

              <span className="text-sm text-muted-foreground px-4">
                Página {currentPage}
              </span>

              {hasMore && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/blogs?page=${currentPage + 1}`}>
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-light mb-4 text-balance">Suscríbete a Nuestro Newsletter</h2>
            <p className="text-xl font-light text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
              Recibe las últimas tendencias, consejos y ofertas directamente en tu correo
            </p>
            <div className="max-w-md mx-auto flex gap-2">
              <Input
                type="email"
                placeholder="Tu correo electrónico"
                className="bg-background"
              />
              <Button size="lg" className="font-light">
                Suscribirse
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
