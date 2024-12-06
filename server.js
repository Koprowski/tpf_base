const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// CORS headers for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files with debug logging
app.use('/', express.static(__dirname, {
    setHeaders: (res, filepath) => {
        console.log(`Serving static file: ${filepath}`);
        if (filepath.endsWith('.js')) {
            res.set('Content-Type', 'text/javascript');
        }
    }
}));

// File existence check middleware
app.use((req, res, next) => {
    const filePath = path.join(__dirname, req.url);
    if (fs.existsSync(filePath)) {
        console.log(`File exists: ${filePath}`);
    } else {
        console.warn(`File not found: ${filePath}`);
    }
    next();
});

// Serve the test.html file
app.get('/test', (req, res) => {
    const testPath = path.join(__dirname, 'test.html');
    console.log(`Serving test.html from: ${testPath}`);
    if (fs.existsSync(testPath)) {
        res.sendFile(testPath);
    } else {
        res.status(404).send('test.html not found');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`
========================================
Debug Test Server Running
----------------------------------------
URL: http://localhost:${PORT}/test
Root Directory: ${__dirname}
----------------------------------------
Checking critical files...
`);
    
    // Check existence of critical files
    const filesToCheck = [
        'test.html',
        'src/public/js/bundle.js',
        'src/public/js/test.js',
        'src/public/js/util.log.js',
        'src/public/js/createTickMarks.js',
        'src/public/css/grid.css'
    ];
    
    filesToCheck.forEach(file => {
        const filePath = path.join(__dirname, file);
        console.log(`${file}: ${fs.existsSync(filePath) ? 'EXISTS ✓' : 'MISSING ✗'}`);
    });
    
    console.log('========================================');
});