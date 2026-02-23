import { createClient } from "next-sanity";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

async function main() {
    console.log("Starting Sublimados Assignment Migration...");

    // Find the ID of the 'Sublimados' or 'sublimados' category
    const categoryQuery = `*[_type == "category" && slug.current match "sublimado*"][0]._id`;
    const targetCategoryId = await client.fetch(categoryQuery);

    if (!targetCategoryId) {
        console.error("Could not find a category with slug matching 'sublimado*'");
        return;
    }

    console.log(`Found target category ID: ${targetCategoryId}`);

    // Fetch products matching the keyword that don't already have this exact category
    const productsQuery = `*[_type == "product" && (title match "*sublimad*" || title match "*sublimable*") && !(_id in path("drafts.**"))] {
        _id,
        title,
        categories
    }`;

    const matchingProducts = await client.fetch(productsQuery);
    console.log(`Found ${matchingProducts.length} products with 'sublimad' or 'sublimable' in their title.`);

    let updatedCount = 0;

    for (const product of matchingProducts) {
        const hasCategoryAlready = product.categories?.some((cat) => cat._ref === targetCategoryId);

        if (!hasCategoryAlready) {
            console.log(`Assigning Sublimados category to: ${product.title} (${product._id})`);
            try {
                // If it has categories, insert new one. Otherwise, create the array.
                const categoryRef = {
                    _type: 'reference',
                    _ref: targetCategoryId,
                    _key: `ref-${Math.random().toString(36).substring(7)}`
                };

                await client.patch(product._id)
                    .setIfMissing({ categories: [] })
                    .append('categories', [categoryRef])
                    .commit({ autoGenerateArrayKeys: true });

                updatedCount++;
            } catch (error) {
                console.error(`Failed to update ${product._id}:`, error);
            }
        } else {
            console.log(`Product "${product.title}" already has the category. Skipping...`);
        }
    }

    console.log(`Migration completed. Updated ${updatedCount} products.`);
}

main().catch(console.error);
