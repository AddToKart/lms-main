const pool = require("../db/database");

// Get all loans with optional filtering and client information
exports.getLoans = async (req, res) => {
  try {
    const {
      search,
      status,
      client_id,
      limit = 10,
      page = 1,
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        l.*,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.status as client_status,
        CONCAT(u.username) as approved_by_name
      FROM loans l
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN users u ON l.approved_by = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    // Add search filter
    if (search) {
      query +=
        ' AND (CONCAT(c.first_name, " ", c.last_name) LIKE ? OR l.purpose LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // Add status filter
    if (
      status &&
      [
        "pending",
        "approved",
        "active",
        "paid",
        "defaulted",
        "rejected",
      ].includes(status)
    ) {
      query += " AND l.status = ?";
      queryParams.push(status);
    }

    // Add client filter
    if (client_id) {
      query += " AND l.client_id = ?";
      queryParams.push(client_id);
    }

    // Add sorting
    const validSortFields = [
      "created_at",
      "loan_amount",
      "status",
      "client_name",
      "start_date",
    ];
    const sortField = validSortFields.includes(sort_by)
      ? sort_by
      : "created_at";
    const order = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    if (sortField === "client_name") {
      query += ` ORDER BY CONCAT(c.first_name, ' ', c.last_name) ${order}`;
    } else {
      query += ` ORDER BY l.${sortField} ${order}`;
    }

    // Add pagination
    query += " LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    // Execute query
    const [loans] = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM loans l
      LEFT JOIN clients c ON l.client_id = c.id
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery +=
        ' AND (CONCAT(c.first_name, " ", c.last_name) LIKE ? OR l.purpose LIKE ?)';

      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (
      status &&
      [
        "pending",
        "approved",
        "active",
        "paid",
        "defaulted",
        "rejected",
      ].includes(status)
    ) {
      countQuery += " AND l.status = ?";
      countParams.push(status);
    }

    if (client_id) {
      countQuery += " AND l.client_id = ?";
      countParams.push(client_id);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        loans,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loans",
      error: error.message,
    });
  }
};

// Get loan statistics
exports.getLoanStats = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_loans,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_loans,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_loans,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as completed_loans,
        SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) as defaulted_loans,
        SUM(loan_amount) as total_amount,
        AVG(loan_amount) as average_amount,
        AVG(interest_rate) as average_interest_rate
      FROM loans
    `);

    res.status(200).json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error("Error fetching loan stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan statistics",
      error: error.message,
    });
  }
};

// Get active loans for payment form dropdown
exports.getActiveLoans = async (req, res) => {
  try {
    const query = `
      SELECT 
        l.id,
        l.loan_amount,
        l.remaining_balance,
        l.status,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        c.email as client_email,
        c.id as client_id
      FROM loans l
      LEFT JOIN clients c ON l.client_id = c.id
      WHERE l.status IN ('active', 'approved')
      ORDER BY c.first_name, c.last_name
    `;

    const [loans] = await pool.query(query);

    res.status(200).json({
      success: true,
      data: loans,
    });
  } catch (error) {
    console.error("Error fetching active loans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active loans",
      error: error.message,
    });
  }
};

// Get loan by ID
exports.getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    const [loans] = await pool.query(
      `
      SELECT 
        l.*,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        c.email as client_email,
        c.phone as client_phone,
        CONCAT(u.username) as approved_by_name
      FROM loans l
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN users u ON l.approved_by = u.id
      WHERE l.id = ?
    `,
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: loans[0],
    });
  } catch (error) {
    console.error("Error fetching loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan",
      error: error.message,
    });
  }
};

// Create new loan
exports.createLoan = async (req, res) => {
  try {
    const {
      client_id,
      loan_amount,
      interest_rate,
      term_months,
      purpose,
      start_date,
    } = req.body;

    // Calculate end date
    const startDate = new Date(start_date);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + term_months);

    const [result] = await pool.query(
      `
      INSERT INTO loans (
        client_id, loan_amount, interest_rate, term_months, 
        purpose, start_date, end_date, status, remaining_balance, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())
    `,
      [
        client_id,
        loan_amount,
        interest_rate,
        term_months,
        purpose,
        start_date,
        endDate.toISOString().split("T")[0],
        loan_amount,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Loan created successfully",
      data: { id: result.insertId },
    });
  } catch (error) {
    console.error("Error creating loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create loan",
      error: error.message,
    });
  }
};

// Update loan
exports.updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const fields = Object.keys(updates).filter((key) => key !== "id");
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => updates[field]);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    await pool.query(
      `UPDATE loans SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id]
    );

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
    });
  } catch (error) {
    console.error("Error updating loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update loan",
      error: error.message,
    });
  }
};

// Approve loan
exports.approveLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_amount, notes } = req.body;

    await pool.query(
      `UPDATE loans SET 
        status = 'approved', 
        approved_amount = ?, 
        approval_notes = ?, 
        approved_by = ?, 
        approval_date = NOW(),
        updated_at = NOW()
      WHERE id = ?`,
      [approved_amount, notes, req.user.id, id]
    );

    res.status(200).json({
      success: true,
      message: "Loan approved successfully",
    });
  } catch (error) {
    console.error("Error approving loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve loan",
      error: error.message,
    });
  }
};

// Reject loan
exports.rejectLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    await pool.query(
      `UPDATE loans SET 
        status = 'rejected', 
        approval_notes = ?, 
        approved_by = ?, 
        approval_date = NOW(),
        updated_at = NOW()
      WHERE id = ?`,
      [notes, req.user.id, id]
    );

    res.status(200).json({
      success: true,
      message: "Loan rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject loan",
      error: error.message,
    });
  }
};

// Delete loan
exports.deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM loans WHERE id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Loan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete loan",
      error: error.message,
    });
  }
};
