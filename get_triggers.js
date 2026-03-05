import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const dbUrl = process.env.VITE_SUPABASE_DB_URL || "postgresql://postgres:postgres@localhost:5432/postgres"; // Trying to find the real one if it exists, but let's check .env

async function check() {
  console.log("DB URL from env:", process.env.VITE_SUPABASE_DB_URL ? "Exists" : "Missing");
}
check();
