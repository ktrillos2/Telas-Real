const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function initDb() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error('Missing Turso credentials');
        return;
    }

    const client = createClient({
        url,
        authToken
    });

    try {
        console.log('Creating table custom_designs...');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS custom_designs (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                mime_type TEXT NOT NULL,
                data BLOB NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table created successfully.');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        client.close();
    }
}

initDb();
