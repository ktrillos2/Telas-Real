import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, Tag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { client } from "@/sanity/lib/client"
import { PortableText } from "next-sanity"

export const revalidate = 3600 // Revalidate every hour

function formatDate(dateString: string) {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

import { Metadata } from 'next'

export async function generateStaticParams() {
  const posts = await client.fetch(`*[_type == "post"]{ "slug": slug.current }`)

  return posts.map((post: any) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]{ title, excerpt }`, { slug })

  if (!post) {
    return {
      title: 'Artículo no encontrado',
    }
  }

  return {
    title: `${post.title} | Telas Real`,
    description: post.excerpt || `Lee nuestro artículo sobre ${post.title}`,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      publishedAt,
      author,
      category,
      mainImage {
        asset -> {
          url
        }
      },
      content,
      "related": *[_type == "post" && _id != ^._id] | order(publishedAt desc) [0...3] {
        _id,
        title,
        slug,
        publishedAt,
        mainImage {
            asset -> {
                url
            }
        }
      }
    }
  `, { slug })

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

  const relatedPosts = post.related || []

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
                src={post.mainImage?.asset?.url || "/placeholder.svg"}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-6 md:p-10">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                  <Tag className="h-3.5 w-3.5" />
                  {post.category || "General"}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.publishedAt)}
                </span>
              </div>

              <h1
                className="text-3xl md:text-4xl font-light mb-8 text-balance leading-tight"
              >
                {post.title}
              </h1>

              <div className="prose prose-lg max-w-none prose-headings:font-light prose-p:font-light prose-a:text-primary">
                {post.content && <PortableText value={post.content} />}
              </div>

              <div className="mt-10 pt-8 border-t border-border bg-primary/5 rounded-lg p-6">
                <h3 className="text-xl font-light mb-3">¿Interesado en telas personalizadas?</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Contáctanos para una cotización personalizada
                </p>
                <Link
                  href={`https://wa.me/573014453123?text=${encodeURIComponent("Hola, leí su artículo sobre " + post.title + " y me gustaría solicitar una cotización")}`}
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
                    <p className="font-medium">{post.author || "Telas Real"}</p>
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
                <p className="text-sm">{formatDate(post.publishedAt)}</p>
              </CardContent>
            </Card>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-light">Artículos Relacionados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedPosts.map((relatedPost: any) => (
                    <Link
                      key={relatedPost._id}
                      href={`/blog/${relatedPost.slug.current}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                          <Image
                            src={relatedPost.mainImage?.asset?.url || "/placeholder.svg"}
                            alt={relatedPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors"
                          >
                            {relatedPost.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(relatedPost.publishedAt)}
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
                    {post.category || "General"}
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
