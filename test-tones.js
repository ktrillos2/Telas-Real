const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: '26sh22b6',
  dataset: 'production',
  apiVersion: '2023-05-03',
  useCdn: false
});

async function test() {
  const tones = await client.fetch(`*[_type == "tone"] { title, value }`);
  console.log("Tones in DB:", tones);
}

test().catch(console.error);
