const pool = require("./database");

const createTables = async () => {
  try {
    console.log("   🔧 Creating database tables...");

    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        role ENUM('admin', 'manager', 'officer') DEFAULT 'officer',
        is_active BOOLEAN DEFAULT true, -- Changed from status ENUM
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create clients table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(50),
        state VARCHAR(50),
        postal_code VARCHAR(20),
        country VARCHAR(50) NOT NULL DEFAULT 'United States',
        id_type VARCHAR(50),
        id_number VARCHAR(100),
        status ENUM('active', 'inactive', 'blacklisted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clients_email (email),
        INDEX idx_clients_status (status),
        INDEX idx_clients_name (first_name, last_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create loans table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS loans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        loan_amount DECIMAL(15, 2) NOT NULL,
        approved_amount DECIMAL(15, 2) DEFAULT NULL,
        installment_amount DECIMAL(10, 2) DEFAULT NULL,
        interest_rate DECIMAL(5, 2) NOT NULL,
        term_months INT NOT NULL,
        purpose TEXT,
        start_date DATE,
        end_date DATE,
        status ENUM('pending', 'approved', 'active', 'paid_off', 'defaulted', 'rejected', 'completed', 'overdue') DEFAULT 'pending',
        next_due_date DATE NULL DEFAULT NULL,
        payment_frequency VARCHAR(20) DEFAULT 'monthly',
        remaining_balance DECIMAL(15, 2) DEFAULT NULL,
        approval_date DATE NULL,
        approval_notes TEXT,
        approved_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_loans_client (client_id),
        INDEX idx_loans_status (status),
        INDEX idx_loans_dates (start_date, end_date),
        INDEX idx_loans_next_due (next_due_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Attempt to add 'approved_amount' column to 'loans' table if necessary
    try {
      const [approvedAmountColInfo] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' AND COLUMN_NAME = 'approved_amount'`
      );
      if (approvedAmountColInfo.length === 0) {
        console.log("   Adding 'approved_amount' column to 'loans' table...");
        await pool.execute(
          `ALTER TABLE loans ADD COLUMN approved_amount DECIMAL(15, 2) DEFAULT NULL AFTER loan_amount`
        );
        console.log("      Column 'approved_amount' added.");
      }
    } catch (fixApprovedAmountError) {
      console.error(
        "   Error during 'loans' table 'approved_amount' column check/fix:",
        fixApprovedAmountError.message
      );
    }

    // Attempt to add 'installment_amount' column to 'loans' table if necessary
    try {
      const [installmentAmountColInfo] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' AND COLUMN_NAME = 'installment_amount'`
      );
      if (installmentAmountColInfo.length === 0) {
        console.log(
          "   Adding 'installment_amount' column to 'loans' table..."
        );
        await pool.execute(
          `ALTER TABLE loans ADD COLUMN installment_amount DECIMAL(10, 2) DEFAULT NULL AFTER approved_amount`
        );
        console.log("      Column 'installment_amount' added.");
      }
    } catch (fixInstallmentAmountError) {
      console.error(
        "   Error during 'loans' table 'installment_amount' column check/fix:",
        fixInstallmentAmountError.message
      );
    }

    // Add next_due_date column if it doesn't exist, using INFORMATION_SCHEMA check
    try {
      const [nextDueDateColInfo] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' AND COLUMN_NAME = 'next_due_date'`
      );
      if (nextDueDateColInfo.length === 0) {
        console.log("   Adding 'next_due_date' column to 'loans' table...");
        // Adding next_due_date after 'status' as per the CREATE TABLE definition and previous attempt
        await pool.execute(
          `ALTER TABLE loans ADD COLUMN next_due_date DATE NULL DEFAULT NULL AFTER status`
        );
        console.log("      Column 'next_due_date' added.");
      }
    } catch (fixNextDueDateError) {
      console.error(
        "   Error during 'loans' table 'next_due_date' column check/fix:",
        fixNextDueDateError.message
      );
    }

    // Attempt to add 'payment_frequency' column to 'loans' table if necessary
    try {
      const [paymentFrequencyColInfo] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' AND COLUMN_NAME = 'payment_frequency'`
      );
      if (paymentFrequencyColInfo.length === 0) {
        console.log("   Adding 'payment_frequency' column to 'loans' table...");
        await pool.execute(
          `ALTER TABLE loans ADD COLUMN payment_frequency VARCHAR(20) DEFAULT 'monthly' AFTER next_due_date`
        );
        console.log("      Column 'payment_frequency' added.");
      }
    } catch (fixPaymentFrequencyError) {
      console.error(
        "   Error during 'loans' table 'payment_frequency' column check/fix:",
        fixPaymentFrequencyError.message
      );
    }

    // Attempt to add 'remaining_balance' column to 'loans' table if necessary
    try {
      const [loanColumnsInfo] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' AND COLUMN_NAME = 'remaining_balance'`
      );
      if (loanColumnsInfo.length === 0) {
        console.log(
          "   🔧 Adding 'remaining_balance' column to 'loans' table..."
        );
        // Ensure approved_amount exists before trying to place remaining_balance after it.
        // If approved_amount failed to be added, this might need adjustment or just add without AFTER.
        await pool.execute(
          `ALTER TABLE loans ADD COLUMN remaining_balance DECIMAL(15, 2) DEFAULT NULL AFTER approved_amount`
        );
        console.log("      ✅ Column 'remaining_balance' added.");
      }
      // Initialize remaining_balance regardless of whether it was just added or already existed but was NULL
      console.log(
        "   🔧 Initializing 'remaining_balance' for existing loans (if NULL)..."
      );
      await pool.execute(
        `UPDATE loans SET remaining_balance = COALESCE(approved_amount, loan_amount) WHERE remaining_balance IS NULL`
      );
      console.log(
        "      ✅ 'remaining_balance' initialized for existing loans where it was NULL."
      );
    } catch (fixLoanError) {
      console.error(
        "   ❌ Error during 'loans' table 'remaining_balance' column check/fix/initialization:",
        fixLoanError.message
      );
    }

    // Attempt to add 'approval_date' column to 'loans' table if necessary
    try {
      const [approvalDateColInfo] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' AND COLUMN_NAME = 'approval_date'`
      );
      if (approvalDateColInfo.length === 0) {
        console.log("   🔧 Adding 'approval_date' column to 'loans' table...");
        // Adding approval_date after remaining_balance as per the CREATE TABLE definition
        await pool.execute(
          `ALTER TABLE loans ADD COLUMN approval_date DATE NULL DEFAULT NULL AFTER remaining_balance`
        );
        console.log("      ✅ Column 'approval_date' added.");
      }
    } catch (fixApprovalDateError) {
      console.error(
        "   ❌ Error during 'loans' table 'approval_date' column check/fix:",
        fixApprovalDateError.message
      );
    }

    // Attempt to add 'approval_notes' column to 'loans' table if necessary
    try {
      const [approvalNotesColInfo] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' AND COLUMN_NAME = 'approval_notes'`
      );
      if (approvalNotesColInfo.length === 0) {
        console.log("   🔧 Adding 'approval_notes' column to 'loans' table...");
        // Adding approval_notes after approval_date
        await pool.execute(
          `ALTER TABLE loans ADD COLUMN approval_notes TEXT DEFAULT NULL AFTER approval_date`
        );
        console.log("      ✅ Column 'approval_notes' added.");
      }
    } catch (fixApprovalNotesError) {
      console.error(
        "   ❌ Error during 'loans' table 'approval_notes' column check/fix:",
        fixApprovalNotesError.message
      );
    }

    // Attempt to add 'approved_by' column to 'loans' table if necessary and ensure FK
    try {
      const [approvedByColInfo] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' AND COLUMN_NAME = 'approved_by'`
      );
      if (approvedByColInfo.length === 0) {
        console.log("   🔧 Adding 'approved_by' column to 'loans' table...");
        // Adding approved_by after approval_notes
        await pool.execute(
          `ALTER TABLE loans ADD COLUMN approved_by INT NULL DEFAULT NULL AFTER approval_notes`
        );
        console.log("      ✅ Column 'approved_by' added.");
      }
      // Ensure foreign key for approved_by exists
      const [fkApprovedByConstraints] = await pool.execute(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' 
           AND COLUMN_NAME = 'approved_by' AND REFERENCED_TABLE_NAME = 'users'`
      );
      if (fkApprovedByConstraints.length === 0) {
        console.log(
          "   🔧 Adding foreign key for 'approved_by' in 'loans' table..."
        );
        await pool.execute(`
          ALTER TABLE loans 
          ADD CONSTRAINT fk_loans_approved_by 
          FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL`);
        console.log(
          "      ✅ Foreign key for 'approved_by' in 'loans' table added."
        );
      }
    } catch (fixApprovedByError) {
      console.error(
        "   ❌ Error during 'loans' table 'approved_by' column/FK check/fix:",
        fixApprovedByError.message
      );
    }

    // Fix status column type if it exists but is wrong type
    try {
      const [statusColInfo] = await pool.execute(
        `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loans' AND COLUMN_NAME = 'status'`
      );

      if (statusColInfo.length > 0) {
        const currentType = statusColInfo[0].COLUMN_TYPE.toLowerCase();

        // Check if current type doesn't include 'paid_off'
        if (!currentType.includes("paid_off")) {
          console.log(
            "   🔧 Updating 'status' column type in 'loans' table to include 'paid_off'..."
          );

          // First, update any existing 'paid' status to 'completed' to avoid data loss
          await pool.execute(`
            UPDATE loans SET status = 'completed' WHERE status = 'paid'
          `);

          // Now modify the column to include all required status values
          await pool.execute(`
            ALTER TABLE loans 
            MODIFY COLUMN status ENUM('pending', 'approved', 'active', 'paid_off', 'defaulted', 'rejected', 'completed', 'overdue') DEFAULT 'pending'
          `);
          console.log(
            "      ✅ Status column updated to ENUM with 'paid_off' included."
          );
        }
      }
    } catch (fixStatusError) {
      console.error(
        "   ❌ Error during 'loans' table 'status' column type check/fix:",
        fixStatusError.message
      );
    }

    // Create payments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_id INT NOT NULL,
        client_id INT NOT NULL, -- Added client_id
        amount DECIMAL(15, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method ENUM('cash', 'bank_transfer', 'credit_card', 'check', 'online') NOT NULL,
        reference_number VARCHAR(100),
        status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
        notes TEXT,
        processed_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE, -- Added FK for client_id
        FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_payments_loan (loan_id),
        INDEX idx_payments_client (client_id), -- Added index for client_id
        INDEX idx_payments_date (payment_date),
        INDEX idx_payments_status (status),
        INDEX idx_payments_method (payment_method)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Attempt to add 'client_id' column to 'payments' table if necessary
    try {
      const [paymentClientIdColInfo] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'client_id'`
      );
      if (paymentClientIdColInfo.length === 0) {
        console.log("   🔧 Adding 'client_id' column to 'payments' table...");
        await pool.execute(
          // Adding NOT NULL constraint. If existing rows cause issues, this might need adjustment
          // or a default value temporarily, then an update script.
          // However, if this column is truly new to this schema version, it should be fine.
          `ALTER TABLE payments ADD COLUMN client_id INT NOT NULL AFTER loan_id`
        );
        console.log("      ✅ Column 'client_id' added to 'payments' table.");
      }
      // Ensure foreign key for client_id exists
      const [fkClientConstraints] = await pool.execute(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' 
           AND COLUMN_NAME = 'client_id' AND REFERENCED_TABLE_NAME = 'clients'`
      );
      if (fkClientConstraints.length === 0) {
        console.log(
          "   🔧 Adding foreign key for 'client_id' in 'payments' table..."
        );
        await pool.execute(`
          ALTER TABLE payments 
          ADD CONSTRAINT fk_payments_client 
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE`);
        console.log(
          "      ✅ Foreign key for 'client_id' in 'payments' table added."
        );
      }
    } catch (fixPaymentClientIdError) {
      console.error(
        "   ❌ Error during 'payments' table 'client_id' column/FK check/fix:",
        fixPaymentClientIdError.message
      );
    }

    // Attempt to make 'processed_by' column nullable in 'payments' table if it's NOT NULL
    try {
      const [paymentProcessedByColInfo] = await pool.execute(
        `SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'processed_by'`
      );
      if (
        paymentProcessedByColInfo.length > 0 &&
        paymentProcessedByColInfo[0].IS_NULLABLE === "NO"
      ) {
        console.log(
          "   🔧 Modifying 'processed_by' column in 'payments' table to allow NULLs..."
        );
        await pool.execute(
          `ALTER TABLE payments MODIFY COLUMN processed_by INT NULL`
        );
        console.log(
          "      ✅ Column 'processed_by' in 'payments' modified to allow NULLs."
        );
      }
    } catch (fixProcessedByError) {
      console.error(
        "   ❌ Error during 'payments' table 'processed_by' column nullability check/fix:",
        fixProcessedByError.message
      );
    }

    // Attempt to fix 'received_by' to 'processed_by' column in 'payments' table if necessary (existing logic)
    try {
      const [paymentColumnsInfo] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments'`
      );
      const existingColumnNames = paymentColumnsInfo.map(
        (col) => col.COLUMN_NAME
      );
      const hasProcessedBy = existingColumnNames.includes("processed_by");
      const hasReceivedBy = existingColumnNames.includes("received_by");

      if (hasReceivedBy && !hasProcessedBy) {
        console.log(
          "   🔧 Attempting to rename 'received_by' to 'processed_by' in 'payments' table..."
        );
        // Drop potential foreign key on 'received_by' before renaming.
        // This requires knowing or finding the constraint name.
        // We'll try to find and drop it.
        const [fkConstraints] = await pool.execute(
          `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' 
             AND COLUMN_NAME = 'received_by' AND REFERENCED_TABLE_NAME = 'users'`
        );

        for (const fk of fkConstraints) {
          try {
            await pool.execute(
              `ALTER TABLE payments DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`
            );
            console.log(
              `      Dropped foreign key ${fk.CONSTRAINT_NAME} on 'received_by'.`
            );
          } catch (dropFkError) {
            console.warn(
              `      Warning: Could not drop foreign key ${fk.CONSTRAINT_NAME} on 'received_by': ${dropFkError.message}`
            );
          }
        }

        await pool.execute(
          `ALTER TABLE payments CHANGE COLUMN received_by processed_by INT NULL`
        );
        console.log("      ✅ Column 'received_by' renamed to 'processed_by'.");

        // Ensure the foreign key is now on 'processed_by' as defined in the CREATE TABLE statement.
        // The CREATE TABLE IF NOT EXISTS might not add FK to existing table/column.
        try {
          await pool.execute(`
                ALTER TABLE payments 
                ADD CONSTRAINT fk_payments_processed_by_users 
                FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL`);
          console.log(
            "      ✅ Ensured foreign key on 'processed_by' to 'users' table."
          );
        } catch (addFkError) {
          // Common error codes for duplicate key/constraint name or if FK already exists
          if (
            addFkError.code !== "ER_DUP_KEYNAME" &&
            addFkError.code !== "ER_FK_DUP_NAME" &&
            !addFkError.message.toLowerCase().includes("already exists")
          ) {
            console.warn(
              `      Warning: Could not add foreign key on 'processed_by' (may already exist with a different name or other issue): ${addFkError.message}`
            );
          } else {
            console.log(
              "      Foreign key on 'processed_by' likely already exists or was handled."
            );
          }
        }
      } else if (!hasProcessedBy) {
        // This case implies 'processed_by' is missing and 'received_by' was also not found for renaming.
        // The CREATE TABLE IF NOT EXISTS should have added 'processed_by'.
        // This block is a fallback if it's still missing for some reason.
        console.log(
          "   🔧 'processed_by' column seems missing in 'payments' table. The CREATE TABLE statement should handle this."
        );
      }
    } catch (fixError) {
      console.error(
        "   ❌ Error during 'payments' table column check/fix:",
        fixError.message
      );
    }

    // Create refresh_tokens table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_refresh_tokens_user (user_id),
        INDEX idx_refresh_tokens_token (token),
        INDEX idx_refresh_tokens_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("   ✅ Database tables created successfully");
    return true;
  } catch (error) {
    console.error("   ❌ Error creating tables:", error.message);
    throw error;
  }
};

const insertDefaultAdmin = async () => {
  try {
    console.log("   👤 Creating default admin user...");

    // Check if admin user already exists
    const [existingUsers] = await pool.execute(
      "SELECT COUNT(*) as count FROM users"
    );

    if (existingUsers[0].count === 0) {
      // Create default admin user (password: admin123)
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await pool.execute(
        `
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, // Changed 'status' to 'is_active'
        [
          "admin",
          "admin@lms.com",
          hashedPassword,
          "System",
          "Administrator",
          "admin",
          true, // Changed 'active' to true
        ]
      );

      console.log(
        "   ✅ Default admin user created (username: admin, password: admin123)"
      );
    } else {
      console.log("   ℹ️  Admin user already exists");
    }

    return true;
  } catch (error) {
    console.error("   ❌ Error creating admin user:", error.message);
    throw error;
  }
};

const createTriggers = async () => {
  try {
    console.log("   ⚡ Creating database triggers...");

    // Drop existing triggers if they exist
    await pool.execute(
      "DROP TRIGGER IF EXISTS update_remaining_balance_after_payment"
    );
    await pool.execute(
      "DROP TRIGGER IF EXISTS update_remaining_balance_after_payment_update"
    );
    await pool.execute(
      "DROP TRIGGER IF EXISTS update_remaining_balance_after_payment_delete"
    );

    // Create trigger to update remaining balance when payment is inserted
    await pool.execute(`
      CREATE TRIGGER update_remaining_balance_after_payment
      AFTER INSERT ON payments
      FOR EACH ROW
      BEGIN
        IF NEW.status = 'completed' THEN
          UPDATE loans 
          SET remaining_balance = remaining_balance - NEW.amount
          WHERE id = NEW.loan_id;
        END IF;
      END
    `);

    // Create trigger to update remaining balance when payment is updated
    await pool.execute(`
      CREATE TRIGGER update_remaining_balance_after_payment_update
      AFTER UPDATE ON payments
      FOR EACH ROW
      BEGIN
        IF OLD.status != NEW.status OR OLD.amount != NEW.amount THEN
          -- Revert old payment if it was completed
          IF OLD.status = 'completed' THEN
            UPDATE loans 
            SET remaining_balance = remaining_balance + OLD.amount
            WHERE id = OLD.loan_id;
          END IF;
          
          -- Apply new payment if it's completed
          IF NEW.status = 'completed' THEN
            UPDATE loans 
            SET remaining_balance = remaining_balance - NEW.amount
            WHERE id = NEW.loan_id;
          END IF;
        END IF;
      END
    `);

    // Create trigger to update remaining balance when payment is deleted
    await pool.execute(`
      CREATE TRIGGER update_remaining_balance_after_payment_delete
      AFTER DELETE ON payments
      FOR EACH ROW
      BEGIN
        IF OLD.status = 'completed' THEN
          UPDATE loans 
          SET remaining_balance = remaining_balance + OLD.amount
          WHERE id = OLD.loan_id;
        END IF;
      END
    `);

    console.log("   ✅ Database triggers created successfully");
    return true;
  } catch (error) {
    console.error("   ❌ Error creating triggers:", error.message);
    throw error;
  }
};

const createStoredProcedures = async () => {
  try {
    console.log("   ⚡ Creating stored procedures...");

    // Drop existing procedures if they exist
    const dropProcedures = [
      "DROP PROCEDURE IF EXISTS sp_get_clients",
      "DROP PROCEDURE IF EXISTS sp_get_clients_count",
      "DROP PROCEDURE IF EXISTS sp_get_client_by_id",
      "DROP PROCEDURE IF EXISTS sp_create_client",
      "DROP PROCEDURE IF EXISTS sp_update_client",
      "DROP PROCEDURE IF EXISTS sp_delete_client",
      // Add loan procedures
      "DROP PROCEDURE IF EXISTS sp_get_loans",
      "DROP PROCEDURE IF EXISTS sp_get_loans_count",
      "DROP PROCEDURE IF EXISTS sp_get_loan_by_id",
      "DROP PROCEDURE IF EXISTS sp_create_loan",
      "DROP PROCEDURE IF EXISTS sp_update_loan",
    ];

    for (const dropSql of dropProcedures) {
      await pool.execute(dropSql);
    }

    // Create client stored procedures
    await pool.execute(`
      CREATE PROCEDURE sp_get_clients(
          IN p_limit INT,
          IN p_offset INT,
          IN p_search VARCHAR(255),
          IN p_status VARCHAR(50)
      )
      BEGIN
          DECLARE search_term VARCHAR(257) COLLATE utf8mb4_unicode_ci;
          SET search_term = CONCAT('%', COALESCE(p_search COLLATE utf8mb4_unicode_ci, ''), '%');
          
          SELECT 
              id, first_name, last_name, email, phone, address, city, state, 
              postal_code, country, status, created_at, updated_at
          FROM clients 
          WHERE (p_search IS NULL OR p_search = '' OR 
                 CONCAT(first_name, ' ', last_name) COLLATE utf8mb4_unicode_ci LIKE search_term OR 
                 COALESCE(email, '') COLLATE utf8mb4_unicode_ci LIKE search_term OR 
                 COALESCE(phone, '') COLLATE utf8mb4_unicode_ci LIKE search_term)
          AND (p_status IS NULL OR p_status = '' OR status COLLATE utf8mb4_unicode_ci = p_status COLLATE utf8mb4_unicode_ci)
          ORDER BY created_at DESC 
          LIMIT p_limit OFFSET p_offset;
      END
    `);

    await pool.execute(`
      CREATE PROCEDURE sp_get_clients_count(
          IN p_search VARCHAR(255),
          IN p_status VARCHAR(50)
      )
      BEGIN
          DECLARE search_term VARCHAR(257) COLLATE utf8mb4_unicode_ci;
          SET search_term = CONCAT('%', COALESCE(p_search COLLATE utf8mb4_unicode_ci, ''), '%');
          
          SELECT COUNT(*) as total
          FROM clients 
          WHERE (p_search IS NULL OR p_search = '' OR 
                 CONCAT(first_name, ' ', last_name) COLLATE utf8mb4_unicode_ci LIKE search_term OR 
                 COALESCE(email, '') COLLATE utf8mb4_unicode_ci LIKE search_term OR 
                 COALESCE(phone, '') COLLATE utf8mb4_unicode_ci LIKE search_term)
          AND (p_status IS NULL OR p_status = '' OR status COLLATE utf8mb4_unicode_ci = p_status COLLATE utf8mb4_unicode_ci);
      END
    `);

    await pool.execute(`
      CREATE PROCEDURE sp_get_client_by_id(IN p_id INT)
      BEGIN
          SELECT 
              c.*,
              COUNT(l.id) as loan_count,
              COALESCE(SUM(l.loan_amount), 0) as total_borrowed,
              COALESCE(SUM(CASE WHEN l.status = 'active' THEN l.remaining_balance END), 0) as outstanding_balance
          FROM clients c
          LEFT JOIN loans l ON c.id = l.client_id
          WHERE c.id = p_id
          GROUP BY c.id;
      END
    `);

    await pool.execute(`
      CREATE PROCEDURE sp_create_client(
          IN p_first_name VARCHAR(50),
          IN p_last_name VARCHAR(50),
          IN p_email VARCHAR(100),
          IN p_phone VARCHAR(20),
          IN p_address TEXT,
          IN p_city VARCHAR(50),
          IN p_state VARCHAR(50),
          IN p_postal_code VARCHAR(20),
          IN p_country VARCHAR(50),
          IN p_id_type VARCHAR(50),
          IN p_id_number VARCHAR(50),
          IN p_status VARCHAR(20)
      )
      BEGIN
          INSERT INTO clients (
              first_name, last_name, email, phone, address, city, state, 
              postal_code, country, id_type, id_number, status, created_at
          ) VALUES (
              p_first_name, p_last_name, p_email, p_phone, p_address, p_city, p_state,
              p_postal_code, p_country, p_id_type, p_id_number, p_status, NOW()
          );
          
          SELECT LAST_INSERT_ID() as id;
      END
    `);

    await pool.execute(`
      CREATE PROCEDURE sp_update_client(
          IN p_id INT,
          IN p_first_name VARCHAR(50),
          IN p_last_name VARCHAR(50),
          IN p_email VARCHAR(100),
          IN p_phone VARCHAR(20),
          IN p_address TEXT,
          IN p_city VARCHAR(50),
          IN p_state VARCHAR(50),
          IN p_postal_code VARCHAR(20),
          IN p_country VARCHAR(50),
          IN p_id_type VARCHAR(50),
          IN p_id_number VARCHAR(50),
          IN p_status VARCHAR(20)
      )
      BEGIN
          UPDATE clients SET 
              first_name = p_first_name,
              last_name = p_last_name,
              email = p_email,
              phone = p_phone,
              address = p_address,
              city = p_city,
              state = p_state,
              postal_code = p_postal_code,
              country = p_country,
              id_type = p_id_type,
              id_number = p_id_number,
              status = p_status,
              updated_at = NOW()
          WHERE id = p_id;
          
          SELECT ROW_COUNT() as affected_rows;
      END
    `);

    await pool.execute(`
      CREATE PROCEDURE sp_delete_client(IN p_id INT)
      BEGIN
          DELETE FROM clients WHERE id = p_id;
          SELECT ROW_COUNT() as affected_rows;
      END
    `);

    // Create loan stored procedures
    await pool.execute(`
      CREATE PROCEDURE sp_get_loans(
          IN p_limit INT,
          IN p_offset INT,
          IN p_search VARCHAR(255),
          IN p_status VARCHAR(50),
          IN p_client_id INT
      )
      BEGIN
          DECLARE search_term VARCHAR(257) COLLATE utf8mb4_unicode_ci;
          SET search_term = CONCAT('%', COALESCE(p_search COLLATE utf8mb4_unicode_ci, ''), '%');
          
          SELECT 
              l.id,
              l.client_id,
              l.loan_amount,
              l.approved_amount,
              l.installment_amount,
              l.interest_rate,
              l.term_months,
              l.purpose,
              l.start_date,
              l.end_date,
              l.status,
              l.next_due_date,
              l.payment_frequency,
              l.remaining_balance,
              l.approval_date,
              l.approval_notes,
              l.approved_by,
              l.created_at,
              l.updated_at,
              CONCAT(c.first_name, ' ', c.last_name) as client_name,
              c.email as client_email,
              c.phone as client_phone
          FROM loans l
          LEFT JOIN clients c ON l.client_id = c.id
          WHERE (p_search IS NULL OR p_search = '' OR 
                 CONCAT(c.first_name, ' ', c.last_name) COLLATE utf8mb4_unicode_ci LIKE search_term OR 
                 COALESCE(c.email, '') COLLATE utf8mb4_unicode_ci LIKE search_term OR 
                 COALESCE(l.purpose, '') COLLATE utf8mb4_unicode_ci LIKE search_term)
          AND (p_status IS NULL OR p_status = '' OR l.status COLLATE utf8mb4_unicode_ci = p_status COLLATE utf8mb4_unicode_ci)
          AND (p_client_id IS NULL OR l.client_id = p_client_id)
          ORDER BY l.created_at DESC 
          LIMIT p_limit OFFSET p_offset;
      END
    `);

    await pool.execute(`
      CREATE PROCEDURE sp_get_loans_count(
          IN p_search VARCHAR(255),
          IN p_status VARCHAR(50),
          IN p_client_id INT
      )
      BEGIN
          DECLARE search_term VARCHAR(257) COLLATE utf8mb4_unicode_ci;
          SET search_term = CONCAT('%', COALESCE(p_search COLLATE utf8mb4_unicode_ci, ''), '%');
          
          SELECT COUNT(*) as total
          FROM loans l
          LEFT JOIN clients c ON l.client_id = c.id
          WHERE (p_search IS NULL OR p_search = '' OR 
                 CONCAT(c.first_name, ' ', c.last_name) COLLATE utf8mb4_unicode_ci LIKE search_term OR 
                 COALESCE(c.email, '') COLLATE utf8mb4_unicode_ci LIKE search_term OR 
                 COALESCE(l.purpose, '') COLLATE utf8mb4_unicode_ci LIKE search_term)
          AND (p_status IS NULL OR p_status = '' OR l.status COLLATE utf8mb4_unicode_ci = p_status COLLATE utf8mb4_unicode_ci)
          AND (p_client_id IS NULL OR l.client_id = p_client_id);
      END
    `);

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
          DECLARE new_loan_id INT;
          
          INSERT INTO loans (
              client_id,
              loan_amount,
              interest_rate,
              term_months,
              purpose,
              payment_frequency,
              status,
              remaining_balance,
              created_at
          ) VALUES (
              p_client_id,
              p_loan_amount,
              p_interest_rate,
              p_term_months,
              p_purpose,
              COALESCE(p_payment_frequency, 'monthly'),
              'pending',
              p_loan_amount,
              NOW()
          );
          
          SET new_loan_id = LAST_INSERT_ID();
          SELECT new_loan_id as id;
      END
    `);

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

    console.log("   ✅ Stored procedures created successfully");
    return true;
  } catch (error) {
    console.error("   ❌ Error creating stored procedures:", error.message);
    throw error;
  }
};

const initializeDatabase = async () => {
  try {
    await createTables();
    await createTriggers();
    await createStoredProcedures(); // Add this line
    await insertDefaultAdmin();
    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

module.exports = {
  createTables,
  insertDefaultAdmin,
  createTriggers,
  createStoredProcedures, // Export the new function
  initializeDatabase,
};
