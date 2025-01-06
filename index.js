const express = require('express');
const app = express();
const path = require('path');
const backend = require(path.join(__dirname, 'backend', 'index.js'));

backend(app);