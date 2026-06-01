require('dotenv').config({ path: '.env.local' });
const { createClient } = require('next-sanity');
const { Resend } = require('resend');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
    console.log("Checking user...");
    const user = await client.fetch(`*[_type == "user" && email == "keteruse@gmail.com"][0]`);
    console.log("User exists:", !!user);

    if (user) {
        console.log("Attempting to send email via Resend...");
        try {
            const data = await resend.emails.send({
                from: 'Telas Real <soporte@telasreal.com>',
                to: 'keteruse@gmail.com',
                subject: 'Test Email',
                html: '<p>Test</p>'
            });
            console.log("Resend response:", data);
        } catch (err) {
            console.error("Resend error:", err);
        }
    }
}
test();
