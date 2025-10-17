import { createConnectionToSensorDataDB } from './pgconnector.js';

export async function createSensorTable() {
    try {
        const client = await createConnectionToSensorDataDB();
        const createQuery = `CREATE TABLE IF NOT EXISTS "SensorData" (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         "sensorID" VARCHAR(255) NOT NULL,
         "sensorName" VARCHAR(255) NOT NULL,
         "value" DOUBLE PRECISION NOT NULL,
         "unit" VARCHAR(50) NOT NULL,
         "sensorReadingTimestamp" TIMESTAMP NOT NULL,
         "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        `;
        await client.query(createQuery);
        await client.end();
        console.log(' Table "SensorData" is ready');
    } catch (err) {
        console.error('Error creating SensorData table:', err);
    }
}
