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
      start_date,
      payment_frequency, // Expecting 'monthly', 'weekly', etc.
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
      // 0% interest is possible
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

// Get all loans (logic shared by getLoans and getClientsWithLoans)
const getLoansLogic = async (req, res, endpointName = "getLoans") => {
  try {
    console.log(`[LoanController] ${endpointName} - Request received`);
    console.log(`[LoanController] Query params:`, req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const client_id = req.query.client_id || "";

    let whereClause = "WHERE 1=1";
    const queryParams = [];

    if (search) {
      whereClause +=
        " AND (l.id LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR l.purpose LIKE ? OR c.email LIKE ?)";
      const searchTerm = `%${search}%`;
      queryParams.push(
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm
      );
    }
    if (status) {
      whereClause += " AND l.status = ?";
      queryParams.push(status);
    }
    if (client_id) {
      console.log(`[LoanController] Filtering by client_id: ${client_id}`);
      whereClause += " AND l.client_id = ?";
      queryParams.push(client_id);
    }

    console.log(`[LoanController] WHERE clause: ${whereClause}`);
    console.log(
      `[LoanController] Query params: ${JSON.stringify(queryParams)}`
    );

    const countQuery = `SELECT COUNT(*) as total FROM loans l JOIN clients c ON l.client_id = c.id ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = countResult[0].total;

    console.log(`[LoanController] Total loans found: ${total}`);

    const selectQuery = `
      SELECT 
        l.id, l.client_id, CONCAT(c.first_name, ' ', c.last_name) as client_name, 
        c.email as client_email, c.phone as client_phone,
        l.loan_amount, l.approved_amount, l.interest_rate, l.term_months, l.purpose,
        l.start_date, l.end_date, l.status, l.next_due_date, l.payment_frequency,
        l.remaining_balance, l.installment_amount,
        l.approval_date, l.approval_notes, l.approved_by,
        l.created_at, l.updated_at,
        u.username as approved_by_username
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      LEFT JOIN users u ON l.approved_by = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [loans] = await pool.execute(selectQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    console.log(`[LoanController] Loans retrieved: ${loans.length}`);
    if (loans.length > 0) {
      console.log(`[LoanController] First loan status: ${loans[0].status}`);
    }

    const loansWithInstallments = loans.map((loan) => {
      let installment = loan.installment_amount;
      if (
        installment === null ||
        installment === undefined ||
        parseFloat(installment) === 0
      ) {
        const principal = parseFloat(loan.approved_amount || loan.loan_amount);
        const annualInterestRate = parseFloat(loan.interest_rate);
        const termMonths = parseInt(loan.term_months);
        installment = calculateInstallment(
          principal,
          annualInterestRate,
          termMonths
        );
      }
      return {
        ...loan,
        installment_amount: parseFloat(installment).toFixed(2),
      };
    });

    res.json({
      success: true,
      data: {
        loans: loansWithInstallments,
        total: total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`[LoanController] Error in ${endpointName}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to retrieve loans for ${endpointName}`,
      error: error.message,
    });
  }
};

const getLoans = async (req, res) => {
  await getLoansLogic(req, res, "getLoans");
};

const getClientsWithLoans = async (req, res) => {
  console.log(
    "[LoanController] getClientsWithLoans - Delegating to getLoansLogic"
  );
  await getLoansLogic(req, res, "getClientsWithLoans");
};

// Get a single loan by ID
const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[LoanController] Get Loan By ID - ID:", id);
    const [loans] = await pool.execute(
      `SELECT l.*, CONCAT(c.first_name, ' ', c.last_name) as client_name, c.email as client_email, c.phone as client_phone, u.username as approved_by_username
       FROM loans l
       JOIN clients c ON l.client_id = c.id
       LEFT JOIN users u ON l.approved_by = u.id
       WHERE l.id = ?`,
      [id]
    );

    if (loans.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }

    let loan = loans[0];
    if (
      loan.installment_amount === null ||
      loan.installment_amount === undefined ||
      parseFloat(loan.installment_amount) === 0
    ) {
      const principal = parseFloat(loan.approved_amount || loan.loan_amount);
      const annualInterestRate = parseFloat(loan.interest_rate);
      const termMonths = parseInt(loan.term_months);
      loan.installment_amount = calculateInstallment(
        principal,
        annualInterestRate,
        termMonths
      ).toFixed(2);
    }

    res.json({ success: true, data: loan });
  } catch (error) {
    console.error("[LoanController] Error in getLoanById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve loan",
      error: error.message,
    });
  }
};

// Update a loan
const updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // e.g., { loan_amount, interest_rate, term_months, purpose, status, start_date, ... }

    console.log(`[LoanController] Update Loan ID: ${id} with data:`, updates);

    const allowedUpdates = [
      "loan_amount",
      "interest_rate",
      "term_months",
      "purpose",
      "status",
      "start_date",
      "payment_frequency",
      "next_due_date",
      // Add other fields that are permissible to update via this general endpoint
      // Be cautious about which fields can be updated here, especially financial or status fields
      // if they have dedicated approval/rejection flows.
    ];

    const fieldPlaceholders = [];
    const values = [];

    for (const key in updates) {
      if (allowedUpdates.includes(key) && updates[key] !== undefined) {
        if (key === "start_date" || key === "next_due_date") {
          const formattedDate = formatDateToDb(updates[key]);
          if (
            formattedDate === null &&
            updates[key] !== null &&
            updates[key] !== ""
          ) {
            // if original value was not null/empty but formatting failed
            console.warn(
              `[LoanController] Update Loan - Invalid date value for ${key}: ${updates[key]}. It will be set to NULL or skipped if not allowed.`
            );
            // Depending on strictness, either return error or let it be null/skipped
            // For now, let's allow null if formatting fails but original was not explicitly null
            values.push(null);
          } else {
            values.push(formattedDate);
          }
        } else {
          values.push(updates[key]);
        }
        fieldPlaceholders.push(`${key} = ?`);
      }
    }

    if (fieldPlaceholders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    values.push(id); // For the WHERE id = ?

    const sql = `UPDATE loans SET ${fieldPlaceholders.join(
      ", "
    )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    console.log("[LoanController] Update SQL:", sql);
    console.log("[LoanController] Update Values:", values);

    const [result] = await pool.execute(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Loan not found or no changes made.",
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
      message: "Loan updated successfully",
      data: updatedLoan[0],
    });
  } catch (error) {
    console.error("[LoanController] Error in updateLoan:", error);
    if (
      error.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" ||
      error.message.includes("Incorrect date value")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid date format provided. Please use YYYY-MM-DD for date fields.",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update loan.",
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
        SUM(COALESCE(approved_amount, loan_amount, 0)) AS total_loan_amount,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_loans,
        AVG(interest_rate) AS average_interest_rate,
        SUM(CASE WHEN status = 'completed' OR status = 'paid_off' THEN 1 ELSE 0 END) AS completed_loans,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_loans,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_loans
      FROM loans
    `);

    // rows[0] will contain the aggregated values.
    // If there are no loans, COUNT will be 0, SUMs will be NULL (or 0 if COALESCE is used effectively), AVG will be NULL.
    const dbStats = rows[0] || {};

    const stats = {
      total_loans: Number(dbStats.total_loans || 0),
      total_loan_amount: Number(dbStats.total_loan_amount || 0),
      active_loans: Number(dbStats.active_loans || 0),
      average_interest_rate:
        dbStats.average_interest_rate !== null
          ? parseFloat(dbStats.average_interest_rate)
          : 0, // Ensure number or 0
      completed_loans: Number(dbStats.completed_loans || 0),
      pending_loans: Number(dbStats.pending_loans || 0),
      overdue_loans: Number(dbStats.overdue_loans || 0),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[LoanController] Error in getLoanStats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve loan statistics.",
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
};
