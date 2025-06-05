const pool = require("../db/database");

// Get all clients with filtering and pagination
exports.getClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        c.*,
        COUNT(l.id) as loan_count,
        COALESCE(SUM(l.loan_amount), 0) as total_borrowed
      FROM clients c
      LEFT JOIN loans l ON c.id = l.client_id
      WHERE 1=1
    `;

    const queryParams = [];

    // Add search filter
    if (search) {
      query += ` AND (CONCAT(c.first_name, ' ', c.last_name) LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Add status filter
    if (status && ["active", "inactive", "blacklisted"].includes(status)) {
      query += ` AND c.status = ?`;
      queryParams.push(status);
    }

    // Add GROUP BY clause
    query += ` GROUP BY c.id`;

    // Add sorting
    query += ` ORDER BY c.created_at DESC`;

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const [clients] = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT c.id) as total FROM clients c WHERE 1=1`;
    const countParams = [];

    if (search) {
      countQuery += ` AND (CONCAT(c.first_name, ' ', c.last_name) LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && ["active", "inactive", "blacklisted"].includes(status)) {
      countQuery += ` AND c.status = ?`;
      countParams.push(status);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: {
        clients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
      error: error.message,
    });
  }
};

// Get clients with active loans
exports.getClientsWithActiveLoans = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        c.id,
        c.first_name,
        c.last_name
      FROM clients c
      JOIN loans l ON c.id = l.client_id
      WHERE l.status = 'active'
      ORDER BY c.last_name, c.first_name;
    `;

    const [clients] = await pool.query(query);

    res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error("Error fetching clients with active loans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clients with active loans",
      error: error.message,
    });
  }
};

// Get client by ID
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const [clients] = await pool.query(
      `SELECT c.*, 
       COUNT(l.id) as loan_count,
       COALESCE(SUM(l.loan_amount), 0) as total_borrowed,
       COALESCE(SUM(CASE WHEN l.status = 'active' THEN l.remaining_balance END), 0) as outstanding_balance
       FROM clients c
       LEFT JOIN loans l ON c.id = l.client_id
       WHERE c.id = ?
       GROUP BY c.id`,
      [id]
    );

    if (clients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      data: clients[0],
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client",
      error: error.message,
    });
  }
};

// Create new client
exports.createClient = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      address,
      city,
      state,
      postal_code,
      country,
      id_type,
      id_number,
      status = "active",
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !country) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, and country are required",
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const [existingClients] = await pool.query(
        "SELECT id FROM clients WHERE email = ?",
        [email]
      );

      if (existingClients.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Client with this email already exists",
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO clients (
        first_name, last_name, email, phone, address, city, state, 
        postal_code, country, id_type, id_number, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        state,
        postal_code,
        country,
        id_type,
        id_number,
        status,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create client",
      error: error.message,
    });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;

    const fields = Object.keys(updates).filter(
      (key) => updates[key] !== undefined
    );

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => updates[field]);

    await pool.query(
      `UPDATE clients SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id]
    );

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
    });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update client",
      error: error.message,
    });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if client has any loans
    const [loans] = await pool.query(
      "SELECT id FROM loans WHERE client_id = ?",
      [id]
    );

    if (loans.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete client with existing loans",
      });
    }

    await pool.query("DELETE FROM clients WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete client",
      error: error.message,
    });
  }
};

// Get client statistics
exports.getClientStats = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_clients,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_clients,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_clients,
        SUM(CASE WHEN status = 'blacklisted' THEN 1 ELSE 0 END) as blacklisted_clients
      FROM clients
    `);

    res.status(200).json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error("Error fetching client stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client statistics",
      error: error.message,
    });
  }
};

// Get client details by ID (including loans and upcoming payments)
exports.getClientDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch basic client information
    const [clientRows] = await pool.query("SELECT * FROM clients WHERE id = ?", [id]);
    if (clientRows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    const client = clientRows[0];

    // 2. Fetch all loans for the client
    const [loansFromDB] = await pool.query("SELECT * FROM loans WHERE client_id = ? ORDER BY created_at DESC", [id]);
    const processedLoans = loansFromDB.map(loan => ({
      ...loan,
      loan_amount: parseFloat(loan.loan_amount || 0),
      approved_amount: parseFloat(loan.approved_amount || 0),
      remaining_balance: parseFloat(loan.remaining_balance || 0),
      interest_rate: parseFloat(loan.interest_rate || 0),
      term_months: parseInt(loan.term_months || 0, 10)
    }));

    // 3. Fetch upcoming payments for the client
    const [rawUpcomingPayments] = await pool.query(
      `SELECT p.loan_id, l.purpose as loan_type, p.amount as amount_due, p.payment_date as due_date 
       FROM payments p
       JOIN loans l ON p.loan_id = l.id
       WHERE p.client_id = ? AND p.status NOT IN ('Paid', 'Cancelled', 'Skipped') 
       ORDER BY p.payment_date ASC`,
      [id]
    );
    const processedUpcomingPayments = rawUpcomingPayments.map(payment => ({
      ...payment,
      amount_due: parseFloat(payment.amount_due || 0)
    }));

    // 4. Calculate aggregate data and determine next due dates for loans
    let activeLoansCount = 0;
    let totalRemainingBalance = 0;

    const loansWithNextDueDate = processedLoans.map(loan => {
      const statusLowerCase = loan.status ? loan.status.toLowerCase() : '';
      if (statusLowerCase === 'active' || statusLowerCase === 'overdue') {
        activeLoansCount++;
        totalRemainingBalance += loan.remaining_balance; // Already a number
      }

      // The 'loan' object already contains 'next_due_date' directly from the 'loans' table query.
      // No need to derive it from 'upcomingPaymentsForLoan' for this purpose.
      return {
        ...loan,
        // next_due_date is already part of 'loan' from the database query
      };
    });

    const totalUpcomingPaymentsAmount = processedUpcomingPayments.reduce((sum, payment) => {
      return sum + payment.amount_due; // Already a number
    }, 0);

    // 5. Combine all data
    const filteredLoansForDisplay = loansWithNextDueDate.filter(loan => {
      const statusLowerCase = loan.status ? loan.status.toLowerCase() : '';
      return statusLowerCase === 'active' || statusLowerCase === 'overdue';
    });

    const clientDetailsData = {
      ...client, 
      loans: filteredLoansForDisplay, // Use the filtered list for display
      upcoming_payments: processedUpcomingPayments, 
      active_loans_count: activeLoansCount,
      total_remaining_balance: totalRemainingBalance,
      total_upcoming_payments_amount: totalUpcomingPaymentsAmount,
    };

    res.status(200).json({
      success: true,
      data: clientDetailsData,
    });

  } catch (error) {
    console.error("Error fetching client details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client details",
      error: error.message,
    });
  }
};
