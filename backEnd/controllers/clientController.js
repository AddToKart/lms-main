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

    // Use stored procedures with proper result extraction
    console.log("[ClientController] Calling sp_get_clients_count...");
    const [countResult] = await pool.execute(
      "CALL sp_get_clients_count(?, ?)", // Stored procedure to get client count
      [search || null, status || null] // Parameters: search term and status
    );

    console.log(
      "[ClientController] Count result structure:",
      JSON.stringify(countResult, null, 2)
    );

    // Extract total from the nested result structure
    const total = countResult[0]?.[0]?.total || 0;
    console.log(
      "[ClientController] Extracted total:",
      total,
      "Type:",
      typeof total
    );

    console.log("[ClientController] Calling sp_get_clients...");
    const [clientsResult] = await pool.execute(
      "CALL sp_get_clients(?, ?, ?, ?)", // Stored procedure to get clients
      [limit, offset, search || null, status || null] // Parameters: limit, offset, search term, and status
    );

    console.log(
      "[ClientController] Clients result structure:",
      JSON.stringify(clientsResult, null, 2)
    );

    // Extract clients from the nested result structure
    const clients = clientsResult[0] || [];
    console.log("[ClientController] Extracted clients:", clients.length);

    const totalPages = Math.ceil(Number(total) / limit);

    const response = {
      success: true,
      data: {
        clients: clients,
        total: Number(total), // Ensure it's a number
        page: page,
        limit: limit,
        totalPages: totalPages,
      },
    };

    console.log("[ClientController] Sending response:", {
      success: response.success,
      clientCount: response.data.clients.length,
      total: response.data.total,
      totalType: typeof response.data.total,
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

    console.log("[ClientController] Calling sp_get_client_by_id for ID:", id);
    const [result] = await pool.execute("CALL sp_get_client_by_id(?)", [id]);

    console.log(
      "[ClientController] Client by ID result structure:",
      JSON.stringify(result, null, 2)
    );

    // Extract client data from nested result structure
    const clients = result[0] || [];

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

    console.log("[ClientController] Calling sp_create_client...");
    const [result] = await pool.execute(
      "CALL sp_create_client(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", // Stored procedure to create client
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

    console.log(
      "[ClientController] Create result structure:",
      JSON.stringify(result, null, 2)
    );

    // Extract ID from nested result structure
    const insertId = result[0]?.[0]?.id || result.insertId;

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: { id: insertId },
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
      status,
    } = req.body;

    console.log("[ClientController] Calling sp_update_client...");
    const [result] = await pool.execute(
      "CALL sp_update_client(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", // Stored procedure to update client
      [
        id,
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

    console.log(
      "[ClientController] Update result structure:",
      JSON.stringify(result, null, 2)
    );

    // Extract affected rows from nested result structure
    const affectedRows = result[0]?.[0]?.affected_rows || 0;

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

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

    console.log("[ClientController] Calling sp_delete_client...");
    const [result] = await pool.execute("CALL sp_delete_client(?)", [id]);

    console.log(
      "[ClientController] Delete result structure:",
      JSON.stringify(result, null, 2)
    );

    // Extract affected rows from nested result structure
    const affectedRows = result[0]?.[0]?.affected_rows || 0;

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

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

    console.log(
      `[ClientController] getClientDetails called for client ID: ${id}`
    );

    // 1. Fetch basic client information
    const [clientRows] = await pool.query(
      "SELECT * FROM clients WHERE id = ?",
      [id]
    );
    if (clientRows.length === 0) {
      console.log(`[ClientController] Client not found for ID: ${id}`);
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }
    const client = clientRows[0];
    console.log(
      `[ClientController] Found client:`,
      client.first_name,
      client.last_name
    );

    // 2. Fetch all loans for the client
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

    console.log(
      `[ClientController] Found ${loansFromDB.length} loans for client ${id}`
    );

    const processedLoans = loansFromDB.map((loan) => ({
      id: loan.id.toString(),
      loan_type: loan.purpose || "Personal Loan",
      loan_amount: parseFloat(loan.loan_amount || 0),
      approved_amount: parseFloat(loan.approved_amount || 0),
      remaining_balance: parseFloat(loan.remaining_balance || 0),
      interest_rate: parseFloat(loan.interest_rate || 0),
      term_months: parseInt(loan.term_months || 0, 10),
      start_date: loan.start_date,
      end_date: loan.end_date,
      status: loan.status || "Unknown",
      next_due_date: loan.next_due_date,
    }));

    // Show all loans, not just active ones, but filter for statistics
    const activeLoans = processedLoans.filter((loan) => {
      const statusLowerCase = loan.status ? loan.status.toLowerCase() : "";
      return (
        statusLowerCase === "active" ||
        statusLowerCase === "approved" ||
        statusLowerCase === "overdue" ||
        statusLowerCase === "pending"
      );
    });

    console.log(`[ClientController] ${activeLoans.length} active loans found`);

    // 3. Generate upcoming payments from active loans
    const processedUpcomingPayments = activeLoans
      .filter((loan) => {
        const statusLowerCase = loan.status ? loan.status.toLowerCase() : "";
        return (
          (statusLowerCase === "active" ||
            statusLowerCase === "approved" ||
            statusLowerCase === "overdue") &&
          loan.next_due_date &&
          loan.remaining_balance > 0
        );
      })
      .map((loan) => {
        // Calculate installment amount
        const installmentAmount =
          loan.approved_amount && loan.term_months
            ? loan.approved_amount / loan.term_months
            : loan.loan_amount && loan.term_months
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

    console.log(
      `[ClientController] ${processedUpcomingPayments.length} upcoming payments found`
    );

    // 4. Calculate summary statistics
    const activeLoanCount = activeLoans.length;
    const totalRemainingBalance = activeLoans.reduce(
      (sum, loan) => sum + loan.remaining_balance,
      0
    );
    const totalUpcomingPaymentsAmount = processedUpcomingPayments.reduce(
      (sum, payment) => sum + payment.amount_due,
      0
    );

    // 5. Build response - return all loans for display
    const responseData = {
      ...client,
      loans: processedLoans, // Return all loans, not just active ones
      upcoming_payments: processedUpcomingPayments,
      active_loans_count: activeLoanCount,
      total_remaining_balance: parseFloat(totalRemainingBalance.toFixed(2)),
      total_upcoming_payments_amount: parseFloat(
        totalUpcomingPaymentsAmount.toFixed(2)
      ),
    };

    console.log(
      `[ClientController] Sending response with ${responseData.loans.length} loans and ${responseData.upcoming_payments.length} upcoming payments`
    );

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("[ClientController] Error fetching client details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client details",
      error: error.message,
    });
  }
};
