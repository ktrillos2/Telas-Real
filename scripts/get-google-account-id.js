const https = require('https');

// --- CONFIGURATION ---
// These are from your .env.local or previous steps
const CLIENT_ID = process.argv[2];
const CLIENT_SECRET = process.argv[3];
const REFRESH_TOKEN = process.argv[4];

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error('Usage: node scripts/get-google-account-id.js <CLIENT_ID> <CLIENT_SECRET> <REFRESH_TOKEN>');
    process.exit(1);
}

// 1. Get Access Token
function getAccessToken() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: 'refresh_token',
        });

        const options = {
            hostname: 'oauth2.googleapis.com',
            path: '/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                const response = JSON.parse(data);
                if (response.error) reject(response.error_description || response.error);
                else resolve(response.access_token);
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// 2. List Accounts
function listAccounts(accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'mybusinessaccountmanagement.googleapis.com',
            path: '/v1/accounts',
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                const response = JSON.parse(data);
                if (response.error) reject(response.error.message || response.error);
                else resolve(response);
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function main() {
    try {
        console.log('Getting Access Token...');
        const accessToken = await getAccessToken();
        console.log('Access Token obtained.');

        console.log('Fetching Accounts...');
        const accountsData = await listAccounts(accessToken);

        console.log('\n--- ACCOUNTS FOUND ---');
        if (accountsData.accounts && accountsData.accounts.length > 0) {
            accountsData.accounts.forEach(account => {
                console.log(`Name: ${account.accountName}`);
                console.log(`ID (use this for GOOGLE_ACCOUNT_ID): ${account.name.split('/')[1]}`); // accounts/12345 -> 12345
                console.log(`Type: ${account.type}`);
                console.log('-------------------------');
            });
        } else {
            console.log('No accounts found.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
