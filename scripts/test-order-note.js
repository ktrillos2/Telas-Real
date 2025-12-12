const https = require('https');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testOrderNote() {
    const url = process.env.WORDPRESS_API_URL;
    const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
    const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

    if (!url || !consumerKey || !consumerSecret) {
        console.error('Missing credentials');
        return;
    }

    const baseUrl = url.replace(/\/$/, '');
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    // 1. Create a dummy order first
    console.log('Creating order...');
    const orderRes = await fetch(`${baseUrl}/wp-json/wc/v3/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            payment_method: 'bacs',
            payment_method_title: 'Test Note',
            set_paid: false
        })
    });

    const order = await orderRes.json();
    console.log('Order created:', order.id);

    // 2. Add a note with Base64 Image
    // Small red dot base64
    const base64Img = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Red Dot" />';

    console.log('Adding note with image...');
    const noteRes = await fetch(`${baseUrl}/wp-json/wc/v3/orders/${order.id}/notes`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            note: `Here is the design: <br/> ${base64Img} <br/> <a href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" download="test.png">Download Link</a>`
        })
    });

    const note = await noteRes.json();
    console.log('Note created:', note);
    console.log('Note content:', note.note);
}

testOrderNote();
