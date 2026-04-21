import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar } from "lucide-react"
import { client } from "@/sanity/lib/client"
import { PortableText, PortableTextComponents } from "next-sanity"
import { ProductCardRef } from "@/components/blog/product-card-ref"
import { ProductCarousel } from "@/components/blog/product-carousel"
import { urlFor } from "@/sanity/lib/image"
import { Metadata } from 'next'

export const revalidate = 3600 // Revalidate every hour

function formatDate(dateString: string) {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export async function generateStaticParams() {
  const posts = await client.fetch(`*[_type == "post"]{ "slug": slug.current }`)
  return posts.map((post: any) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await client.fetch(`*[_type == "post" && slug.current == $slug][0]{ metaTitle, metaDescription, title }`, { slug })

  if (!post) {
    return { title: 'Artículo no encontrado' }
  }

  return {
    title: `${post.metaTitle || post.title} | Telas Real`,
    description: post.metaDescription || `Lee nuestro artículo sobre ${post.title}`,
  }
}

function groupProductReferences(blocks: any[]) {
  if (!Array.isArray(blocks)) return blocks;
  
  const grouped: any[] = [];
  let currentGroup: any[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    if (block._type === 'productReference') {
      currentGroup.push(block);
    } else {
      if (currentGroup.length === 1) {
        grouped.push(currentGroup[0]); 
        currentGroup = [];
      } else if (currentGroup.length > 1) {
        grouped.push({
          ...currentGroup[0],
          _key: `group-${currentGroup[0]._key}`,
          _type: 'productGroup',
          products: currentGroup,
        });
        currentGroup = [];
      }
      grouped.push(block);
    }
  }

  if (currentGroup.length === 1) {
    grouped.push(currentGroup[0]);
  } else if (currentGroup.length > 1) {
    grouped.push({
      ...currentGroup[0],
      _key: `group-${currentGroup[0]._key}`,
      _type: 'productGroup',
      products: currentGroup,
    });
  }

  return grouped;
}

const portableTextComponentsPersonalizado: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      // Support both expanded asset (asset.url) and reference (asset._ref)
      const imageUrl: string | null = value?.asset?.url || (value?.asset?._ref ? urlFor(value).url() : null)
      if (!imageUrl) return null

      // Clean stega-encoded values (preview mode wraps strings with metadata)
      // We strip anything that's not a plain string character
      const cleanStr = (s: string | undefined, fallback: string) => {
        if (!s) return fallback
        // Remove stega zero-width characters if present
        return s.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() || fallback
      }

      // Map size values to CSS widths
      const sizeMap: Record<string, string> = {
        small: '30%',
        medium: '60%',
        large: '80%',
        full: '100%',
      }
      // Map aspect ratio values to CSS
      const aspectMap: Record<string, string> = {
        square: '1 / 1',
        wide: '16 / 9',
        classic: '4 / 3',
        auto: 'auto',
      }

      const alignment = cleanStr(value.alignment, 'center')
      const size = cleanStr(value.size, 'full')
      const aspectRatio = cleanStr(value.aspectRatio, 'auto')

      const width = sizeMap[size] ?? '100%'
      const aspect = aspectMap[aspectRatio] ?? 'auto'
      const isAuto = aspect === 'auto'

      // Determine flex justify based on alignment
      const justifyMap: Record<string, string> = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
      }
      const justify = justifyMap[alignment] ?? 'center'

      const altText = value.alt || 'Imagen del artículo'

      return (
        <figure
          className="my-8"
          style={{ display: 'flex', justifyContent: justify, width: '100%' }}
        >
          <div
            style={{
              width,
              position: 'relative',
              ...(isAuto ? {} : { aspectRatio: aspect }),
              borderRadius: '0.5rem',
              overflow: 'hidden',
            }}
          >
            {isAuto ? (
              // Original ratio: show full image without cropping
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={altText}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '0.5rem' }}
              />
            ) : (
              <Image
                src={imageUrl}
                alt={altText}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 80vw"
              />
            )}
          </div>
          <figcaption style={{ display: 'none' }}>{altText}</figcaption>
        </figure>
      )
    },
    video: ({ value }) => {
      if (!value?.url) return null
      return (
        <div className="my-8 aspect-video rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
            {/* Si es youtube podriamos embeber, por ahora link */}
            <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">Ver video relacionado</a>
        </div>
      )
    },
    productReference: ({ value }) => {
        if(!value?.product) return null
        return <ProductCardRef value={value.product} />
    },
    productGroup: ({ value }) => {
        if (!value?.products) return null
        return <ProductCarousel products={value.products} />
    }
  },
  block: {
    h1: ({ children }) => <h2 className="text-3xl font-light mt-12 mb-6 text-balance text-foreground">{children}</h2>, // Fallback to H2 natively for strict semantic SEO
    h2: ({ children }) => <h2 className="text-3xl font-light mt-12 mb-6 text-balance text-foreground">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-light mt-8 mb-4 text-balance text-foreground">{children}</h3>,
    h4: ({ children }) => <h4 className="text-xl font-light mt-6 mb-3 text-balance text-foreground">{children}</h4>,
    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-6">{children}</blockquote>,
    normal: ({ children }) => <p className="leading-relaxed mb-6 font-light">{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2 font-light">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-2 font-light">{children}</ol>,
  },
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { draftMode } = await import('next/headers')
  const { isEnabled: isDraftMode } = await draftMode()
  
  const post = await client.fetch(`
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      _createdAt,
      mainImage {
        asset -> {
          url
        },
        alt
      },
      content[]{
        ...,
        _type == "image" => {
          _type,
          _key,
          alt,
          alignment,
          size,
          aspectRatio,
          "asset": asset->{ _id, url, metadata { lqip, dimensions } }
        },
        _type == "productReference" => {
          "product": @->{
            title,
            "slug": slug,
            price,
            salePrice,
            "mainImage": images[0]
          }
        }
      },
      "related": *[_type == "post" && _id != ^._id] | order(_createdAt desc) [0...3] {
        _id,
        title,
        slug,
        _createdAt,
        mainImage {
            asset -> {
                url
            }
        }
      }
    }
  `, { slug }, {
      perspective: isDraftMode ? 'previewDrafts' : 'published',
      stega: isDraftMode,
      token: isDraftMode ? process.env.SANITY_API_TOKEN : undefined,
  })

  if (!post) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-light mb-4">Artículo no encontrado</h1>
          <Link href="/blogs" className="text-primary hover:underline">
            Volver al blog
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
          className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al blog
        </Link>

        <article className="max-w-4xl mx-auto bg-background rounded-2xl shadow-sm border border-border/40 overflow-hidden">
          <div className="relative aspect-[21/9] bg-muted w-full">
            <Image
              src={post.mainImage?.asset?.url || "/placeholder.svg"}
              alt={post.mainImage?.alt || post.title}
              fill
              priority
              className="object-cover"
            />
          </div>

          <div className="p-6 md:p-12 lg:px-16">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                Blog
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post._createdAt)}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-light mb-10 text-balance leading-tight text-foreground">
              {post.title}
            </h1>

            <div className="prose prose-lg max-w-none prose-a:text-primary hover:prose-a:text-primary/80 transition-colors">
              {post.content ? (
                <PortableText 
                  value={groupProductReferences(post.content)} 
                  components={portableTextComponentsPersonalizado}
                />
              ) : (
                <p className="text-muted-foreground italic">Este artículo aún no tiene contenido.</p>
              )}
            </div>
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <section className="max-w-4xl mx-auto mt-16 pb-8">
            <h3 className="text-2xl font-light mb-8">Artículos Recientes</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost: any) => (
                <Link
                  key={relatedPost._id}
                  href={`/blog/${relatedPost.slug.current}`}
                  className="group block"
                >
                  <div className="bg-background rounded-xl overflow-hidden border border-border/40 hover:shadow-md transition-all duration-300">
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <Image
                        src={relatedPost.mainImage?.asset?.url || "/placeholder.svg"}
                        alt={relatedPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors text-balance">
                        {relatedPost.title}
                      </h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatDate(relatedPost._createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
