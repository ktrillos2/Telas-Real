try {
    const image = require('next/image');
    console.log('Success:', image);
} catch (e) {
    console.error('Error resolving next/image:', e);
}
