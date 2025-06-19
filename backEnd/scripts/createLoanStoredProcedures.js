require("dotenv").config();
const pool = require("../db/database");

const createLoanStoredProcedures = async () => {
  try {
    console.log("🔧 Creating loan stored procedures...");

    // Drop existing procedures
    const dropProcedures = [
      "DROP PROCEDURE IF EXISTS sp_get_loans",
      "DROP PROCEDURE IF EXISTS sp_get_loans_count",
      "DROP PROCEDURE IF EXISTS sp_get_loan_by_id",
      "DROP PROCEDURE IF EXISTS sp_create_loan",
      "DROP PROCEDURE IF EXISTS sp_update_loan",
    ];

    for (const dropSql of dropProcedures) {
      await pool.execute(dropSql);
    }

    console.log("✅ Dropped existing loan procedures");

    // Create sp_get_loans_count procedure
    await pool.execute(`
      CREATE PROCEDURE sp_get_loans_count(
          IN p_search VARCHAR(255),
          IN p_status VARCHAR(50),
          IN p_client_id INT
      )
      BEGIN
          DECLARE search_term VARCHAR(257);
          SET search_term = CONCAT('%', COALESCE(p_search, ''), '%');
          
          SELECT COUNT(*) as total
          FROM loans l
          LEFT JOIN clients c ON l.client_id = c.id
          WHERE (p_search IS NULL OR p_search = '' OR 
                 CONCAT(c.first_name, ' ', c.last_name) LIKE search_term OR 
                 COALESCE(c.email, '') LIKE search_term OR 
                 COALESCE(l.purpose, '') LIKE search_term)
          AND (p_status IS NULL OR p_status = '' OR l.status = p_status)
          AND (p_client_id IS NULL OR l.client_id = p_client_id);
      END
    `);
    console.log("✅ Created sp_get_loans_count");

    // Create sp_get_loans procedure
    await pool.execute(`
      CREATE PROCEDURE sp_get_loans(
          IN p_limit INT,
          IN p_offset INT,
          IN p_search VARCHAR(255),
          IN p_status VARCHAR(50),
          IN p_client_id INT
      )
      BEGIN
          DECLARE search_term VARCHAR(257);
          SET search_term = CONCAT('%', COALESCE(p_search, ''), '%');
          
          SELECT 
              l.id, l.client_id, l.loan_amount, l.approved_amount, l.installment_amount,
              l.interest_rate, l.term_months, l.purpose, l.start_date, l.end_date,
              l.status, l.next_due_date, l.payment_frequency, l.remaining_balance,
              l.approval_date, l.approval_notes, l.approved_by, l.created_at, l.updated_at,
              CONCAT(c.first_name, ' ', c.last_name) as client_name,
              c.email as client_email, c.phone as client_phone
          FROM loans l
          LEFT JOIN clients c ON l.client_id = c.id
          WHERE (p_search IS NULL OR p_search = '' OR 
                 CONCAT(c.first_name, ' ', c.last_name) LIKE search_term OR 
                 COALESCE(c.email, '') LIKE search_term OR 
                 COALESCE(l.purpose, '') LIKE search_term)
          AND (p_status IS NULL OR p_status = '' OR l.status = p_status)
          AND (p_client_id IS NULL OR l.client_id = p_client_id)
          ORDER BY l.created_at DESC 
          LIMIT p_limit OFFSET p_offset;
      END
    `);
    console.log("✅ Created sp_get_loans");

    // Create sp_get_loan_by_id procedure
    await pool.execute(`
      CREATE PROCEDURE sp_get_loan_by_id(IN p_id INT)
      BEGIN
          SELECT 
              l.*, 
              CONCAT(c.first_name, ' ', c.last_name) as client_name,
              c.email as client_email, 
              c.phone as client_phone,
              c.address as client_address, 
              u.username as approved_by_name
          FROM loans l
          LEFT JOIN clients c ON l.client_id = c.id
          LEFT JOIN users u ON l.approved_by = u.id
          WHERE l.id = p_id;
      END
    `);
    console.log("✅ Created sp_get_loan_by_id");

    // Create sp_create_loan procedure
    await pool.execute(`
      CREATE PROCEDURE sp_create_loan(
          IN p_client_id INT,
          IN p_loan_amount DECIMAL(15,2),
          IN p_interest_rate DECIMAL(5,2),
          IN p_term_months INT,
          IN p_purpose TEXT,
          IN p_payment_frequency VARCHAR(20)
      )
      BEGIN
          INSERT INTO loans (
              client_id, loan_amount, interest_rate, term_months,
              purpose, payment_frequency, status, remaining_balance, created_at
          ) VALUES (
              p_client_id, p_loan_amount, p_interest_rate, p_term_months,
              p_purpose, COALESCE(p_payment_frequency, 'monthly'), 'pending', p_loan_amount, NOW()
          );
          SELECT LAST_INSERT_ID() as id;
      END
    `);
    console.log("✅ Created sp_create_loan");

    // Create sp_update_loan procedure
    await pool.execute(`
      CREATE PROCEDURE sp_update_loan(
          IN p_id INT,
          IN p_loan_amount DECIMAL(15,2),
          IN p_interest_rate DECIMAL(5,2),
          IN p_term_months INT,
          IN p_purpose TEXT,
          IN p_payment_frequency VARCHAR(20),
          IN p_status VARCHAR(50)
      )
      BEGIN
          UPDATE loans SET 
              loan_amount = COALESCE(p_loan_amount, loan_amount),
              interest_rate = COALESCE(p_interest_rate, interest_rate),
              term_months = COALESCE(p_term_months, term_months),
              purpose = COALESCE(p_purpose, purpose),
              payment_frequency = COALESCE(p_payment_frequency, payment_frequency),
              status = COALESCE(p_status, status),
              updated_at = NOW()
          WHERE id = p_id;
          SELECT ROW_COUNT() as affected_rows;
      END
    `);
    console.log("✅ Created sp_update_loan");

    console.log("\n🎉 All loan stored procedures created successfully!");
  } catch (error) {
    console.error("❌ Error creating loan stored procedures:", error);
    throw error;
  }
};

if (require.main === module) {
  createLoanStoredProcedures()
    .then(() => {
      console.log("✅ Loan stored procedures setup complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed to create loan stored procedures:", error);
      process.exit(1);
    });
}

module.exports = { createLoanStoredProcedures };
// This script creates stored procedures for managing loans in the database.
// It includes procedures for getting loans, creating loans, updating loans, and more.
