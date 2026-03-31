
const { createClient } = require('@sanity/client');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !dataset) {
  console.error('Missing Sanity configuration in .env.local');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function checkStock() {
  try {
    const inStock = await client.fetch('count(*[_type == "product" && stockStatus == "inStock"])');
    const outOfStock = await client.fetch('count(*[_type == "product" && stockStatus == "outOfStock"])');
    const onBackorder = await client.fetch('count(*[_type == "product" && stockStatus == "onBackorder"])');
    const total = await client.fetch('count(*[_type == "product"])');

    console.log(`Live Stock Status:`);
    console.log(`- En Stock: ${inStock}`);
    console.log(`- Agotados: ${outOfStock}`);
    console.log(`- Bajo Pedido: ${onBackorder}`);
    console.log(`- Total Productos: ${total}`);
  } catch (error) {
    console.error('Error fetching stock status:', error.message);
  }
}

checkStock();
