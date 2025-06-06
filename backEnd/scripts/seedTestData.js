const pool = require("../db/database");

const seedTestData = async () => {
  try {
    console.log("🌱 Starting to seed test data...");

    // Check if data already exists
    const [existingLoans] = await pool.query(
      "SELECT COUNT(*) as count FROM loans"
    );
    if (existingLoans[0].count > 0) {
      console.log("📊 Data already exists, skipping seed...");
      return;
    }

    // Create sample clients
    const clientQueries = [
      [
        "John",
        "Doe",
        "john.doe@email.com",
        "+1234567890",
        "123 Main St",
        "New York",
        "NY",
        "10001",
      ],
      [
        "Jane",
        "Smith",
        "jane.smith@email.com",
        "+1234567891",
        "456 Oak Ave",
        "Los Angeles",
        "CA",
        "90001",
      ],
      [
        "Bob",
        "Johnson",
        "bob.johnson@email.com",
        "+1234567892",
        "789 Pine St",
        "Chicago",
        "IL",
        "60601",
      ],
      [
        "Alice",
        "Williams",
        "alice.williams@email.com",
        "+1234567893",
        "321 Elm St",
        "Houston",
        "TX",
        "77001",
      ],
      [
        "Charlie",
        "Brown",
        "charlie.brown@email.com",
        "+1234567894",
        "654 Maple Ave",
        "Phoenix",
        "AZ",
        "85001",
      ],
    ];

    console.log("Creating clients...");
    for (const client of clientQueries) {
      await pool.query(
        `
        INSERT INTO clients (first_name, last_name, email, phone, address, city, state, postal_code, country, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'United States', 'active', NOW())
      `,
        client
      );
    }

    // Create sample loans with different dates for testing
    const loanQueries = [
      // client_id, loan_amount, approved_amount, interest_rate, term_months, purpose, start_date, end_date, status, remaining_balance, next_due_date, created_at
      [
        1,
        10000.0,
        10000.0,
        5.5,
        12,
        "Business expansion",
        "2024-01-15",
        "2025-01-15",
        "active",
        8500.0,
        "2024-12-15",
        "2024-01-15",
      ],
      [
        2,
        15000.0,
        15000.0,
        6.0,
        24,
        "Home improvement",
        "2024-02-01",
        "2026-02-01",
        "active",
        12000.0,
        "2024-12-01",
        "2024-02-01",
      ],
      [
        3,
        5000.0,
        5000.0,
        4.5,
        6,
        "Emergency fund",
        "2024-03-01",
        "2024-09-01",
        "paid_off",
        0.0,
        null,
        "2024-03-01",
      ],
      [
        4,
        20000.0,
        18000.0,
        7.0,
        36,
        "Debt consolidation",
        "2024-03-15",
        "2027-03-15",
        "active",
        16000.0,
        "2024-11-15",
        "2024-03-15",
      ],
      [
        5,
        8000.0,
        8000.0,
        5.0,
        18,
        "Education loan",
        "2024-04-01",
        "2025-10-01",
        "overdue",
        6500.0,
        "2024-11-01",
        "2024-04-01",
      ],
      [
        1,
        12000.0,
        null,
        6.5,
        24,
        "Vehicle purchase",
        null,
        null,
        "pending",
        12000.0,
        null,
        "2024-04-15",
      ],
      [
        2,
        7500.0,
        null,
        8.0,
        12,
        "Medical expenses",
        null,
        null,
        "rejected",
        7500.0,
        null,
        "2024-05-01",
      ],
    ];

    console.log("Creating loans...");
    for (const loan of loanQueries) {
      await pool.query(
        `
        INSERT INTO loans (client_id, loan_amount, approved_amount, interest_rate, term_months, purpose, start_date, end_date, status, remaining_balance, next_due_date, payment_frequency, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'monthly', ?)
      `,
        loan
      );
    }

    // Create sample payments
    const paymentQueries = [
      // loan_id, client_id, amount, payment_date, payment_method, reference_number, status, created_at
      [
        1,
        1,
        1000.0,
        "2024-02-15",
        "bank_transfer",
        "TXN001",
        "completed",
        "2024-02-15",
      ],
      [1, 1, 500.0, "2024-03-15", "cash", "TXN002", "completed", "2024-03-15"],
      [
        2,
        2,
        1500.0,
        "2024-03-01",
        "credit_card",
        "TXN003",
        "completed",
        "2024-03-01",
      ],
      [
        2,
        2,
        1500.0,
        "2024-04-01",
        "bank_transfer",
        "TXN004",
        "completed",
        "2024-04-01",
      ],
      [
        3,
        3,
        5000.0,
        "2024-08-01",
        "bank_transfer",
        "TXN005",
        "completed",
        "2024-08-01",
      ],
      [
        4,
        4,
        2000.0,
        "2024-04-15",
        "check",
        "TXN006",
        "completed",
        "2024-04-15",
      ],
      [
        4,
        4,
        2000.0,
        "2024-05-15",
        "bank_transfer",
        "TXN007",
        "completed",
        "2024-05-15",
      ],
      [5, 5, 1000.0, "2024-05-01", "cash", "TXN008", "completed", "2024-05-01"],
      [
        5,
        5,
        500.0,
        "2024-06-01",
        "credit_card",
        "TXN009",
        "completed",
        "2024-06-01",
      ],
    ];

    console.log("Creating payments...");
    for (const payment of paymentQueries) {
      await pool.query(
        `
        INSERT INTO payments (loan_id, client_id, amount, payment_date, payment_method, reference_number, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        payment
      );
    }

    console.log("✅ Test data seeded successfully!");

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
  seedTestData();
}

module.exports = seedTestData;
