const https = require('https');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testLargeNote() {
    const url = process.env.WORDPRESS_API_URL;
    const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
    const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;
    const orderId = 2000100529356; // The correct internal ID for #23161

    if (!url || !consumerKey || !consumerSecret) {
        console.error('Missing credentials');
        return;
    }

    const baseUrl = url.replace(/\/$/, '');
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    // Generate a large base64 string (approx 500KB)
    const largeBuffer = Buffer.alloc(350 * 1024, 'a'); // 350KB buffer -> ~466KB Base64
    const base64 = largeBuffer.toString('base64');
    const imgTag = `<img src="data:image/png;base64,${base64}" alt="Large Image" />`;

    console.log('Attempting to add large note to order', orderId);
    console.log('Payload size approx:', base64.length, 'bytes');

    try {
        const response = await fetch(`${baseUrl}/wp-json/wc/v3/orders/${orderId}/notes`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                note: `Large Image Test: <br/> ${imgTag}`,
                customer_note: false
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Failed to add note:', response.status, response.statusText);
            console.error('Response:', text);
        } else {
            const data = await response.json();
            console.log('Note added successfully:', data.id);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testLargeNote();
