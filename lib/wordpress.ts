export const WP_API_URL = "https://www.telasreal.com/wp-json/wp/v2";

export interface BlogPost {
    id: number;
    date: string;
    slug: string;
    title: {
        rendered: string;
    };
    excerpt: {
        rendered: string;
    };
    content: {
        rendered: string;
    };
    _embedded?: {
        "wp:featuredmedia"?: Array<{
            source_url: string;
            alt_text: string;
        }>;
        "wp:term"?: Array<Array<{
            name: string;
            slug: string;
        }>>;
        author?: Array<{
            id: number;
            name: string;
            description: string;
            avatar_urls?: {
                [key: string]: string;
            };
        }>;
    };
}

export async function getPosts(perPage = 9): Promise<BlogPost[]> {
    try {
        const res = await fetch(`${WP_API_URL}/posts?_embed&per_page=${perPage}`, {
            next: { revalidate: 3600 }, // Revalidate every hour
        });

        if (!res.ok) {
            throw new Error("Failed to fetch posts");
        }

        return res.json();
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
        const res = await fetch(`${WP_API_URL}/posts?_embed&slug=${slug}`, {
            next: { revalidate: 3600 },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch post");
        }

        const posts = await res.json();
        return posts.length > 0 ? posts[0] : null;
    } catch (error) {
        console.error(`Error fetching post with slug ${slug}:`, error);
        return null;
    }
}

export function getFeaturedImage(post: BlogPost): string {
    return (
        post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        "/placeholder.svg"
    );
}

export function getCategory(post: BlogPost): string {
    return post._embedded?.["wp:term"]?.[0]?.[0]?.name || "General";
}

export function getAuthor(post: BlogPost): { name: string; avatar?: string } {
    const author = post._embedded?.author?.[0];
    return {
        name: author?.name || "Telas Real",
        avatar: author?.avatar_urls?.["96"] || author?.avatar_urls?.["48"],
    };
}

export function cleanExcerpt(excerpt: string, maxLength = 120): string {
    // Remove HTML tags
    let text = excerpt.replace(/<[^>]+>/g, "");

    // Decode HTML entities
    text = text.replace(/&hellip;/g, "...");
    text = text.replace(/&nbsp;/g, " ");
    text = text.replace(/&amp;/g, "&");
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#8230;/g, "...");

    // Remove various "read more" patterns (case insensitive)
    text = text.replace(/[\.…\s]*\s*(read\s*more|leer\s*más|continue\s*reading|seguir\s*leyendo)[^\w]*/gi, "");

    // Remove WordPress excerpt markers
    text = text.replace(/\[\s*…\s*\]/g, "");
    text = text.replace(/\[\s*\.\.\.\s*\]/g, "");

    // Clean up multiple spaces and dots
    text = text.replace(/\.{2,}/g, "...");
    text = text.replace(/\s{2,}/g, " ");

    // Trim whitespace
    text = text.trim();

    // Remove trailing dots or ellipsis
    text = text.replace(/[\.…\s]+$/, "");

    // Limit length and add ellipsis if needed
    if (text.length > maxLength) {
        text = text.substring(0, maxLength).trim();
        // Remove incomplete word at the end
        text = text.substring(0, text.lastIndexOf(" "));
        text = text + "...";
    }

    return text;
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export async function getRelatedPosts(
    currentPostId: number,
    limit = 3
): Promise<BlogPost[]> {
    try {
        const res = await fetch(
            `${WP_API_URL}/posts?_embed&per_page=${limit + 1}&exclude=${currentPostId}`,
            {
                next: { revalidate: 3600 },
            }
        );

        if (!res.ok) {
            throw new Error("Failed to fetch related posts");
        }

        const posts = await res.json();
        return posts.slice(0, limit);
    } catch (error) {
        console.error("Error fetching related posts:", error);
        return [];
    }
}
