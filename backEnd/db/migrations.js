require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const colors = require("colors");

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true, // Enable multiple statements for migrations
};

// Tables to be created
const tables = [
  // Users table for authentication
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, // Changed from 'password' to 'password_hash'
    email VARCHAR(100) UNIQUE,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,

  // Clients table
  `CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Philippines',
    id_type VARCHAR(50),
    id_number VARCHAR(50),
    status ENUM('active', 'inactive', 'blacklisted') DEFAULT 'active',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`,

  // Loans table
  `CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    loan_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    term_months INT NOT NULL,
    status ENUM('pending', 'approved', 'active', 'paid', 'defaulted', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at DATETIME,
    start_date DATE,
    end_date DATE,
    purpose TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
  )`,

  // Payments table - Updated for MySQL
  `CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    client_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'check', 'online', 'credit_card') NOT NULL,
    reference_number VARCHAR(100),
    status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'completed',
    processed_by INT NOT NULL, // Changed from received_by
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id), // Changed from received_by
    INDEX idx_payments_loan_id (loan_id),
    INDEX idx_payments_client_id (client_id),
    INDEX idx_payments_payment_date (payment_date),
    INDEX idx_payments_status (status),
    INDEX idx_payments_payment_method (payment_method)
  )`,
];

// Default admin user
const defaultAdmin = {
  username: "admin",
  password: "admin123", // Will be hashed before insertion
  email: "admin@example.com",
  role: "admin",
  full_name: "System Administrator",
};

// Function to run migrations
async function runMigrations() {
  console.log("\n🔄 Starting database migrations...".yellow);

  let connection;

  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL server".green);

    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
    );
    console.log(`✅ Ensured database exists: ${process.env.DB_NAME}`.green);

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`✅ Using database: ${process.env.DB_NAME}`.green);

    // Create tables
    console.log("\n📊 Creating tables:".yellow);
    for (const [index, tableQuery] of tables.entries()) {
      const tableName = tableQuery.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
      try {
        await connection.query(tableQuery);
        console.log(`   ${index + 1}. ${tableName.padEnd(15)} ✅`.green);
      } catch (error) {
        console.error(
          `   ${index + 1}. ${tableName.padEnd(15)} ❌ Error: ${error.message}`
            .red
        );
      }
    }

    // Check if admin user exists
    const [adminCheck] = await connection.query(
      "SELECT * FROM users WHERE username = ?",
      [defaultAdmin.username]
    );

    if (adminCheck.length === 0) {
      // Create default admin user if it doesn't exist
      const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);
      await connection.query(
        "INSERT INTO users (username, password_hash, email, role, full_name) VALUES (?, ?, ?, ?, ?)", // Changed 'password' to 'password_hash'
        [
          defaultAdmin.username,
          hashedPassword,
          defaultAdmin.email,
          defaultAdmin.role,
          defaultAdmin.full_name,
        ]
      );
      console.log("\n👤 Default admin user created:".green);
      console.log(`   Username: ${defaultAdmin.username}`.cyan);
      console.log(`   Password: ${defaultAdmin.password}`.cyan);
      console.log("   (Please change this password after first login)".yellow);
    } else {
      console.log("\n👤 Default admin user already exists".yellow);
    }

    console.log("\n✅ Database migrations completed successfully".green.bold);
  } catch (error) {
    console.error("\n❌ Migration error:".red.bold, error.message);
    console.log("\n🔍 Troubleshooting tips:".yellow);
    console.log("   - Check if MySQL server is running".gray);
    console.log(`   - Verify DB_USER and DB_PASSWORD in .env file`.gray);
    console.log(
      `   - Make sure user '${process.env.DB_USER}' has CREATE privileges`.gray
    );
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed".gray);
    }
  }
}

// Export the migration function
module.exports = { runMigrations };

// Run migrations directly if this file is executed directly
if (require.main === module) {
  runMigrations();
}
