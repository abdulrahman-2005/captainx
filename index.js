const express = require('express');
const app = express();
const backend = require('./backend/index.js');

backend(app);