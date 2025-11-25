"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.getClient = getClient;
exports.checkConnection = checkConnection;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    }
    catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}
async function getClient() {
    return pool.connect();
}
async function checkConnection() {
    try {
        const result = await query('SELECT NOW()');
        console.log('✓ Database connected:', result.rows[0]);
        return true;
    }
    catch (error) {
        console.error('✗ Database connection failed:', error);
        return false;
    }
}
//# sourceMappingURL=db.js.map