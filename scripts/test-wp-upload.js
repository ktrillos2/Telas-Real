const fs = require('fs');
const path = require('path');
const https = require('https');

// Load env vars manually since we are running a script
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testUpload() {
    const url = process.env.WORDPRESS_API_URL;
    const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
    const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

    if (!url || !consumerKey || !consumerSecret) {
        console.error('Missing credentials in .env.local');
        return;
    }

    const baseUrl = url.replace(/\/$/, '');
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    // Create a dummy file
    const dummyPath = path.join(process.cwd(), 'public', 'test-upload.txt');
    fs.writeFileSync(dummyPath, 'This is a test file for WP upload.');

    console.log('Uploading file:', dummyPath);

    const mediaUrl = `${baseUrl}/wp-json/wp/v2/media`;
    const filename = 'test-upload.txt';
    const fileBuffer = fs.readFileSync(dummyPath);

    // Node 18+ has native FormData

    try {
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'text/plain' });
        formData.append('file', blob, filename);

        const response = await fetch(mediaUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                // Content-Type is set automatically with boundary
            },
            body: formData
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Upload failed:', response.status, response.statusText);
            console.error('Response body:', text);
        } else {
            const data = await response.json();
            console.log('Upload success!');
            console.log('Source URL:', data.source_url);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Cleanup
        if (fs.existsSync(dummyPath)) {
            fs.unlinkSync(dummyPath);
        }
    }
}

testUpload();
