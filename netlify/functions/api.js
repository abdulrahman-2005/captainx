const express = require('express');
const serverless = require('serverless-http');
const app = express();
const db = require('../../backend/db');

// Initialize your database
const database = new db(process.env.MONGODB_URI);

// Add your routes
app.get('/api/admin/check-access', async (req, res) => {
    // Your existing code
});

// Export handler
exports.handler = serverless(app); 