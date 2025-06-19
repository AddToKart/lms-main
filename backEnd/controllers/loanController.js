const pool = require("../db/database");

// Utility to format date string to YYYY-MM-DD or return null
const formatDateToDb = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null; // Invalid date
    return date.toISOString().split("T")[0];
  } catch (e) {
    return null; // Error during parsing
  }
};

// Helper function to calculate monthly installment
const calculateInstallment = (principal, annualInterestRate, termMonths) => {
  if (principal <= 0 || annualInterestRate < 0 || termMonths <= 0) return 0;
  if (annualInterestRate === 0)
    return parseFloat((principal / termMonths).toFixed(2));

  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numerator =
    principal *
    monthlyInterestRate *
    Math.pow(1 + monthlyInterestRate, termMonths);
  const denominator = Math.pow(1 + monthlyInterestRate, termMonths) - 1;
  if (denominator === 0) return parseFloat((principal / termMonths).toFixed(2)); // Fallback

  return parseFloat((numerator / denominator).toFixed(2));
};

// Create a new loan
const createLoan = async (req, res) => {
  console.log(
    "[LoanController] createLoan: Received body:",
    JSON.stringify(req.body, null, 2)
  );
  try {
    let {
      client_id,
      loan_amount,
      interest_rate,
      term_months,
      purpose,
      payment_frequency, // Expecting 'monthly', 'weekly', etc.
      start_date, // ADD THIS LINE - it was missing
    } = req.body;

    // --- Input Validation and Sanitization ---
    const errors = [];

    // client_id
    client_id = parseInt(client_id, 10);
    if (isNaN(client_id) || client_id <= 0) {
      errors.push("Client ID must be a positive integer.");
    }

    // loan_amount
    loan_amount = parseFloat(loan_amount);
    if (isNaN(loan_amount) || loan_amount <= 0) {
      errors.push("Loan amount must be a positive number.");
    }

    // interest_rate
    interest_rate = parseFloat(interest_rate);
    if (isNaN(interest_rate) || interest_rate < 0) {
      errors.push("Interest rate must be a non-negative number.");
    }

    // term_months
    term_months = parseInt(term_months, 10);
    if (isNaN(term_months) || term_months <= 0) {
      errors.push("Term (months) must be a positive integer.");
    }

    // payment_frequency: Default to 'monthly' if not provided or empty
    if (!payment_frequency || String(payment_frequency).trim() === "") {
      payment_frequency = "monthly";
    } else {
      const validFrequencies = [
        "monthly",
        "weekly",
        "bi-weekly",
        "quarterly",
        "annually",
      ]; // Add more as needed
      if (!validFrequencies.includes(String(payment_frequency).toLowerCase())) {
        errors.push(
          `Invalid payment frequency. Allowed values: ${validFrequencies.join(
            ", "
          )}.`
        );
      } else {
        payment_frequency = String(payment_frequency).toLowerCase();
      }
    }

    // purpose: Optional, ensure it's a string or null
    purpose = purpose ? String(purpose).trim() : null;

    // start_date: Optional, will be formatted
    const formattedStartDate = formatDateToDb(start_date);
    if (start_date && !formattedStartDate) {
      // If start_date was provided but invalid
      errors.push(
        "Invalid start date format. Please use YYYY-MM-DD or ensure it's a valid date."
      );
    }

    if (errors.length > 0) {
      console.warn("[LoanController] createLoan: Validation errors:", errors);
      return res.status(400).json({
        success: false,
        message: "Validation failed. Please check the provided data.",
        errors: errors,
      });
    }
    // --- End Validation ---

    let next_due_date_val = null;
    if (formattedStartDate && payment_frequency) {
      const startDateObj = new Date(formattedStartDate);
      // Ensure startDateObj is valid before date manipulations
      if (!isNaN(startDateObj.getTime())) {
        if (payment_frequency === "monthly") {
          startDateObj.setMonth(startDateObj.getMonth() + 1);
        } else if (payment_frequency === "weekly") {
          startDateObj.setDate(startDateObj.getDate() + 7);
        } // Add other frequencies if needed (bi-weekly, etc.)
        next_due_date_val = startDateObj.toISOString().split("T")[0];
      } else {
        // This case should ideally be caught by formattedStartDate validation, but as a safeguard:
        console.warn(
          "[LoanController] createLoan: Could not parse formattedStartDate for next_due_date calculation."
        );
      }
    }

    const initialRemainingBalance = loan_amount; // Already parsed to float

    const insertValues = [
      client_id,
      loan_amount,
      interest_rate,
      term_months,
      purpose,
      formattedStartDate,
      payment_frequency, // Now guaranteed to be a valid string or the default
      next_due_date_val,
      initialRemainingBalance,
      null, // approved_amount is null initially
    ];

    console.log(
      "[LoanController] createLoan: Preparing to insert with values:",
      JSON.stringify(insertValues, null, 2)
    );

    const [result] = await pool.execute(
      `INSERT INTO loans (client_id, loan_amount, interest_rate, term_months, purpose, start_date, status, payment_frequency, next_due_date, remaining_balance, approved_amount) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      insertValues
    );

    const insertedLoanId = result.insertId;
    const [newLoan] = await pool.execute(
      `SELECT l.*, CONCAT(c.first_name, ' ', c.last_name) as client_name 
         FROM loans l
         JOIN clients c ON l.client_id = c.id 
         WHERE l.id = ?`,
      [insertedLoanId]
    );

    res.status(201).json({
      success: true,
      message: "Loan created successfully.",
      data: newLoan[0],
    });
  } catch (error) {
    console.error("[LoanController] Error in createLoan:", error); // THIS IS THE KEY LOG ON YOUR BACKEND
    console.error("Error Code:", error.code); // Log MySQL error code if available
    console.error("Error Message:", error.message); // Log MySQL error message

    if (
      error.code === "ER_NO_REFERENCED_ROW" ||
      error.code === "ER_NO_REFERENCED_ROW_2"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID. Client does not exist.",
        error: error.message,
      });
    }
    // ER_TRUNCATED_WRONG_VALUE_FOR_FIELD can be for dates or numbers
    if (error.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD") {
      let fieldMessage = "Invalid data format for one of the fields.";
      if (error.message.toLowerCase().includes("date"))
        fieldMessage = "Invalid date format. Please use YYYY-MM-DD.";
      if (
        error.message.toLowerCase().includes("decimal") ||
        error.message.toLowerCase().includes("integer")
      )
        fieldMessage = "Invalid numeric value for a currency or count field.";
      return res
        .status(400)
        .json({ success: false, message: fieldMessage, error: error.message });
    }
    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        success: false,
        message:
          "Data too long for one of the fields (e.g., purpose, payment frequency).",
        error: error.message,
      });
    }
    // Generic error for other cases
    res.status(500).json({
      success: false,
      message: "Failed to create loan due to a server error.",
      error: error.message, // Send the actual error message to the client for debugging
    });
  }
};

// Replace getLoansLogic with getLoans
const getLoans = async (req, res) => {
  try {
    console.log("[LoanController] GET /api/loans - Request received");
    console.log("[LoanController] Query params:", req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 1000);
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const client_id = req.query.client_id
      ? parseInt(req.query.client_id)
      : null;

    // Use stored procedures with proper result extraction
    const [countResult] = await pool.execute(
      "CALL sp_get_loans_count(?, ?, ?)",
      [search || null, status || null, client_id]
    );
    const total = countResult[0]?.[0]?.total || 0;

    const [loansResult] = await pool.execute(
      "CALL sp_get_loans(?, ?, ?, ?, ?)",
      [limit, offset, search || null, status || null, client_id]
    );
    const loans = loansResult[0] || [];

    const totalPages = Math.ceil(Number(total) / limit);

    res.json({
      success: true,
      data: {
        loans: loans,
        pagination: {
          total: Number(total),
          page: page,
          limit: limit,
          totalPages: totalPages,
        },
      },
    });
  } catch (error) {
    console.error("[LoanController] Error in getLoans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve loans",
      error: error.message,
    });
  }
};

// Get loan by ID
const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("[LoanController] Calling sp_get_loan_by_id for ID:", id);
    const [result] = await pool.execute("CALL sp_get_loan_by_id(?)", [id]);

    console.log(
      "[LoanController] Loan by ID result structure:",
      JSON.stringify(result, null, 2)
    );

    // Extract loan data from nested result structure
    const loans = result[0] || [];

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
    console.error("[LoanController] Error fetching loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan",
      error: error.message,
    });
  }
};

// Update a loan
const updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      loan_amount,
      interest_rate,
      term_months,
      purpose,
      payment_frequency,
      status,
    } = req.body;

    console.log("[LoanController] Calling sp_update_loan...");
    const [result] = await pool.execute(
      "CALL sp_update_loan(?, ?, ?, ?, ?, ?, ?)",

      [
        id,
        loan_amount,
        interest_rate,
        term_months,
        purpose,
        payment_frequency,
        status,
      ]
    );

    console.log(
      "[LoanController] Update result structure:",
      JSON.stringify(result, null, 2)
    );

    // Extract affected rows from nested result structure
    const affectedRows = result[0]?.[0]?.affected_rows || 0;

    if (affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
    });
  } catch (error) {
    console.error("[LoanController] Error updating loan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update loan",
      error: error.message,
    });
  }
};

// Delete a loan
const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[LoanController] Delete Loan - ID:", id);

    // Optional: Check for associated payments before deleting or rely on DB cascade
    const [result] = await pool.execute("DELETE FROM loans WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }
    res.json({ success: true, message: "Loan deleted successfully" });
  } catch (error) {
    console.error("[LoanController] Error in deleteLoan:", error);
    // Check for foreign key constraint errors if payments exist and ON DELETE is RESTRICT
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete loan. It has associated payments. Please delete payments first or ensure cascading delete is set up.",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to delete loan",
      error: error.message,
    });
  }
};

// Approve a loan
const approveLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_amount, notes } = req.body;

    if (!req.user || req.user.id === undefined) {
      // Check if req.user and req.user.id exist
      console.error(
        "[LoanController] Approve Loan - Error: req.user or req.user.id is undefined. User not authenticated properly."
      );
      return res.status(401).json({
        success: false,
        message:
          "User not authenticated or user ID missing. Cannot approve loan.",
      });
    }
    const approved_by = req.user.id;

    console.log(
      `[LoanController] Approve Loan - ID: ${id}, Approved Amount: ${approved_amount}, Approved By: ${approved_by}, Notes: "${notes}"`
    );

    if (
      approved_amount === undefined ||
      approved_amount === null ||
      parseFloat(approved_amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid 'approved_amount' is required.",
      });
    }

    const parsedApprovedAmount = parseFloat(approved_amount);

    const [loanResult] = await pool.execute(
      "SELECT * FROM loans WHERE id = ?",
      [id]
    );
    if (loanResult.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found." });
    }
    const loan = loanResult[0];

    if (loan.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Loan is already '${loan.status}' and cannot be approved.`,
      });
    }

    const calculatedInstallment = calculateInstallment(
      parsedApprovedAmount,
      parseFloat(loan.interest_rate),
      parseInt(loan.term_months)
    );
    const approval_date_val = new Date().toISOString().split("T")[0];

    const currentStartDate = loan.start_date ? new Date(loan.start_date) : null;
    const approvalDateObj = new Date(approval_date_val);

    const effective_start_date =
      !currentStartDate || currentStartDate < approvalDateObj
        ? approval_date_val
        : currentStartDate.toISOString().split("T")[0];

    let next_due_date_val = null;
    if (effective_start_date) {
      const startDateObj = new Date(effective_start_date);
      const paymentFrequency = loan.payment_frequency || "monthly"; // Default to monthly if null or undefined

      if (paymentFrequency === "monthly") {
        startDateObj.setMonth(startDateObj.getMonth() + 1);
      } else if (paymentFrequency === "weekly") {
        startDateObj.setDate(startDateObj.getDate() + 7);
      } else {
        // Fallback for other/unknown frequencies (e.g., treat as monthly)
        startDateObj.setMonth(startDateObj.getMonth() + 1);
        console.warn(
          `[LoanController] Unknown or null payment_frequency '${loan.payment_frequency}' for loan ID ${id}. Defaulting next_due_date calculation to monthly.`
        );
      }
      next_due_date_val = startDateObj.toISOString().split("T")[0];
    }

    const [result] = await pool.execute(
      `UPDATE loans SET 
        status = 'approved', 
        approved_amount = ?, 
        remaining_balance = ?, 
        installment_amount = ?,
        approval_date = ?, 
        approved_by = ?, 
        approval_notes = ?,
        start_date = ?,
        next_due_date = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'pending'`,
      [
        parsedApprovedAmount,
        parsedApprovedAmount,
        calculatedInstallment,
        approval_date_val,
        approved_by,
        notes || null,
        effective_start_date,
        next_due_date_val,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      // This could happen if the loan was not found OR its status was not 'pending'
      return res.status(400).json({
        success: false,
        message:
          "Loan could not be approved (it may have been already processed, not found, or not in 'pending' status).",
      });
    }

    const [updatedLoan] = await pool.execute(
      `SELECT l.*, CONCAT(c.first_name, ' ', c.last_name) as client_name 
         FROM loans l
         JOIN clients c ON l.client_id = c.id 
         WHERE l.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Loan approved successfully",
      data: updatedLoan[0],
    });
  } catch (error) {
    console.error("[LoanController] Error in approveLoan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve loan due to a server error.",
      error: error.message,
    });
  }
};

// Reject a loan
const rejectLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const approved_by = req.user.id; // User performing the rejection
    console.log(
      `[LoanController] Reject Loan - ID: ${id}, Rejected By: ${approved_by}`
    );

    const [result] = await pool.execute(
      `UPDATE loans SET 
        status = 'rejected', 
        approval_date = CURDATE(), 
        approved_by = ?, 
        approval_notes = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'pending'`,
      [approved_by, notes, id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Loan could not be rejected (already processed or not found).",
      });
    }

    const [updatedLoan] = await pool.execute(
      `SELECT l.*, CONCAT(c.first_name, ' ', c.last_name) as client_name 
         FROM loans l
         JOIN clients c ON l.client_id = c.id 
         WHERE l.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Loan rejected successfully",
      data: updatedLoan[0],
    });
  } catch (error) {
    console.error("[LoanController] Error in rejectLoan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject loan",
      error: error.message,
    });
  }
};

// Get loan statistics
const getLoanStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        COUNT(*) AS total_loans,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_loans,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_loans,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_loans,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_loans,
        SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) AS defaulted_loans,
        COALESCE(SUM(loan_amount), 0) AS total_loan_amount,
        COALESCE(SUM(remaining_balance), 0) AS total_outstanding
      FROM loans
    `);

    const stats = {
      total_loans: Number(rows[0].total_loans || 0),
      pending_loans: Number(rows[0].pending_loans || 0),
      approved_loans: Number(rows[0].approved_loans || 0),
      active_loans: Number(rows[0].active_loans || 0),
      completed_loans: Number(rows[0].completed_loans || 0),
      defaulted_loans: Number(rows[0].defaulted_loans || 0),
      total_loan_amount: Number(rows[0].total_loan_amount || 0),
      total_outstanding: Number(rows[0].total_outstanding || 0),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching loan stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve loan statistics",
      error: error.message,
    });
  }
};

// Get clients with loans
const getClientsWithLoans = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        COUNT(l.id) as loan_count,
        SUM(CASE WHEN l.status = 'active' THEN l.remaining_balance ELSE 0 END) as total_outstanding
      FROM clients c
      JOIN loans l ON c.id = l.client_id
      GROUP BY c.id, c.first_name, c.last_name, c.email
      ORDER BY c.last_name, c.first_name
    `;

    const [clients] = await pool.execute(query);

    res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error("Error fetching clients with loans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clients with loans",
      error: error.message,
    });
  }
};

module.exports = {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
  approveLoan,
  rejectLoan,
  getLoanStats,
  getClientsWithLoans,
  rejectLoan,
  getLoanStats,
  getClientsWithLoans,
};
