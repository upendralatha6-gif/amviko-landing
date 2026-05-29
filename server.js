const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.mp4':  'video/mp4',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  fs.stat(filePath, (err, stat) => {
    if (err) {
      filePath = path.join(__dirname, 'index.html');
      fs.stat(filePath, (e2, s2) => {
        if (e2) { res.writeHead(404); res.end('Not found'); return; }
        sendFile(req, res, filePath, s2);
      });
      return;
    }
    sendFile(req, res, filePath, stat);
  });
}).listen(PORT, () => console.log(`Running on port ${PORT}`));

function sendFile(req, res, filePath, stat) {
  const ext  = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  const size = stat.size;
  const range = req.headers.range;

  // Range requests — required for video seeking in browsers
  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end   = endStr ? parseInt(endStr, 10) : size - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${size}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': chunkSize,
      'Content-Type':   mime,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Length': size,
    'Content-Type':   mime,
    'Accept-Ranges':  'bytes',
  });
  fs.createReadStream(filePath).pipe(res);
}
