// Simple HTTP server for local development
// Run with: node server.js
// Then open http://localhost:3030/evaluator.html

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3030;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.csv': 'text/csv',
    '.yaml': 'text/yaml',
    '.yml': 'text/yaml',
    '.md': 'text/markdown'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Use absolute path based on server.js location
    const serverDir = __dirname;
    let filePath = path.join(serverDir, req.url);
    
    // Handle root path
    if (req.url === '/' || req.url === '') {
        filePath = path.join(serverDir, 'evaluator.html');
    }
    
    // Handle list-evaluator route
    if (req.url === '/list-evaluator' || req.url === '/list-evaluator/') {
        filePath = path.join(serverDir, 'list-evaluator.html');
    }
    
    console.log(`Serving file: ${filePath}`);

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Open http://localhost:${PORT}/evaluator.html in your browser`);
});
