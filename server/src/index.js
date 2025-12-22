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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test with: curl -X POST http://localhost:${PORT}/api/log -H "Authorization: Bearer ${process.env.API_KEY || 'YOUR_KEY'}" -H "Content-Type: application/json" -d '{"date":"2025-12-22", "country_code":"US"}'`);
});
