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
      host: process.env.MYSQL_HOST || "gateway01.ap-northeast-1.prod.aws.tidbcloud.com",
      port: Number(process.env.MYSQL_PORT) || 4000,
      user: process.env.MYSQL_USER || "22WDVsM2qcj1xCg.root",
      password: process.env.MYSQL_PASSWORD || "6zg2DlkkYdpTYVqo",
      database: process.env.MYSQL_DATABASE || "jansathi_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: { rejectUnauthorized: false }
    });

export default pool;
