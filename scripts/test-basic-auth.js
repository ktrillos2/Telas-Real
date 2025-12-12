const https = require('https');

const username = 'pruebas1';
const password = '12345@JEP*.1TUP4G1N4*';
const url = 'https://telasreal.com/wp-json/wp/v2/users/me';

const auth = Buffer.from(`${username}:${password}`).toString('base64');

console.log('Testing Basic Auth against:', url);
console.log('Auth Header:', `Basic ${auth}`);

fetch(url, {
    method: 'GET',
    headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
    }
})
    .then(async res => {
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    })
    .catch(err => console.error('Error:', err));
