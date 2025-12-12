// Mock the server action context
// const { verifyAndCreateOrder } = require('../app/actions/create-order');

// Mock dependencies
// We need to mock fetch for Wompi and WordPress
// But verifyAndCreateOrder imports from @/lib/wordpress-orders which uses process.env
// We need to run this with ts-node or similar, or just mock the whole thing?
// It's a server action file, likely has "use server" which might break in node script.
// Better to create a script that IMPORTS the logic or copies it.
// Since I can't easily run the Next.js server action in a standalone script without Next.js context...
// I will create a simplified version of the logic in the script to test the file reading and base64 part.

const fs = require('fs');
const path = require('path');

async function testBase64Logic() {
    // Simulate the logic in create-order.ts
    const designUrl = '/uploads/custom/test-image.png'; // Make sure this file exists

    // Create a dummy file first
    const dummyPath = path.join(process.cwd(), 'public', 'uploads', 'custom', 'test-image.png');
    fs.mkdirSync(path.dirname(dummyPath), { recursive: true });
    fs.writeFileSync(dummyPath, 'fake image content');

    console.log('Testing Base64 logic for:', designUrl);

    try {
        const cleanPath = designUrl.startsWith('/') ? designUrl.slice(1) : designUrl;
        const fullPath = path.join(process.cwd(), 'public', cleanPath);

        console.log('Reading from:', fullPath);

        if (!fs.existsSync(fullPath)) {
            console.error('File does not exist!');
            return;
        }

        const fileBuffer = fs.readFileSync(fullPath);
        const base64 = fileBuffer.toString('base64');
        const ext = path.extname(cleanPath).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';

        const finalDesignUrl = `data:${mimeType};base64,${base64}`;
        console.log('Base64 generated successfully.');
        console.log('Length:', finalDesignUrl.length);
        console.log('Preview:', finalDesignUrl.substring(0, 50) + '...');

        // Test HTML generation
        const html = `<img src="${finalDesignUrl}" style="max-width: 200px;" />`;
        console.log('HTML:', html.substring(0, 50) + '...');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        // Cleanup
        if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    }
}

testBase64Logic();
