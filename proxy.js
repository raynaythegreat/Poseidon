const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request:', req.method, req.url, req.headers.host);
  const options = {
    hostname: 'localhost',
    port: 11434,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:11434' }
  };
  const proxyReq = http.request(options, (proxyRes) => {
    console.log('Response:', proxyRes.statusCode);
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  req.pipe(proxyReq);
});

server.listen(11435, () => console.log('Proxy listening on 11435'));