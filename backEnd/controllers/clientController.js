const pool = require("../db/database");

// Get all clients with filtering and pagination
exports.getClients = async (req, res) => {
  try {
    console.log("[ClientController] GET /api/clients - Request received");
    console.log("[ClientController] Query params:", req.query);
    console.log("[ClientController] User:", req.user?.id);

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 1000); // Allow up to 1000
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";

    console.log("[ClientController] Parsed params:", {
      page,
      limit,
      offset,
      search,
      status,
    });

    // Build the WHERE clause
    let whereClause = "";
    const queryParams = [];

    if (search) {
      whereClause = `WHERE (CONCAT(first_name, ' ', last_name) LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += whereClause ? " AND status = ?" : "WHERE status = ?";
      queryParams.push(status);
    }

    console.log("[ClientController] WHERE clause:", whereClause);
    console.log("[ClientController] Query params:", queryParams);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM clients ${whereClause}`;
    console.log("[ClientController] Count query:", countQuery);

    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = countResult[0].total;

    console.log("[ClientController] Total clients found:", total);

    // Get clients with pagination
    const selectQuery = `
      SELECT id, first_name, last_name, email, phone, address, city, state, 
             postal_code, country, status, created_at, updated_at
      FROM clients 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const selectParams = [...queryParams, limit, offset];
    console.log("[ClientController] Select query:", selectQuery);
    console.log("[ClientController] Select params:", selectParams);

    const [clients] = await pool.execute(selectQuery, selectParams);

    console.log("[ClientController] Clients retrieved:", clients.length);

    const totalPages = Math.ceil(total / limit);

    const response = {
      success: true,
      data: {
        clients: clients,
        total: total,
        page: page,
        limit: limit,
        totalPages: totalPages,
      },
    };

    console.log("[ClientController] Sending response:", {
      success: response.success,
      clientCount: response.data.clients.length,
      total: response.data.total,
      page: response.data.page,
    });

    res.json(response);
  } catch (error) {
    console.error("[ClientController] Error in getClients:", error);
    console.error("[ClientController] Error stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve clients",
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
    const [rows] = await pool.execute(`
      SELECT
        COUNT(*) AS total_clients,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_clients,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive_clients,
        SUM(CASE WHEN status = 'blacklisted' THEN 1 ELSE 0 END) AS blacklisted_clients
      FROM clients
    `);

    // The query returns an array with one object.
    // Ensure all values are numbers, defaulting to 0 if null (e.g., if no clients in a category)
    const stats = {
      total_clients: Number(rows[0].total_clients || 0),
      active_clients: Number(rows[0].active_clients || 0),
      inactive_clients: Number(rows[0].inactive_clients || 0),
      blacklisted_clients: Number(rows[0].blacklisted_clients || 0),
    };

    res.json({
      success: true,
      data: stats, // Ensure 'stats' object is directly under 'data'
    });
  } catch (error) {
    console.error("[ClientController] Error in getClientStats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve client statistics.",
      error: error.message,
    });
  }
};

// Get client details by ID (including loans and upcoming payments)
exports.getClientDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch basic client information
    const [clientRows] = await pool.query(
      "SELECT * FROM clients WHERE id = ?",
      [id]
    );
    if (clientRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }
    const client = clientRows[0];

    // 2. Fetch all loans for the client with proper type mapping
    const [loansFromDB] = await pool.query(
      `
      SELECT 
        id,
        loan_amount,
        approved_amount,
        remaining_balance,
        interest_rate,
        term_months,
        purpose,
        start_date,
        end_date,
        status,
        next_due_date,
        payment_frequency,
        created_at,
        updated_at
      FROM loans 
      WHERE client_id = ? 
      ORDER BY created_at DESC
    `,
      [id]
    );

    const processedLoans = loansFromDB.map((loan) => ({
      id: loan.id.toString(),
      loan_type: loan.purpose || "Personal Loan", // Map purpose to loan_type
      loan_amount: parseFloat(loan.loan_amount || 0),
      approved_amount: parseFloat(loan.approved_amount || 0),
      remaining_balance: parseFloat(loan.remaining_balance || 0),
      interest_rate: parseFloat(loan.interest_rate || 0),
      term_months: parseInt(loan.term_months || 0, 10),
      start_date: loan.start_date,
      end_date: loan.end_date,
      status:
        loan.status === "active"
          ? "Active"
          : loan.status === "paid_off"
          ? "Paid Off"
          : loan.status === "completed"
          ? "Completed"
          : loan.status === "overdue"
          ? "Overdue"
          : loan.status === "pending"
          ? "Pending"
          : loan.status === "defaulted"
          ? "Defaulted"
          : loan.status === "rejected"
          ? "Rejected"
          : loan.status || "Unknown",
      next_due_date: loan.next_due_date,
    }));

    // Filter active loans (exclude paid_off, completed, rejected, defaulted)
    const activeLoans = processedLoans.filter((loan) => {
      const statusLowerCase = loan.status ? loan.status.toLowerCase() : "";
      return (
        statusLowerCase === "active" ||
        statusLowerCase === "overdue" ||
        statusLowerCase === "pending"
      );
    });

    // 3. Generate upcoming payments from active loans' next_due_date only
    const processedUpcomingPayments = activeLoans
      .filter((loan) => {
        const statusLowerCase = loan.status ? loan.status.toLowerCase() : "";
        return (
          (statusLowerCase === "active" || statusLowerCase === "overdue") &&
          loan.next_due_date &&
          loan.remaining_balance > 0
        );
      })
      .map((loan) => {
        // Calculate installment amount - simple division for now
        const installmentAmount =
          loan.loan_amount && loan.term_months
            ? loan.loan_amount / loan.term_months
            : 0;

        // Use the smaller of installment amount or remaining balance
        const amountDue = Math.min(installmentAmount, loan.remaining_balance);

        return {
          loan_id: loan.id,
          loan_type: loan.loan_type,
          amount_due: parseFloat(amountDue.toFixed(2)),
          due_date: loan.next_due_date,
        };
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    // 4. Calculate summary statistics using only active loans
    const activeLoanCount = activeLoans.length;

    const totalRemainingBalance = activeLoans.reduce(
      (sum, loan) => sum + loan.remaining_balance,
      0
    );

    const totalUpcomingPaymentsAmount = processedUpcomingPayments.reduce(
      (sum, payment) => {
        return sum + payment.amount_due;
      },
      0
    );

    // 5. Build response - return activeLoans instead of all loans for the loans array
    const responseData = {
      ...client,
      loans: activeLoans, // Only return active loans in the loans array
      upcoming_payments: processedUpcomingPayments,
      active_loans_count: activeLoanCount,
      total_remaining_balance: parseFloat(totalRemainingBalance.toFixed(2)),
      total_upcoming_payments_amount: parseFloat(
        totalUpcomingPaymentsAmount.toFixed(2)
      ),
    };

    res.status(200).json({
      success: true,
      data: responseData,
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
