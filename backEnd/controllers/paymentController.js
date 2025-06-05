const pool = require("../db/database");

// Get all payments with pagination and filtering
const getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const payment_method = req.query.payment_method || "";
    const loan_id = req.query.loan_id || "";
    const date_from = req.query.date_from || "";
    const date_to = req.query.date_to || "";

    // Build WHERE conditions for MySQL
    let whereConditions = [];
    let queryParams = [];

    if (search) {
      whereConditions.push(
        `(CONCAT(c.first_name, ' ', c.last_name) LIKE ? OR p.reference_number LIKE ?)`
      );
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereConditions.push(`p.status = ?`);
      queryParams.push(status);
    }

    if (payment_method) {
      whereConditions.push(`p.payment_method = ?`);
      queryParams.push(payment_method);
    }

    if (loan_id) {
      whereConditions.push(`p.loan_id = ?`);
      queryParams.push(loan_id);
    }

    if (date_from) {
      whereConditions.push(`p.payment_date >= ?`);
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push(`p.payment_date <= ?`);
      queryParams.push(date_to);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Main query to get payments
    const query = `
      SELECT 
        p.*,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        c.email as client_email,
        l.loan_amount,
        u.username as processed_by_name
      FROM payments p
      LEFT JOIN loans l ON p.loan_id = l.id
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN users u ON p.processed_by = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const [payments] = await pool.query(query, queryParams);

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      LEFT JOIN loans l ON p.loan_id = l.id
      LEFT JOIN clients c ON l.client_id = c.id
      ${whereClause}
    `;

    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// Get payment statistics
const getPaymentStats = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payments,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
        AVG(amount) as average_payment
      FROM payments
    `);

    res.status(200).json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment statistics",
      error: error.message,
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [payments] = await pool.query(
      `
      SELECT 
        p.*,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        c.email as client_email,
        l.loan_amount,
        u.username as processed_by_name
      FROM payments p
      LEFT JOIN loans l ON p.loan_id = l.id
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN users u ON p.processed_by = u.id
      WHERE p.id = ?
    `,
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payments[0],
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

// Create new payment
const createPayment = async (req, res) => {
  try {
    const {
      loan_id,
      amount,
      payment_date,
      payment_method,
      reference_number,
      notes,
    } = req.body;

    // Log user information for debugging
    console.log("User performing payment creation:", req.user);

    if (!req.user || !req.user.id) {
      console.error("Error creating payment: User ID is missing from request.");
      return res.status(401).json({
        success: false,
        message:
          "User authentication details are missing. Cannot process payment.",
      });
    }

    // Fetch client_id from the loan
    const [loanDetails] = await pool.query(
      "SELECT client_id FROM loans WHERE id = ?",
      [loan_id]
    );

    if (loanDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan not found. Cannot record payment.",
      });
    }
    const client_id = loanDetails[0].client_id;

    const [result] = await pool.query(
      `
      INSERT INTO payments (
        loan_id, client_id, amount, payment_date, payment_method, 
        reference_number, notes, processed_by, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW())
    `,
      [
        loan_id,
        client_id, // Added client_id here
        amount,
        payment_date,
        payment_method,
        reference_number || null,
        notes || null,
        req.user.id,
      ]
    );

    // The trigger "update_remaining_balance_after_payment" should handle this.
    // So, the manual update below is removed.
    /*
    await pool.query(
      `
      UPDATE loans 
      SET remaining_balance = remaining_balance - ?
      WHERE id = ?
    `,
      [amount, loan_id]
    );
    */

    const [newPayment] = await pool.query(
      `
      SELECT 
        p.*,
        CONCAT(c.first_name, ' ', c.last_name) as client_name
      FROM payments p
      LEFT JOIN loans l ON p.loan_id = l.id
      LEFT JOIN clients c ON l.client_id = c.id
      WHERE p.id = ?
    `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: newPayment[0],
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record payment",
      error: error.message,
    });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;

    const fields = Object.keys(updateData).filter(
      (key) => updateData[key] !== undefined
    );

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => updateData[field]);

    await pool.query(
      `UPDATE payments SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id]
    );

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment",
      error: error.message,
    });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Get payment details before deletion to update loan balance
    const [payment] = await pool.query("SELECT * FROM payments WHERE id = ?", [
      id,
    ]);

    if (payment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Delete the payment
    await pool.query("DELETE FROM payments WHERE id = ?", [id]);

    // Update loan remaining balance (add back the payment amount)
    await pool.query(
      "UPDATE loans SET remaining_balance = remaining_balance + ? WHERE id = ?",
      [payment[0].amount, payment[0].loan_id]
    );

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payment",
      error: error.message,
    });
  }
};

// Get payments by loan ID
const getPaymentsByLoan = async (req, res) => {
  try {
    const { loanId } = req.params;

    const [payments] = await pool.query(
      `
      SELECT 
        p.*,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        u.username as processed_by_name
      FROM payments p
      LEFT JOIN loans l ON p.loan_id = l.id
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN users u ON p.processed_by = u.id
      WHERE p.loan_id = ?
      ORDER BY p.payment_date DESC
    `,
      [loanId]
    );

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Error fetching payments by loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments for loan",
      error: error.message,
    });
  }
};

module.exports = {
  getPayments,
  getPaymentStats,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByLoan,
};
