import { google } from 'googleapis';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';

const MERCHANT_ID = process.env.GOOGLE_MERCHANT_ID;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://telasreal.com';

export async function syncProductsToGoogle() {
  if (!MERCHANT_ID || !CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error('Missing Google Merchant Center credentials in .env.local');
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  const content = google.content({
    version: 'v2.1',
    auth: oauth2Client,
  });

  // Fetch products from Sanity
  const products = await client.fetch(`*[_type == "product"] {
    _id,
    title,
    "slug": slug.current,
    descriptionShort,
    price,
    salePrice,
    stockStatus,
    "image": images[0]
  }`);

  if (!products || products.length === 0) {
    return { message: 'No products found to sync' };
  }

  const googleProducts = products.map((p: any) => {
    // Construct absolute image URL
    const imageUrl = p.image ? urlFor(p.image).url() : '';
    
    // Google Merchant availability values: 'in stock', 'out of stock', 'preorder', 'backorder'
    let availability = 'out of stock';
    if (p.stockStatus === 'inStock') availability = 'in stock';
    if (p.stockStatus === 'onBackorder') availability = 'backorder';

    return {
      offerId: p._id,
      title: p.title,
      description: p.descriptionShort || p.title,
      link: `${SITE_URL}/producto/${p.slug}`,
      imageLink: imageUrl,
      contentLanguage: 'es',
      targetCountry: 'CO',
      feedLabel: 'CO',
      channel: 'online',
      availability: availability,
      condition: 'new',
      googleProductCategory: 'Home & Garden > Linens & Bedding > Fabrics', // Generic taxonomy for fabrics
      brand: p.attributes?.find((a: any) => a.name?.toLowerCase() === 'marca' || a.name?.toLowerCase() === 'brand')?.value || 'Telas Real',
      price: {
        value: p.price.toString(),
        currency: 'COP',
      },
      ...(p.salePrice > 0 && {
        salePrice: {
          value: p.salePrice.toString(),
          currency: 'COP',
        },
      }),
    };
  }).filter((p: any) => p.imageLink && p.price); // Google requires an image and a price

  // Using custombatch for performance
  const entries = googleProducts.map((product: any, index: number) => ({
    batchId: index,
    merchantId: MERCHANT_ID,
    method: 'insert',
    product: product,
  }));

  try {
    const res = await content.products.custombatch({
      requestBody: {
        entries,
      },
    });

    const errors = res.data.entries?.filter((e: any) => e.errors);
    if (errors && errors.length > 0) {
      console.error('Some products failed to sync:', JSON.stringify(errors, null, 2));
    }

    return {
      total: googleProducts.length,
      success: (res.data.entries?.length || 0) - (errors?.length || 0),
      failed: errors?.length || 0,
      details: res.data
    };
  } catch (error: any) {
    console.error('Error syncing products to Google Merchant Center:', error.response?.data || error.message);
    throw error;
  }
}
