const pool = require("../db/database");

const seedData = async () => {
  try {
    await pool.query("START TRANSACTION");
    console.log("🌱 Starting data seeding...");

    // Clients (using INSERT IGNORE as client data is less likely to change frequently for tests)
    await pool.query(`
      INSERT IGNORE INTO clients (id, first_name, last_name, email, phone, address, city, state, postal_code, country, id_type, id_number, status, created_at) VALUES
      (1, 'John', 'Doe', 'john.doe@email.com', '+1234567890', '123 Main St', 'New York', 'NY', '10001', 'USA', 'passport', 'P123456789', 'active', '2024-01-01'),
      (2, 'Jane', 'Smith', 'jane.smith@email.com', '+1234567891', '456 Oak Ave', 'Los Angeles', 'CA', '90001', 'USA', 'drivers_license', 'DL987654321', 'active', '2024-01-15'),
      (3, 'Bob', 'Johnson', 'bob.johnson@email.com', '+1234567892', '789 Pine St', 'Chicago', 'IL', '60601', 'USA', 'passport', 'P987654321', 'active', '2024-02-01'),
      (4, 'Alice', 'Williams', 'alice.williams@email.com', '+1234567893', '321 Elm St', 'Houston', 'TX', '77001', 'USA', 'drivers_license', 'DL123456789', 'active', '2024-02-15'),
      (5, 'Charlie', 'Brown', 'charlie.brown@email.com', '+1234567894', '654 Maple Ave', 'Phoenix', 'AZ', '85001', 'USA', 'passport', 'P456789123', 'active', '2024-03-01')
    `);
    console.log("✅ Sample clients created/ignored");

    // Loans - Changed to ON DUPLICATE KEY UPDATE
    const loansData = [
      {
        id: 1,
        client_id: 1,
        loan_amount: 10000.0,
        approved_amount: 10000.0,
        interest_rate: 5.5,
        term_months: 12,
        purpose: "Business expansion",
        start_date: "2024-01-15",
        end_date: "2025-01-15",
        status: "active",
        remaining_balance: 8500.0,
        next_due_date: "2024-12-15",
        payment_frequency: "monthly",
        created_at: "2025-06-01 10:00:00",
      },
      {
        id: 2,
        client_id: 2,
        loan_amount: 15000.0,
        approved_amount: 15000.0,
        interest_rate: 6.0,
        term_months: 24,
        purpose: "Home improvement",
        start_date: "2024-02-01",
        end_date: "2026-02-01",
        status: "active",
        remaining_balance: 12000.0,
        next_due_date: "2024-12-01",
        payment_frequency: "monthly",
        created_at: "2025-06-02 11:00:00",
      },
      {
        id: 3,
        client_id: 3,
        loan_amount: 5000.0,
        approved_amount: 5000.0,
        interest_rate: 4.5,
        term_months: 6,
        purpose: "Emergency fund",
        start_date: "2024-03-01",
        end_date: "2024-09-01",
        status: "paid_off",
        remaining_balance: 0.0,
        next_due_date: null,
        payment_frequency: "monthly",
        created_at: "2024-02-01 12:00:00",
      },
      {
        id: 4,
        client_id: 4,
        loan_amount: 20000.0,
        approved_amount: 18000.0,
        interest_rate: 7.0,
        term_months: 36,
        purpose: "Debt consolidation",
        start_date: "2024-03-15",
        end_date: "2027-03-15",
        status: "active",
        remaining_balance: 16000.0,
        next_due_date: "2024-11-15",
        payment_frequency: "monthly",
        created_at: "2025-06-03 13:00:00",
      },
      {
        id: 5,
        client_id: 5,
        loan_amount: 8000.0,
        approved_amount: 8000.0,
        interest_rate: 5.0,
        term_months: 18,
        purpose: "Education loan",
        start_date: "2024-04-01",
        end_date: "2025-10-01",
        status: "overdue",
        remaining_balance: 6500.0,
        next_due_date: "2024-11-01",
        payment_frequency: "monthly",
        created_at: "2024-03-01 14:00:00",
      },
      {
        id: 6,
        client_id: 1,
        loan_amount: 12000.0,
        approved_amount: null,
        interest_rate: 6.5,
        term_months: 24,
        purpose: "Vehicle purchase",
        start_date: "2024-04-15",
        end_date: "2026-04-15",
        status: "pending",
        remaining_balance: 12000.0,
        next_due_date: null,
        payment_frequency: "monthly",
        created_at: "2025-06-04 15:00:00",
      },
      {
        id: 7,
        client_id: 2,
        loan_amount: 7500.0,
        approved_amount: null,
        interest_rate: 8.0,
        term_months: 12,
        purpose: "Medical expenses",
        start_date: "2024-05-01",
        end_date: "2025-05-01",
        status: "rejected",
        remaining_balance: 7500.0,
        next_due_date: null,
        payment_frequency: "monthly",
        created_at: "2024-04-15 16:00:00",
      },
    ];

    for (const loan of loansData) {
      await pool.query(
        `
        INSERT INTO loans (id, client_id, loan_amount, approved_amount, interest_rate, term_months, purpose, start_date, end_date, status, remaining_balance, next_due_date, payment_frequency, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          client_id=VALUES(client_id), loan_amount=VALUES(loan_amount), approved_amount=VALUES(approved_amount), interest_rate=VALUES(interest_rate), term_months=VALUES(term_months), 
          purpose=VALUES(purpose), start_date=VALUES(start_date), end_date=VALUES(end_date), status=VALUES(status), remaining_balance=VALUES(remaining_balance), 
          next_due_date=VALUES(next_due_date), payment_frequency=VALUES(payment_frequency), created_at=VALUES(created_at)
      `,
        [
          loan.id,
          loan.client_id,
          loan.loan_amount,
          loan.approved_amount,
          loan.interest_rate,
          loan.term_months,
          loan.purpose,
          loan.start_date,
          loan.end_date,
          loan.status,
          loan.remaining_balance,
          loan.next_due_date,
          loan.payment_frequency,
          loan.created_at,
        ]
      );
    }
    console.log("✅ Sample loans created/updated");

    // Payments (using INSERT IGNORE as payment data is less likely to change frequently for tests)
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
    console.log("✅ Sample payments created/ignored");

    await pool.query("COMMIT");
    console.log("🎉 Data seeding completed successfully!");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error seeding data:", error);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
