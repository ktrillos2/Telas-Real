
import { createClient } from "next-sanity";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: "2024-02-05",
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

async function findProductsWithMetadata() {
    console.log("Searching for products with Tones or Usages...");

    // Query products that have non-null tones or usages
    const products = await client.fetch(`*[_type == "product" && (count(tones) > 0 || count(usages) > 0)][0...5]{ 
    title, 
    "toneSlugs": tones[]->slug.current,
    "usageSlugs": usages[]->slug.current,
    "categories": categories[]->slug.current
  }`);

    if (products.length === 0) {
        console.log("No products found with Tones or Usages assigned.");
    } else {
        console.log(JSON.stringify(products, null, 2));
    }
}

findProductsWithMetadata();
