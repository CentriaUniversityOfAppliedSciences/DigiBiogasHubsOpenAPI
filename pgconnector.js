import pg from 'pg';
//import {compare as comparePass} from './cryptic.js';

export const pgconnector = () => {
    return "";
}
export default pgconnector;

export async function createConnection() {
    const client = new pg.Pool({
        user: process.env.POSTGRES_USER,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD
    });
    return client;
};

export async function createConnectionToSensorDataDB() {
    const client = new pg.Pool({
        user: process.env.POSTGRES_USER,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        database: process.env.SENSOR_DB,
        password: process.env.POSTGRES_PASSWORD
    });
    return client;
};

export async function closeConnection(client) {
    return await client.end();
};

export async function insertTable(client, query, values) {
    var ans = await client.query(query, values)
        .then(res => {
            return res;
        })
        .catch(e => console.log(e.stack));
    return ans;
};

export async function checkExists(client, table) {
    var ans = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2)", ["public", table]).then(res => { return res; }).catch(e => { console.log(e); return null; });
    return ans;
}
export async function query(client, text, params) {
    try {
        const res = client.query(text, params);
        return res;
    }
    catch (ex) {
        console.log(ex);
        return null;
    }
};
