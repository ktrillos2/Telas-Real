import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
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

  const { draftMode } = await import('next/headers')
  const { isEnabled: isDraftMode } = await draftMode()

  const posts = await client.fetch(`
    *[_type == "post"] | order(_createdAt desc) [0...${postsPerPage}] {
      _id,
      title,
      slug,
      "excerpt": metaDescription,
      mainImage {
        asset -> {
          url
        },
        alt
      },
      _createdAt
    }
  `, {}, {
      perspective: isDraftMode ? 'previewDrafts' : 'published',
      stega: isDraftMode,
      token: isDraftMode ? process.env.SANITY_API_TOKEN : undefined,
  })

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
            {posts.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">No hay artículos disponibles en este momento.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post: any) => (
                    <Link key={post._id} href={`/blog/${post.slug.current}`}>
                    <article className="group bg-background rounded-2xl overflow-hidden border border-border/40 hover:shadow-md transition-all duration-300 h-full flex flex-col">
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                            <Image
                            src={post.mainImage?.asset?.url || "/placeholder.svg"}
                            alt={post.mainImage?.alt || post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider">Blog</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(post._createdAt)}</span>
                            </div>
                            <h3
                                className="font-light text-2xl group-hover:text-primary transition-colors text-balance mb-3"
                            >
                                {post.title}
                            </h3>
                            <p className="text-sm font-light text-muted-foreground text-pretty line-clamp-3">
                                {post.excerpt || 'Descubre más sobre este artículo...'}
                            </p>
                        </div>
                    </article>
                    </Link>
                ))}
                </div>
            )}

            {/* Pagination */}
            {posts.length > 0 && (
                <div className="flex justify-center items-center gap-2 mt-16">
                {currentPage > 1 && (
                    <Button variant="outline" size="sm" asChild>
                    <Link href={`/blogs?page=${currentPage - 1}`}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                    </Link>
                    </Button>
                )}

                <span className="text-sm font-medium text-muted-foreground px-4 bg-muted/50 py-2 rounded-md">
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
            )}
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
              <Button size="lg" className="font-medium">
                Suscribirse
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
