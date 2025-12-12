const https = require('https');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testMetadata() {
    const url = process.env.WORDPRESS_API_URL;
    const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
    const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

    if (!url || !consumerKey || !consumerSecret) {
        console.error('Missing credentials');
        return;
    }

    const baseUrl = url.replace(/\/$/, '');
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    // Create a dummy order
    const orderData = {
        payment_method: 'bacs',
        payment_method_title: 'Direct Bank Transfer',
        set_paid: false,
        billing: {
            first_name: 'Test',
            last_name: 'Metadata',
            email: 'test@example.com'
        },
        line_items: [
            {
                product_id: 9345, // Use a valid product ID if possible, or try without
                quantity: 1
            }
        ],
        meta_data: [
            {
                key: 'Test HTTP Img',
                value: '<img src="https://via.placeholder.com/150" alt="HTTP Image" />'
            },
            {
                key: 'Test Data Img',
                value: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="Data Image" />'
            },
            {
                key: 'Test Data Link',
                value: '<a href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==">Download Data</a>'
            }
        ]
    };

    console.log('Creating test order...');

    try {
        const response = await fetch(`${baseUrl}/wp-json/wc/v3/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error creating order:', data);
            return;
        }

        console.log('Order created:', data.id);
        console.log('Inspecting metadata...');

        data.meta_data.forEach(meta => {
            if (meta.key.startsWith('Test')) {
                console.log(`Key: ${meta.key}`);
                console.log(`Value: ${meta.value}`);
                console.log('---');
            }
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

testMetadata();
