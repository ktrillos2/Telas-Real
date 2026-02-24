import { createClient } from "next-sanity";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

async function main() {
    // Get sublimados category id
    const cat = await client.fetch(`*[_type == "category" && slug.current == "Productos/telas-sublimadas"][0]{ _id, name, "slug": slug.current }`);
    console.log("Category:", cat);

    // Get ALL products that reference this category (no stock filter)
    const allProds = await client.fetch(`*[_type == "product" && references("${cat._id}")]{ title, stockStatus, isVisible, "slug": slug.current }`);
    console.log("\nAll products referencing sublimados (no filter):", allProds.length);
    allProds.forEach(p => console.log(`  - ${p.title} | stockStatus: ${p.stockStatus} | isVisible: ${p.isVisible}`));

    // Get products WITH the stock filter (as used in tienda)
    const filtered = await client.fetch(`*[_type == "product" && (stockStatus == "inStock" || isVisible == true) && references("${cat._id}")]{ title, stockStatus, isVisible }`);
    console.log("\nFiltered products (stockStatus==inStock || isVisible==true):", filtered.length);
    filtered.forEach(p => console.log(`  - ${p.title} | stockStatus: ${p.stockStatus} | isVisible: ${p.isVisible}`));
}

main().catch(console.error);
