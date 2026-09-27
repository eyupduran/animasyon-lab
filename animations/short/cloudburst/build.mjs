import fs from 'fs';
fs.mkdirSync('dist', { recursive: true });
fs.copyFileSync('index.html', 'dist/index.html');
if (fs.existsSync('poster.jpg')) fs.copyFileSync('poster.jpg', 'dist/poster.jpg');
console.log('dist/index.html');
