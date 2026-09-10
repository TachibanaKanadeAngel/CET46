const fs = require('fs');
const path = require('path');
const https = require('https');

const version = 'v42.9.2';
const filename = `electron-${version}-win32-x64.zip`;
const targetDir = path.resolve(__dirname, '../electron-cache');
const targetFile = path.join(targetDir, filename);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const url = `https://cdn.npmmirror.com/binaries/electron/${version}/${filename}`;
console.log('Downloading from fast CDN:', url);

function download(downloadUrl) {
  https.get(downloadUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirecting to', res.headers.location);
      return download(res.headers.location);
    }
    if (res.statusCode !== 200) {
      console.error('Failed with status:', res.statusCode);
      process.exit(1);
    }
    const total = parseInt(res.headers['content-length'] || '0', 10);
    let received = 0;
    const file = fs.createWriteStream(targetFile);
    res.on('data', chunk => {
      received += chunk.length;
      if (total) {
        process.stdout.write(`\rProgress: ${((received / total) * 100).toFixed(1)}% (${(received / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`);
      }
    });
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('\nDownload complete:', targetFile);
    });
  }).on('error', err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

download(url);
