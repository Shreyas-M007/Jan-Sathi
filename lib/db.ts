import mysql from "mysql2/promise";

const connectionUri = process.env.DATABASE_URL;

const pool = connectionUri
  ? mysql.createPool({
      uri: connectionUri,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: process.env.MYSQL_SSL === "false" ? undefined : { rejectUnauthorized: false }
    })
  : mysql.createPool({
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || "jansathi_user",
      password: process.env.MYSQL_PASSWORD || "JanSathi@2026",
      database: process.env.MYSQL_DATABASE || "jansathi_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined
    });

export default pool;
