import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createConnection, closeConnection, query } from './pgconnector.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json());

// Enable CORS
app.use(cors());
// Enable HTTP request logging
app.use(morgan('combined'));

// Middleware to check API key
app.use(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  try {
    const pool = await createConnection();
    const result = await query(pool,'SELECT * FROM openapis WHERE value = $1', [apiKey]);
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid API key' });
    }
    req.openapiUser = result.rows[0];
    closeConnection(pool);
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
});

app.post('/test', (req, res) => {
  console.log('Received test request:', req.body);
  res.send('Hello from DigiBiogasHubsOpenAPI!');
});



//these must be at the bottom but before listen !!!!

app.use((req, res) => {
  res.status(404).send("Sorry can't find that!")
})

/*
* if error is thrown, logs the error and returns custom 500
*/

// custom error handler
app.use((err, req, res, next) => {
  
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
