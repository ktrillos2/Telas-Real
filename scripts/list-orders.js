const https = require('https');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function listOrders() {
    const url = process.env.WORDPRESS_API_URL;
    const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
    const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

    if (!url || !consumerKey || !consumerSecret) {
        console.error('Missing credentials');
        return;
    }

    const baseUrl = url.replace(/\/$/, '');
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    console.log('Listing recent orders...');
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/orders?per_page=5`, {
        headers: {
            'Authorization': `Basic ${auth}`
        }
    });

    if (!response.ok) {
        console.error('Error:', response.status);
        return;
    }

    const orders = await response.json();
    orders.forEach(order => {
        console.log(`ID: ${order.id}, Number: ${order.number}, Status: ${order.status}, Date: ${order.date_created}`);
    });
}

listOrders();
