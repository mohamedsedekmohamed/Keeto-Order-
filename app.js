// app.js — Plesk friendly Next.js starter
const { createServer } = require('http');
const next = require('next');

const port = process.env.PORT || 3000; 
const host = '0.0.0.0';
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, host, () => {
    console.log(`Next.js running at http://${host}:${port} (dev=${dev})`);
  });
});