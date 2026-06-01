
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { client } from './sanity/lib/client';

async function check() {
    const data = await client.fetch('*[_type == "tone"][0...5]');
    console.log(JSON.stringify(data, null, 2));
}

check();
