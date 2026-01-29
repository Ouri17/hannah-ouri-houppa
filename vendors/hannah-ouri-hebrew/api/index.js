require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const notionRoutes = require('./routes/notion');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/notion', notionRoutes);

app.get('/api/health', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route non trouvée' });
});

app.use(errorHandler);

module.exports = app;
