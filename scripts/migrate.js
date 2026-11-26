const mysql = require('mysql2/promise');

async function main() {
  const config = process.env.DATABASE_URL
    ? { uri: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.MYSQL_HOST || '127.0.0.1',
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || 'jansathi_user',
        password: process.env.MYSQL_PASSWORD || 'JanSathi@2026',
        database: process.env.MYSQL_DATABASE || 'jansathi_db',
        ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
      };

  const connection = await mysql.createConnection(config);

  console.log('Connected to MySQL successfully!');

  // Create Users Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('Citizen', 'Admin') NOT NULL DEFAULT 'Citizen',
      department VARCHAR(128) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create Issues Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS issues (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      image_url VARCHAR(500) NULL,
      location_label VARCHAR(255) NOT NULL,
      latitude DECIMAL(10, 7) NULL,
      longitude DECIMAL(10, 7) NULL,
      category VARCHAR(128) NOT NULL,
      severity INT NOT NULL DEFAULT 5,
      department VARCHAR(128) NOT NULL,
      status ENUM('Pending', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Pending',
      timeline_stage ENUM('Submitted', 'Reviewed', 'Assigned to Contractor', 'Resolved') NOT NULL DEFAULT 'Submitted',
      upvotes INT NOT NULL DEFAULT 1,
      reporter_id VARCHAR(64) NOT NULL,
      reporter_name VARCHAR(128) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create Upvotes Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS issue_upvotes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      issue_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_issue (user_id, issue_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const [existing] = await connection.query("SELECT COUNT(*) as count FROM issues");
  const count = existing[0]?.count || 0;
  console.log('Current issues in MySQL:', count);

  if (count === 0) {
    const realReports = [
      {
        id: "blr-issue-01",
        title: "Severe Asphalt Crater & Sub-surface Cavity",
        description: "Deep crater on outer bus lane near EcoWorld flyover ramp causing two-wheeler rollovers and severe vehicular congestion.",
        image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
        location_label: "Outer Ring Road, Bellandur, Bengaluru",
        latitude: 12.9260,
        longitude: 77.6762,
        category: "Deep Pothole",
        severity: 9,
        department: "Road Maintenance",
        status: "Pending",
        timeline_stage: "Reviewed",
        upvotes: 42,
        reporter_id: "citizen-blr-42",
        reporter_name: "Vikram Hegde",
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: "blr-issue-02",
        title: "Snapped Secondary Live Power Cable on Sidewalk",
        description: "Storm damaged electrical line snapped and dangling 4 feet above pedestrian sidewalk near Metro Pillar 42. Immediate electrocution risk.",
        image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80",
        location_label: "100ft Road, Indiranagar, Bengaluru",
        latitude: 12.9784,
        longitude: 77.6408,
        category: "Electrical Hazard",
        severity: 10,
        department: "Electrical Department",
        status: "Pending",
        timeline_stage: "Submitted",
        upvotes: 68,
        reporter_id: "citizen-blr-18",
        reporter_name: "Sneha Reddy",
        created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: "blr-issue-03",
        title: "Unpaved Deep Mud Slush & Cratered Underpass",
        description: "Waterlogged cratered road under the railway bridge completely impassable for auto-rickshaws and school vans. Water stagnation depth exceeds 1.5ft.",
        image_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
        location_label: "Panathur Railway Underpass, Balagere Road, Bengaluru",
        latitude: 12.9427,
        longitude: 77.7088,
        category: "Road & Footpath Damage",
        severity: 9,
        department: "Public Works",
        status: "In Progress",
        timeline_stage: "Assigned to Contractor",
        upvotes: 53,
        reporter_id: "citizen-blr-88",
        reporter_name: "Anand Murthy",
        created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: "blr-issue-04",
        title: "Damaged Expansion Joint & Asphalt Gutter",
        description: "Metal expansion teeth exposed on bridge descent with missing asphalt surrounding joint. Poses puncture and steering loss risk at 50km/h.",
        image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80",
        location_label: "Central Silk Board Junction, Hosur Road, Bengaluru",
        latitude: 12.9176,
        longitude: 77.6238,
        category: "Road Maintenance",
        severity: 8,
        department: "Road Maintenance",
        status: "In Progress",
        timeline_stage: "Assigned to Contractor",
        upvotes: 37,
        reporter_id: "citizen-blr-22",
        reporter_name: "Farhan Khan",
        created_at: new Date(Date.now() - 1000 * 60 * 320).toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: "blr-issue-05",
        title: "Major Potable Water Pipeline Rupture",
        description: "High-pressure BWSSB cast-iron water distribution main cracked, eroding road foundation and flooding basement shops. Massive clean water loss.",
        image_url: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
        location_label: "15th Cross, Margosa Road, Malleshwaram, Bengaluru",
        latitude: 13.0031,
        longitude: 77.5693,
        category: "Water Leakage",
        severity: 8,
        department: "Water Board",
        status: "Pending",
        timeline_stage: "Reviewed",
        upvotes: 29,
        reporter_id: "citizen-blr-35",
        reporter_name: "Lakshmi Narayanan",
        created_at: new Date(Date.now() - 1000 * 60 * 450).toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: "blr-issue-06",
        title: "Open Stormwater Drain Overflow onto Residential Lane",
        description: "Primary storm drain choked with debris during pre-monsoon flow, spilling gray water across pedestrian walkway and ground floor driveways.",
        image_url: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=800&q=80",
        location_label: "19th Main Road, Sector 2, HSR Layout, Bengaluru",
        latitude: 12.9116,
        longitude: 77.6534,
        category: "Sanitation & Waste",
        severity: 7,
        department: "Sanitation",
        status: "Pending",
        timeline_stage: "Submitted",
        upvotes: 21,
        reporter_id: "citizen-blr-91",
        reporter_name: "Kavita Rao",
        created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: "blr-issue-07",
        title: "Shattered Cast-Iron Manhole Cover",
        description: "Heavy truck dislodged and fractured circular stormwater manhole lid. Open 4-foot drop directly in left turning traffic lane.",
        image_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80",
        location_label: "ITPL Main Road, Pattandur Agrahara, Whitefield, Bengaluru",
        latitude: 12.9868,
        longitude: 77.7382,
        category: "Deep Pothole",
        severity: 9,
        department: "Public Works",
        status: "In Progress",
        timeline_stage: "Assigned to Contractor",
        upvotes: 45,
        reporter_id: "citizen-blr-64",
        reporter_name: "Rohit Shenoy",
        created_at: new Date(Date.now() - 1000 * 60 * 750).toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: "blr-issue-08",
        title: "Commercial Strip Garbage Dump Blocking Fire Access",
        description: "Unsegregated commercial packaging and wet waste piled 5 feet high outside commercial complex, attracting stray packs and obstructing hydrant access.",
        image_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
        location_label: "80 Feet Road, 5th Block, Koramangala, Bengaluru",
        latitude: 12.9352,
        longitude: 77.6245,
        category: "Garbage Overflow",
        severity: 6,
        department: "Sanitation",
        status: "Resolved",
        timeline_stage: "Resolved",
        upvotes: 31,
        reporter_id: "citizen-blr-12",
        reporter_name: "Manish Kumar",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: "blr-issue-09",
        title: "Cluster of Non-Functional Streetlights at Blind Turn",
        description: "Series of 5 consecutive sodium streetlights dead along the park boundary, creating severe pedestrian safety risk after 8:00 PM.",
        image_url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
        location_label: "11th Main, 4th Block, Jayanagar, Bengaluru",
        latitude: 12.9299,
        longitude: 77.5833,
        category: "Broken Streetlight",
        severity: 5,
        department: "Electrical Department",
        status: "Resolved",
        timeline_stage: "Resolved",
        upvotes: 18,
        reporter_id: "citizen-blr-50",
        reporter_name: "Deepa Swamy",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString().slice(0, 19).replace('T', ' ')
      },
      {
        id: "blr-issue-10",
        title: "Footpath Slab Collapse with Exposed Rebar",
        description: "Pedestrian footpath slab caved into stormwater conduit beneath. Rusted iron reinforcement bars protruding upwards into walking path.",
        image_url: "https://images.unsplash.com/photo-1584463699047-97d8e6c70305?auto=format&fit=crop&w=800&q=80",
        location_label: "Tin Factory Junction, Old Madras Road, KR Puram, Bengaluru",
        latitude: 12.9972,
        longitude: 77.6698,
        category: "Road & Footpath Damage",
        severity: 8,
        department: "Public Works",
        status: "Pending",
        timeline_stage: "Reviewed",
        upvotes: 34,
        reporter_id: "citizen-blr-77",
        reporter_name: "Siddharth Pai",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString().slice(0, 19).replace('T', ' ')
      }
    ];

    for (const item of realReports) {
      await connection.query(
        `INSERT INTO issues (
          id, title, description, image_url, location_label, latitude, longitude,
          category, severity, department, status, timeline_stage, upvotes,
          reporter_id, reporter_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.title,
          item.description,
          item.image_url,
          item.location_label,
          item.latitude,
          item.longitude,
          item.category,
          item.severity,
          item.department,
          item.status,
          item.timeline_stage,
          item.upvotes,
          item.reporter_id,
          item.reporter_name,
          item.created_at
        ]
      );
    }
    console.log('Seeded', realReports.length, 'real Bengaluru civic reports successfully!');
  }

  await connection.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
