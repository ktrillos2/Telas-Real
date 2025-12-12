const http = require('http');
const url = require('url');
const { exec } = require('child_process');
const https = require('https');

// --- CONFIGURATION ---
// Replace these with your actual Client ID and Secret or pass them as arguments
const CLIENT_ID = process.argv[2] || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.argv[3] || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/api/auth/google/callback';
const SCOPE = 'https://www.googleapis.com/auth/business.manage';

if (CLIENT_ID === 'YOUR_CLIENT_ID' || CLIENT_SECRET === 'YOUR_CLIENT_SECRET') {
    console.error('Error: Please provide CLIENT_ID and CLIENT_SECRET as arguments.');
    console.log('Usage: node scripts/get-google-refresh-token.js <CLIENT_ID> <CLIENT_SECRET>');
    process.exit(1);
}

// --- OAUTH FLOW ---

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/api/auth/google/callback') {
        const code = parsedUrl.query.code;

        if (code) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Authorization Successful!</h1><p>You can close this window and check your terminal.</p>');

            console.log('\n[SUCCESS] Authorization code received!');
            console.log('Exchanging code for tokens...');

            await exchangeCodeForToken(code);

            server.close(() => {
                console.log('Server closed.');
                process.exit(0);
            });
        } else {
            res.writeHead(400);
            res.end('No code found.');
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(3000, () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&access_type=offline&prompt=consent`;

    console.log('\n--- GOOGLE OAUTH 2.0 TOKEN GENERATOR ---');
    console.log(`1. Server listening at ${REDIRECT_URI}`);
    console.log('2. Opening browser to authorize...');

    // Open browser
    const startCommand = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    exec(`${startCommand} "${authUrl}"`);

    console.log(`\nIf browser does not open, visit this URL manually:\n${authUrl}\n`);
    console.log('Waiting for callback...');
});

function exchangeCodeForToken(code) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            code: code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
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

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.error) {
                        console.error('\n[ERROR] Token exchange failed:', response.error_description || response.error);
                    } else {
                        console.log('\n[SUCCESS] Tokens received!');
                        console.log('\n--- SAVE THESE TO YOUR .env.local FILE ---');
                        console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
                        console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
                        console.log(`GOOGLE_REFRESH_TOKEN=${response.refresh_token}`);
                        console.log('------------------------------------------\n');
                    }
                    resolve();
                } catch (e) {
                    console.error('Error parsing response:', e);
                    resolve();
                }
            });
        });

        req.on('error', (e) => {
            console.error('Request error:', e);
            resolve();
        });

        req.write(postData);
        req.end();
    });
}
