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

    // If status is being set to 'active', ensure next_due_date is set correctly.
    if (updates.status === 'active') {
      let startDateToUseString;
      if (updates.start_date) {
        const startDate = new Date(updates.start_date);
        const year = startDate.getFullYear();
        const month = ('0' + (startDate.getMonth() + 1)).slice(-2);
        const day = ('0' + startDate.getDate()).slice(-2);
        startDateToUseString = `${year}-${month}-${day}`;
      } else {
        // Fetch the loan's start_date from DB if not provided in the update
        const [loanRecord] = await pool.query("SELECT start_date FROM loans WHERE id = ?", [id]);
        if (loanRecord.length === 0) {
          return res.status(404).json({ success: false, message: "Loan not found for fetching start_date when activating." });
        }
        if (!loanRecord[0].start_date) {
            return res.status(400).json({ success: false, message: "Loan start_date is missing in the database. Cannot activate and set next_due_date." });
        }
        // Assuming start_date from DB is already in 'YYYY-MM-DD' or a compatible format for new Date()
        const dbStartDate = new Date(loanRecord[0].start_date);
        const year = dbStartDate.getFullYear();
        const month = ('0' + (dbStartDate.getMonth() + 1)).slice(-2);
        const day = ('0' + dbStartDate.getDate()).slice(-2);
        startDateToUseString = `${year}-${month}-${day}`;
      }
      updates.next_due_date = startDateToUseString; // Override or add next_due_date to the updates object
    }

    // Build dynamic update query from the potentially modified 'updates' object
    const fields = Object.keys(updates).filter(key => key !== 'id');
    
    const values = fields.map(field => {
      // Ensure specific date fields are formatted to YYYY-MM-DD if they are part of the update and are valid dates
      if ((field === 'start_date' || field === 'end_date' || field === 'next_due_date' || field === 'disbursement_date' || field === 'first_payment_date') && updates[field]) {
        try {
            // Check if it's already in YYYY-MM-DD format to avoid re-processing
            if (/^\d{4}-\d{2}-\d{2}$/.test(updates[field])) {
                return updates[field];
            }
            const date = new Date(updates[field]);
            // Check if date is valid after parsing
            if (isNaN(date.getTime())) {
                // If date is invalid, and it's a critical date field, consider error or keep original
                // For now, let's assume if it's not parsable, it might be null or intentionally non-date string
                return updates[field]; 
            }
            const year = date.getFullYear();
            const month = ('0' + (date.getMonth() + 1)).slice(-2);
            const day = ('0' + date.getDate()).slice(-2);
            return `${year}-${month}-${day}`;
        } catch (e) {
            // If any error during date parsing/formatting, return original value to avoid breaking query
            // Log this error for debugging
            console.warn(`Could not format date for field ${field} with value ${updates[field]}:`, e);
            return updates[field]; 
        }
      }
      return updates[field];
    });

    const setClause = fields.map(field => `${field} = ?`).join(", ");

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
