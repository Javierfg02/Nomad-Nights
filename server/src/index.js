const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const routes = require('./routes');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api', routes);

// Serve frontend in production (optional, but good for self-hosting)
// If we build client to server/public or similar.
// For now, we will just run them separately as per plan.

app.get('/', (req, res) => {
  res.send('Nomad Nights API is running.');
});

const { onRequest } = require('firebase-functions/v2/https');

// ... (existing code)

// app.listen() is not needed for Cloud Functions
// exports.api matches the rewrite rule in firebase.json
exports.api = onRequest(app);
