require("dotenv").config();
const pool = require("../db/database");

const createStoredProcedures = async () => {
  try {
    console.log("🔧 Creating stored procedures...");

    // Drop existing procedures if they exist
    const dropProcedures = [
      "DROP PROCEDURE IF EXISTS sp_get_clients",
      "DROP PROCEDURE IF EXISTS sp_get_clients_count",
      "DROP PROCEDURE IF EXISTS sp_get_client_by_id",
      "DROP PROCEDURE IF EXISTS sp_create_client",
      "DROP PROCEDURE IF EXISTS sp_update_client",
      "DROP PROCEDURE IF EXISTS sp_delete_client",
    ];

    for (const dropSql of dropProcedures) {
      await pool.execute(dropSql);
    }

    console.log("✅ Dropped existing procedures");

    // Create sp_get_clients procedure
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

    console.log("✅ Created sp_get_clients");

    // Create sp_get_clients_count procedure
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

    console.log("✅ Created sp_get_clients_count");

    // Create sp_get_client_by_id procedure
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

    console.log("✅ Created sp_get_client_by_id");

    // Create sp_create_client procedure
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

    console.log("✅ Created sp_create_client");

    // Create sp_update_client procedure
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

    console.log("✅ Created sp_update_client");

    // Create sp_delete_client procedure
    await pool.execute(`
      CREATE PROCEDURE sp_delete_client(IN p_id INT)
      BEGIN
          DELETE FROM clients WHERE id = p_id;
          SELECT ROW_COUNT() as affected_rows;
      END
    `);

    console.log("✅ Created sp_delete_client");

    console.log("\n🎉 All stored procedures created successfully!");
  } catch (error) {
    console.error("❌ Error creating stored procedures:", error);
    throw error;
  }
};

// Run the script
if (require.main === module) {
  createStoredProcedures()
    .then(() => {
      console.log("✅ Stored procedures setup complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed to create stored procedures:", error);
      process.exit(1);
    });
}

module.exports = { createStoredProcedures };
