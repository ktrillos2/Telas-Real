import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, Tag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getPostBySlug,
  getFeaturedImage,
  getCategory,
  formatDate,
  getAuthor,
  getRelatedPosts
} from "@/lib/wordpress"

export const revalidate = 3600 // Revalidate every hour

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return (
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-light mb-4">Artículo no encontrado</h1>
          <Link href="/blogs">
            <Button variant="outline">Volver al blog</Button>
          </Link>
        </main>
      </div>
    )
  }

  const author = getAuthor(post)
  const relatedPosts = await getRelatedPosts(post.id, 3)

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/blogs"
          className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al blog
        </Link>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <article className="bg-background rounded-lg shadow-sm overflow-hidden">
            <div className="relative aspect-[21/9] bg-muted">
              <Image
                src={getFeaturedImage(post)}
                alt={post.title.rendered}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-6 md:p-10">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                  <Tag className="h-3.5 w-3.5" />
                  {getCategory(post)}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.date)}
                </span>
              </div>

              <h1
                className="text-3xl md:text-4xl font-light mb-8 text-balance leading-tight"
                dangerouslySetInnerHTML={{ __html: post.title.rendered }}
              />

              <div
                className="elementor-content
                  [&_.elementor-section]:my-6 [&_.elementor-section]:clear-both
                  [&_.elementor-container]:w-full
                  [&_.elementor-row]:flex [&_.elementor-row]:flex-wrap [&_.elementor-row]:-mx-2
                  [&_.elementor-column]:px-2 [&_.elementor-column]:mb-4 [&_.elementor-column]:flex-1 [&_.elementor-column]:min-w-[250px]
                  [&_.elementor-widget-wrap]:space-y-4
                  [&_.elementor-widget-container]:mb-4
                  [&_.elementor-heading-title]:text-2xl [&_.elementor-heading-title]:font-normal [&_.elementor-heading-title]:mb-4 [&_.elementor-heading-title]:mt-8
                  [&_.elementor-image]:my-4 [&_.elementor-image]:rounded-lg [&_.elementor-image]:overflow-hidden
                  [&_.elementor-image_img]:w-full [&_.elementor-image_img]:h-auto [&_.elementor-image_img]:rounded-lg
                  [&_.elementor-text-editor]:leading-relaxed [&_.elementor-text-editor]:text-base
                  [&_.elementor-text-editor_p]:mb-4 [&_.elementor-text-editor_p]:leading-relaxed
                  [&_.elementor-text-editor_h2]:text-2xl [&_.elementor-text-editor_h2]:font-normal [&_.elementor-text-editor_h2]:mt-8 [&_.elementor-text-editor_h2]:mb-4
                  [&_.elementor-text-editor_h3]:text-xl [&_.elementor-text-editor_h3]:font-normal [&_.elementor-text-editor_h3]:mt-6 [&_.elementor-text-editor_h3]:mb-3
                  [&_.elementor-text-editor_h4]:text-lg [&_.elementor-text-editor_h4]:font-medium [&_.elementor-text-editor_h4]:mt-6 [&_.elementor-text-editor_h4]:mb-2
                  [&_.elementor-text-editor_ul]:list-disc [&_.elementor-text-editor_ul]:pl-6 [&_.elementor-text-editor_ul]:my-4 [&_.elementor-text-editor_ul]:space-y-1
                  [&_.elementor-text-editor_ol]:list-decimal [&_.elementor-text-editor_ol]:pl-6 [&_.elementor-text-editor_ol]:my-4 [&_.elementor-text-editor_ol]:space-y-1
                  [&_.elementor-text-editor_li]:leading-relaxed
                  [&_.elementor-text-editor_strong]:font-semibold
                  [&_.elementor-text-editor_em]:italic
                  [&_h2]:text-2xl [&_h2]:font-normal [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:leading-tight
                  [&_h3]:text-xl [&_h3]:font-normal [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:leading-tight
                  [&_h4]:text-lg [&_h4]:font-medium [&_h4]:mt-6 [&_h4]:mb-2
                  [&_p]:mb-5 [&_p]:leading-relaxed [&_p]:text-base
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-1
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-1
                  [&_li]:leading-relaxed [&_li]:mb-1
                  [&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4
                  [&_figure]:my-6 [&_figure]:mx-0
                  [&_a]:text-primary [&_a]:underline hover:[&_a]:no-underline
                  [&_strong]:font-semibold
                  [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: post.content.rendered }}
              />

              <div className="mt-10 pt-8 border-t border-border bg-primary/5 rounded-lg p-6">
                <h3 className="text-xl font-light mb-3">¿Interesado en telas personalizadas?</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Contáctanos para una cotización personalizada
                </p>
                <Link
                  href={`https://wa.me/573014453123?text=${encodeURIComponent("Hola, leí su artículo sobre " + post.title.rendered + " y me gustaría solicitar una cotización")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="w-full sm:w-auto">Solicitar Cotización</Button>
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Author */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-light flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Autor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{author.name}</p>
                    <p className="text-sm text-muted-foreground">Telas Real</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-light flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Publicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{formatDate(post.date)}</p>
              </CardContent>
            </Card>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-light">Artículos Relacionados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      href={`/blog/${relatedPost.slug}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                          <Image
                            src={getFeaturedImage(relatedPost)}
                            alt={relatedPost.title.rendered}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors"
                            dangerouslySetInnerHTML={{ __html: relatedPost.title.rendered }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(relatedPost.date)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-light flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/blogs">
                  <Button variant="outline" size="sm" className="w-full">
                    {getCategory(post)}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div >
  )
}
