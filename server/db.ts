import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { log } from "./vite";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create a PostgreSQL pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  max: 10, // Maximum number of clients the pool should contain
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
});

// Create a Drizzle ORM instance with our schema
export const db = drizzle(pool, { schema });

// Helper function for logging queries
export function logQuery(query: string, params: any[] = []): void {
  // Obfuscate potential sensitive data in params for logging
  const safeParams = params.map(param => {
    if (typeof param === 'string' && param.length > 20) {
      return param.substring(0, 10) + '...' + param.substring(param.length - 10);
    }
    return param;
  });
  
  // Log the query
  log(`SQL Query: ${query} - Params: ${JSON.stringify(safeParams)}`, 'db');
}

// Listen for connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Perform initial connection test
pool.query('SELECT NOW()')
  .then(res => {
    log(`Database connected successfully. Server time: ${res.rows[0].now}`, 'db');
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(-1);
  });