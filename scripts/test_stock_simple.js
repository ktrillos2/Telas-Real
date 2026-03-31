
const { createClient } = require('@sanity/client');

const projectId = "tbk0k9ou";
const dataset = "production";
const token = "skER2rV1271qsq9yxGtrTCJgiQnxukdCZBtSd6jJGP3mFKnaeQADxIcNRWLDmoN04yjTXC20Q2gLwrOMxXKFyrUZ02pkT2zBoJtzTs7e2SP37FhsK3uScMK54MZDDPDWAkcmKLozPdUxNVn6kyfT3WpAk0r6hKBbRd6TlqYSZTRGbmAQrYNV";

const client = createClient({
  projectId,
  dataset,
  token: token,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function checkStock() {
  console.log('Connecting to Sanity...');
  try {
    const inStock = await client.fetch('count(*[_type == "product" && stockStatus == "inStock"])');
    const outOfStock = await client.fetch('count(*[_type == "product" && stockStatus == "outOfStock"])');
    const total = await client.fetch('count(*[_type == "product"])');

    console.log(`Live Stock Status:`);
    console.log(`- En Stock: ${inStock}`);
    console.log(`- Agotados: ${outOfStock}`);
    console.log(`- Total: ${total}`);
    process.exit(0);
  } catch (error) {
    console.error('Error fetching stock status:', error.message);
    process.exit(1);
  }
}

checkStock();
