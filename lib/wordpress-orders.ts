import { NextResponse } from 'next/server'

interface OrderItem {
  product_id?: number
  quantity: number
  total: string
  name?: string
  meta_data?: { key: string; value: string }[]
}

interface OrderData {
  payment_method: string
  payment_method_title: string
  set_paid: boolean
  created_via?: string
  customer_id?: number
  billing: {
    first_name: string
    last_name: string
    address_1: string
    city: string
    state: string
    postcode: string
    country: string
    email: string
    phone: string
  }
  shipping: {
    first_name: string
    last_name: string
    address_1: string
    city: string
    state: string
    postcode: string
    country: string
  }
  line_items: OrderItem[]
  meta_data?: { key: string; value: string }[]
}

export async function createWordPressOrder(orderData: OrderData) {
  const url = process.env.WORDPRESS_API_URL
  const consumerKey = process.env.WORDPRESS_CONSUMER_KEY
  const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET

  if (!url || !consumerKey || !consumerSecret) {
    console.error('Missing WordPress credentials')
    throw new Error('Configuration error: Missing WordPress credentials')
  }

  // Remove trailing slash if present and append orders endpoint
  const baseUrl = url.replace(/\/$/, '')
  const endpoint = `${baseUrl}/wp-json/wc/v3/orders`

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

  console.log('Sending Order to WordPress:', JSON.stringify(orderData, null, 2))

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { message: errorText }
      }
      console.error('WordPress Order Creation Failed:', { status: response.status, statusText: response.statusText, body: errorData })
      throw new Error(`WordPress API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating WordPress order:', error)
    throw error
  }
}

export async function getOrCreateCustomer(customerData: any) {
  const url = process.env.WORDPRESS_API_URL
  const consumerKey = process.env.WORDPRESS_CONSUMER_KEY
  const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET

  if (!url || !consumerKey || !consumerSecret) {
    throw new Error('Configuration error: Missing WordPress credentials')
  }

  const baseUrl = url.replace(/\/$/, '')
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${auth}`,
  }

  try {
    // 1. Search for existing customer by email
    const searchUrl = `${baseUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(customerData.email)}`
    const searchResponse = await fetch(searchUrl, { headers })

    if (searchResponse.ok) {
      const customers = await searchResponse.json()
      if (customers.length > 0) {
        console.log('Found existing customer:', customers[0].id)
        return customers[0].id
      }
    }

    // 2. Create new customer if not found
    console.log('Creating new customer...')
    const createUrl = `${baseUrl}/wp-json/wc/v3/customers`
    const newCustomerData = {
      email: customerData.email,
      first_name: customerData.firstName,
      last_name: customerData.lastName,
      username: customerData.email, // Use email as username
      billing: {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        address_1: customerData.address,
        city: customerData.city,
        state: customerData.region,
        postcode: customerData.zipCode || '00000',
        country: 'CO',
        email: customerData.email,
        phone: customerData.phone
      },
      shipping: {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        address_1: customerData.address,
        city: customerData.city,
        state: customerData.region,
        postcode: customerData.zipCode || '00000',
        country: 'CO',
      }
    }

    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(newCustomerData)
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      console.error('Failed to create customer:', error)
      // If creation fails (e.g. username exists), try to return 0 (guest) or handle gracefully
      return 0
    }

    const newCustomer = await createResponse.json()
    console.log('Created new customer:', newCustomer.id)
    return newCustomer.id

  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error)
    return 0 // Fallback to guest
  }
}

export async function uploadImageToWordPress(localPath: string, filename: string) {
  const url = process.env.WORDPRESS_API_URL
  const consumerKey = process.env.WORDPRESS_CONSUMER_KEY
  const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET

  if (!url || !consumerKey || !consumerSecret) {
    throw new Error('Configuration error: Missing WordPress credentials')
  }

  const baseUrl = url.replace(/\/$/, '')
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

  try {
    const fs = require('fs/promises')
    const path = require('path')

    // Ensure localPath doesn't start with / for path.join
    const cleanLocalPath = localPath.startsWith('/') ? localPath.slice(1) : localPath
    const fullPath = path.join(process.cwd(), 'public', cleanLocalPath)

    console.log('Reading file from:', fullPath)

    try {
      await fs.access(fullPath)
    } catch (e) {
      console.error('File not found at path:', fullPath)
      return null
    }

    const fileBuffer = await fs.readFile(fullPath)

    // Detect mime type
    const ext = path.extname(filename).toLowerCase()
    let mimeType = 'image/jpeg'
    if (ext === '.png') mimeType = 'image/png'
    if (ext === '.webp') mimeType = 'image/webp'
    if (ext === '.gif') mimeType = 'image/gif'

    const mediaUrl = `${baseUrl}/wp-json/wp/v2/media`

    const response = await fetch(mediaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': mimeType
      },
      body: fileBuffer
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to upload media to WordPress:', errorText)
      return null
    }

    const data = await response.json()
    console.log('Upload successful, URL:', data.source_url)
    return data.source_url // The public URL of the uploaded image in WordPress

  } catch (error) {
    console.error('Error uploading image to WordPress:', error)
    return null
  }
}

export async function getOrdersByCustomerEmail(email: string) {
  const url = process.env.WORDPRESS_API_URL;
  const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
  const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

  if (!url || !consumerKey || !consumerSecret) {
    throw new Error("Missing WordPress credentials");
  }

  const baseUrl = url.replace(/\/$/, "");
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    // First, get the customer to find their ID
    const customer = await getCustomerByEmail(email);

    if (!customer) {
      console.log("Customer not found for email:", email);
      return [];
    }

    // Fetch orders by customer ID
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/orders?customer=${customer.id}&per_page=100&orderby=date&order=desc`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      console.error(`Failed to fetch orders: ${response.statusText}`);
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const orders = await response.json();
    console.log(`Found ${orders.length} orders for customer ${customer.id}`);
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function getCustomerByEmail(email: string) {
  const url = process.env.WORDPRESS_API_URL;
  const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
  const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

  if (!url || !consumerKey || !consumerSecret) {
    throw new Error("Missing WordPress credentials");
  }

  const baseUrl = url.replace(/\/$/, "");
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/customers?email=${email}&role=all`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) return null;

    const customers = await response.json();
    return customers.length > 0 ? customers[0] : null;
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

export async function createCustomer(data: { email: string; first_name?: string; last_name?: string; password?: string }) {
  const url = process.env.WORDPRESS_API_URL;
  const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
  const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

  if (!url || !consumerKey || !consumerSecret) {
    throw new Error("Missing WordPress credentials");
  }

  const baseUrl = url.replace(/\/$/, "");
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        email: data.email,
        username: data.email, // Use email as username
        password: data.password,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create customer');
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
}
