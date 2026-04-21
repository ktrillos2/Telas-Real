const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '26sh22b6',
  dataset: 'production',
  apiVersion: '2023-05-03',
  useCdn: false
});

async function test() {
  const q1 = await client.fetch(`*[_type == "imagenSublimada"][0...5] { name, category }`);
  console.log("Q1 (Any images?):", q1.length > 0 ? q1 : "No images found");

  const q2 = await client.fetch(`count(*[_type == "imagenSublimada" && category == "BRUSH SUBLIMADO"])`);
  console.log("Q2 (Count BRUSH SUBLIMADO):", q2);

  const q3 = await client.fetch(`count(*[_type == "imagenSublimada" && category match "*"])`);
  console.log("Q3 (Count match '*'):", q3);
}

test().catch(console.error);
