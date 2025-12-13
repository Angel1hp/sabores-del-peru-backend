// db/connection.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://dbrestaurante_2uxd_user:nL6HKXDr9GVrmCx7hWeCzwueSDA36LFR@dpg-d3umabv5r7bs73fl227g-a.oregon-postgres.render.com:5432/dbrestaurante_2uxd",
  ssl: {
    rejectUnauthorized: false,
  },
});

// Probar conexión
pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL en Render"))
  .catch((err) => console.error("❌ Error de conexión a PostgreSQL:", err));

export default pool;