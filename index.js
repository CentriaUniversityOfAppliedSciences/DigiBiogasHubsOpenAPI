import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createConnection, closeConnection, query, createConnectionToSensorDataDB } from './pgconnector.js';
import { createSensorTable } from './createSensorTable.js';
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
    const result = await query(pool, 'SELECT * FROM "Openapis" WHERE value = $1', [apiKey]);
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid API key' });
    }
    req.openapiUser = result.rows[0];
    closeConnection(pool);
    next();
  } catch (err) {
    console.log('Error in API key middleware:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

await createSensorTable();

/*app.post('/test', (req, res) => {
  console.log('Received test request:', req.body);
  res.send('Hello from DigiBiogasHubsOpenAPI!');
});*/

/**
 * Endpoint to get count of offers
 * @params startDate (optional) - Start date for filtering offers
 * @params endDate (optional) - End date for filtering offers
 * @response {String} type - Type of response, always "result"
 * @response {String} response - Response status, either "ok" or "error"
 * @response {Object} data - Contains the count of offers in the format { count: <number> }
 * @response {String} error - Error message if any error occurs
 */

app.post('/statistics/offers', async (req, res) => {
  try {
    const pool = await createConnection();
    let queryText = 'SELECT COUNT(id) from "Offers" WHERE ';
    let queryParams = [];

    if (req.body.startDate && req.body.endDate) {
      queryText += '"startDate" < $1 AND "endDate" > $2';
      queryParams = [req.body.startDate, req.body.endDate];
    } else if (req.body.startDate) {
      queryText += '"startDate" < $1 AND "endDate" > now()';
      queryParams = [req.body.startDate];
    } else if (req.body.endDate) {
      queryText += '"startDate" < now() AND "endDate" > $1';
      queryParams = [req.body.endDate];
    } else {
      queryText += '"startDate" < now() AND "endDate" > now()';
    }

    const result = await query(pool, queryText, queryParams);
    closeConnection(pool);
    res.json({
      type: "result",
      response: "ok",
      data: result.rows[0]
    });

  }
  catch (err) {
    console.error('Error in /statistics/offers:', err);
    return res.status(500).json({ type: "result", response: "error", error: 'Internal server error' });
  }
});

/** Endpoint to store sensor data in db 
 * @params sensorId - ID of the sensor
 * @params sensorName - Name of the sensor
 * @params value - Value of the sensor data 
 * @params unit - Unit of the sensor data
 * @params timestamp - Timestamp of the sensor data
 * @response {String} type - Type of response, always "result"
 * @response {String} response - Response status, either "ok" or "error"
 * 
 * */
app.post('/sensors/data', async (req, res) => {
  const { sensorID, sensorName, value, unit, sensorReadingTimestamp } = req.body;

  if (!sensorID || !sensorName || value === undefined || !unit || !sensorReadingTimestamp) {
    return res.status(400).json({ type: "result", response: "error", error: 'Missing required fields' });
  }

  try {
    const pool = await createConnectionToSensorDataDB();
    const insertQuery = `
      INSERT INTO "SensorData" ("sensorID", "sensorName", "value", "unit", "sensorReadingTimestamp")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const queryParams = [sensorID, sensorName, value, unit, sensorReadingTimestamp];
    const result = await query(pool, insertQuery, queryParams);
    closeConnection(pool);

    res.json({
      type: "result",
      response: "ok",
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error in /sensors/data:', err);
    return res.status(500).json({ type: "result", response: "error", error: 'Internal server error' });
  }
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
