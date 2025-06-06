const pool = require("../db/database");

const seedData = async () => {
  try {
    console.log("Starting to seed sample data...");

    // Check if data already exists
    const [existingLoans] = await pool.query(
      "SELECT COUNT(*) as count FROM loans"
    );
    if (existingLoans[0].count > 0) {
      console.log("📊 Data already exists, skipping seed...");
      return;
    }

    // Create sample users first
    await pool.query(`
      INSERT IGNORE INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at) VALUES
      ('admin', 'admin@example.com', '$2b$10$9rZFGkXsF1wEp5K.b6/oLOPQNw7KJQx8Z.gQNm5q2v3x4c5v6b7n8', 'Admin', 'User', 'admin', true, NOW()),
      ('manager', 'manager@example.com', '$2b$10$9rZFGkXsF1wEp5K.b6/oLOPQNw7KJQx8Z.gQNm5q2v3x4c5v6b7n8', 'Manager', 'User', 'manager', true, NOW())
    `);

    // Create sample clients
    await pool.query(`
      INSERT IGNORE INTO clients (id, first_name, last_name, email, phone, address, city, state, postal_code, country, id_type, id_number, status, created_at) VALUES
      (1, 'John', 'Doe', 'john.doe@email.com', '+1234567890', '123 Main St', 'New York', 'NY', '10001', 'USA', 'passport', 'P123456789', 'active', '2024-01-01'),
      (2, 'Jane', 'Smith', 'jane.smith@email.com', '+1234567891', '456 Oak Ave', 'Los Angeles', 'CA', '90001', 'USA', 'drivers_license', 'DL987654321', 'active', '2024-01-15'),
      (3, 'Bob', 'Johnson', 'bob.johnson@email.com', '+1234567892', '789 Pine St', 'Chicago', 'IL', '60601', 'USA', 'passport', 'P987654321', 'active', '2024-02-01'),
      (4, 'Alice', 'Williams', 'alice.williams@email.com', '+1234567893', '321 Elm St', 'Houston', 'TX', '77001', 'USA', 'drivers_license', 'DL123456789', 'active', '2024-02-15'),
      (5, 'Charlie', 'Brown', 'charlie.brown@email.com', '+1234567894', '654 Maple Ave', 'Phoenix', 'AZ', '85001', 'USA', 'passport', 'P456789123', 'active', '2024-03-01')
    `);

    // Create sample loans
    await pool.query(`
      INSERT IGNORE INTO loans (id, client_id, loan_amount, approved_amount, interest_rate, term_months, purpose, start_date, end_date, status, remaining_balance, next_due_date, payment_frequency, created_at) VALUES
      (1, 1, 10000.00, 10000.00, 5.5, 12, 'Business expansion', '2024-01-15', '2025-01-15', 'active', 8500.00, '2024-12-15', 'monthly', '2024-01-01'),
      (2, 2, 15000.00, 15000.00, 6.0, 24, 'Home improvement', '2024-02-01', '2026-02-01', 'active', 12000.00, '2024-12-01', 'monthly', '2024-01-15'),
      (3, 3, 5000.00, 5000.00, 4.5, 6, 'Emergency fund', '2024-03-01', '2024-09-01', 'paid_off', 0.00, NULL, 'monthly', '2024-02-01'),
      (4, 4, 20000.00, 18000.00, 7.0, 36, 'Debt consolidation', '2024-03-15', '2027-03-15', 'active', 16000.00, '2024-11-15', 'monthly', '2024-02-15'),
      (5, 5, 8000.00, 8000.00, 5.0, 18, 'Education loan', '2024-04-01', '2025-10-01', 'overdue', 6500.00, '2024-11-01', 'monthly', '2024-03-01'),
      (6, 1, 12000.00, NULL, 6.5, 24, 'Vehicle purchase', '2024-04-15', '2026-04-15', 'pending', 12000.00, NULL, 'monthly', '2024-04-01'),
      (7, 2, 7500.00, NULL, 8.0, 12, 'Medical expenses', '2024-05-01', '2025-05-01', 'rejected', 7500.00, NULL, 'monthly', '2024-04-15')
    `);

    // Create sample payments
    await pool.query(`
      INSERT IGNORE INTO payments (id, loan_id, client_id, amount, payment_date, payment_method, reference_number, notes, status, processed_by, created_at) VALUES
      (1, 1, 1, 1000.00, '2024-02-15', 'bank_transfer', 'TXN001', 'First payment', 'completed', 1, '2024-02-15'),
      (2, 1, 1, 500.00, '2024-03-15', 'cash', 'TXN002', 'Partial payment', 'completed', 1, '2024-03-15'),
      (3, 2, 2, 1500.00, '2024-03-01', 'credit_card', 'TXN003', 'Monthly payment', 'completed', 1, '2024-03-01'),
      (4, 2, 2, 1500.00, '2024-04-01', 'bank_transfer', 'TXN004', 'Monthly payment', 'completed', 1, '2024-04-01'),
      (5, 3, 3, 5000.00, '2024-08-01', 'bank_transfer', 'TXN005', 'Full payment', 'completed', 1, '2024-08-01'),
      (6, 4, 4, 2000.00, '2024-04-15', 'check', 'TXN006', 'First payment', 'completed', 1, '2024-04-15'),
      (7, 4, 4, 2000.00, '2024-05-15', 'bank_transfer', 'TXN007', 'Second payment', 'completed', 1, '2024-05-15'),
      (8, 5, 5, 1000.00, '2024-05-01', 'cash', 'TXN008', 'Payment', 'completed', 1, '2024-05-01'),
      (9, 5, 5, 500.00, '2024-06-01', 'credit_card', 'TXN009', 'Partial payment', 'completed', 1, '2024-06-01')
    `);

    console.log("✅ Sample data seeded successfully!");

    // Verify the data
    const [loanCount] = await pool.query("SELECT COUNT(*) as count FROM loans");
    const [clientCount] = await pool.query(
      "SELECT COUNT(*) as count FROM clients"
    );
    const [paymentCount] = await pool.query(
      "SELECT COUNT(*) as count FROM payments"
    );

    console.log(`📊 Created ${clientCount[0].count} clients`);
    console.log(`📊 Created ${loanCount[0].count} loans`);
    console.log(`📊 Created ${paymentCount[0].count} payments`);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
