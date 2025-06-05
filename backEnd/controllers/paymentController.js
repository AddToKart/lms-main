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
    const loan_id_filter = req.query.loan_id || ""; // Renamed to avoid conflict
    const date_from = req.query.date_from || "";
    const date_to = req.query.date_to || "";

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
    if (loan_id_filter) {
      whereConditions.push(`p.loan_id = ?`);
      queryParams.push(loan_id_filter);
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

    const countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      LEFT JOIN loans l ON p.loan_id = l.id
      LEFT JOIN clients c ON l.client_id = c.id
      ${whereClause}
    `;
    const countParams = queryParams.slice(0, -2);
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

    if (!req.user || !req.user.id) {
      console.error("Error creating payment: User ID is missing from request.");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID is missing. Please log in again.",
      });
    }
    const processed_by = req.user.id;

    if (!loan_id || !amount || !payment_date || !payment_method) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: loan_id, amount, payment_date, payment_method.",
      });
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment amount." });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [loanRows] = await connection.query(
        "SELECT client_id, remaining_balance, status, next_due_date, payment_frequency FROM loans WHERE id = ? FOR UPDATE",
        [loan_id]
      );
      if (loanRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res
          .status(404)
          .json({ success: false, message: "Loan not found." });
      }
      const currentLoan = loanRows[0];
      const client_id = currentLoan.client_id;

      if (currentLoan.status === "paid_off") {
        await connection.rollback();
        connection.release();
        return res
          .status(400)
          .json({ success: false, message: "Loan is already paid off." });
      }

      const paymentQuery = `
        INSERT INTO payments (loan_id, client_id, amount, payment_date, payment_method, reference_number, notes, status, processed_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      const paymentStatus = "completed"; // Assuming direct payments are 'completed'
      const [paymentResult] = await connection.query(paymentQuery, [
        loan_id,
        client_id,
        amount,
        payment_date,
        payment_method,
        reference_number || null,
        notes || null,
        paymentStatus,
        processed_by,
      ]);
      const paymentId = paymentResult.insertId;

      // Fetch the loan again to get the updated remaining_balance (updated by trigger) and status
      const [updatedLoanRows] = await connection.query(
        "SELECT remaining_balance, next_due_date, payment_frequency, status FROM loans WHERE id = ?",
        [loan_id]
      );
      const updatedLoan = updatedLoanRows[0];
      const finalRemainingBalance = parseFloat(updatedLoan.remaining_balance);

      const responsePayload = {
        payment_id: paymentId,
        loan_id: loan_id,
        client_id: client_id,
        new_remaining_balance: finalRemainingBalance,
        new_loan_status: updatedLoan.status, // Use status after trigger
        new_next_due_date: updatedLoan.next_due_date, // Initial, will be updated if loan is not paid off
        message: "Payment created successfully.",
      };

      let newLoanStatus = updatedLoan.status;
      let newNextDueDateSQL = updatedLoan.next_due_date; // Default to current, might be null if paid by trigger

      if (finalRemainingBalance <= 0) {
        // This check might be redundant if the trigger already sets to 'paid_off'
        // but it's a good safeguard.
        newLoanStatus = "paid_off";
        newNextDueDateSQL = null; // No next due date for paid off loans
        responsePayload.message =
          "Payment created successfully. Loan is now paid off.";
      } else {
        // Loan is not paid off, advance the next_due_date
        // Only set to 'active' if it's not already 'paid_off' (e.g. if payment was exact amount and trigger handled it)
        if (newLoanStatus !== "paid_off") newLoanStatus = "active";

        if (updatedLoan.next_due_date && updatedLoan.payment_frequency) {
          console.log(
            `[PaymentController DEBUG] Loan ID: ${loan_id} - Original next_due_date from DB:`,
            updatedLoan.next_due_date,
            `(Type: ${typeof updatedLoan.next_due_date})`
          );

          let year, month, day;
          const dateValue = updatedLoan.next_due_date;
          let validDateParts = false;

          if (dateValue instanceof Date && !isNaN(dateValue)) {
            // If it's a Date object, assume it might be in local time from the DB driver.
            // Extract components using local getters, then reconstruct as UTC.
            year = dateValue.getFullYear();
            month = dateValue.getMonth() + 1; // getMonth is 0-indexed
            day = dateValue.getDate();
            console.log(
              `[PaymentController DEBUG] Loan ID: ${loan_id} - Parsed from Date Object (local components): Y=${year}, M=${month}, D=${day}`
            );
            validDateParts = true;
          } else if (typeof dateValue === "string") {
            const parts = dateValue.split("-");
            if (parts.length === 3) {
              year = parseInt(parts[0], 10);
              month = parseInt(parts[1], 10);
              day = parseInt(parts[2], 10);
              if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                console.log(
                  `[PaymentController DEBUG] Loan ID: ${loan_id} - Parsed from String: Y=${year}, M=${month}, D=${day}`
                );
                validDateParts = true;
              }
            }
          }

          if (validDateParts) {
            // Create the current due date
            const currentDueDate = new Date(Date.UTC(year, month - 1, day));
            console.log(
              `[PaymentController DEBUG] Loan ID: ${loan_id} - Current due date (UTC): ${currentDueDate.toISOString()}`
            );

            // Always advance from the current due date by one payment period
            // This payment covers the current period, so next due date should be one period later
            switch (updatedLoan.payment_frequency) {
              case "daily":
                currentDueDate.setUTCDate(currentDueDate.getUTCDate() + 1);
                break;
              case "weekly":
                currentDueDate.setUTCDate(currentDueDate.getUTCDate() + 7);
                break;
              case "bi-weekly":
                currentDueDate.setUTCDate(currentDueDate.getUTCDate() + 14);
                break;
              case "monthly":
                // For monthly payments, advance by exactly one month
                currentDueDate.setUTCMonth(currentDueDate.getUTCMonth() + 1);
                break;
              case "quarterly":
                currentDueDate.setUTCMonth(currentDueDate.getUTCMonth() + 3);
                break;
              case "semi-annually":
                currentDueDate.setUTCMonth(currentDueDate.getUTCMonth() + 6);
                break;
              case "annually":
                currentDueDate.setUTCFullYear(
                  currentDueDate.getUTCFullYear() + 1
                );
                break;
              default:
                console.warn(
                  `Loan ID: ${loan_id} - Unknown payment_frequency: '${updatedLoan.payment_frequency}'. Defaulting to monthly.`
                );
                currentDueDate.setUTCMonth(currentDueDate.getUTCMonth() + 1);
            }

            newNextDueDateSQL = currentDueDate.toISOString().split("T")[0];
            console.log(
              `[PaymentController DEBUG] Loan ID: ${loan_id} - NEW next due date after payment: ${newNextDueDateSQL}`
            );
          } else {
            console.error(
              `Loan ID: ${loan_id} - Could not determine valid date parts from next_due_date ('${updatedLoan.next_due_date}'). Due date not advanced.`
            );
          }
        } else if (newLoanStatus !== "paid_off") {
          console.warn(
            `Loan ID: ${loan_id} - Active loan (not paid off) has no next_due_date or payment_frequency. Due date not advanced. Next Due Date: ${updatedLoan.next_due_date}, Frequency: ${updatedLoan.payment_frequency}`
          );
        }
      }

      responsePayload.new_loan_status = newLoanStatus;
      responsePayload.new_next_due_date = newNextDueDateSQL;

      // Update loan status and next_due_date in the database
      try {
        await connection.query(
          "UPDATE loans SET status = ?, next_due_date = ?, updated_at = NOW() WHERE id = ?",
          [newLoanStatus, newNextDueDateSQL, loan_id]
        );
        console.log(
          `[PaymentController DEBUG] Loan ID: ${loan_id} - DB updated. New Status: ${newLoanStatus}, New Next Due Date: ${newNextDueDateSQL}`
        );
      } catch (updateError) {
        console.error(
          `[PaymentController ERROR] Failed to update loan status/next_due_date for loan ID ${loan_id}:`,
          updateError
        );

        // If the update fails due to status constraint, try with a fallback status
        if (
          updateError.code === "WARN_DATA_TRUNCATED" &&
          newLoanStatus === "paid_off"
        ) {
          console.log(
            `[PaymentController DEBUG] Trying fallback status 'completed' for loan ID: ${loan_id}`
          );
          try {
            await connection.query(
              "UPDATE loans SET status = 'completed', next_due_date = ?, updated_at = NOW() WHERE id = ?",
              [newNextDueDateSQL, loan_id]
            );
            responsePayload.new_loan_status = "completed";
            console.log(
              `[PaymentController DEBUG] Loan ID: ${loan_id} - Updated with fallback status 'completed'`
            );
          } catch (fallbackError) {
            console.error(
              `[PaymentController ERROR] Fallback update also failed for loan ID ${loan_id}:`,
              fallbackError
            );
            throw updateError; // Throw original error
          }
        } else {
          throw updateError;
        }
      }

      await connection.commit();
      connection.release();

      // If loan is fully paid, cancel future scheduled payments (if any)
      // This is done after committing the main transaction for atomicity of payment and loan update.
      if (newLoanStatus === "paid_off") {
        try {
          // Using a separate connection or a new transaction for this non-critical update
          await pool.query(
            "UPDATE payments SET status = 'cancelled' WHERE loan_id = ? AND status = 'scheduled' AND payment_date > CURDATE()",
            [loan_id]
          );
          console.log(
            `[PaymentController INFO] Loan ID: ${loan_id} - Future scheduled payments cancelled as loan is paid off.`
          );
        } catch (scheduleUpdateError) {
          console.error(
            `[PaymentController ERROR] Loan ID: ${loan_id} - Error cancelling future scheduled payments:`,
            scheduleUpdateError
          );
          // This error does not affect the main payment success response.
        }
      }

      res.status(201).json({
        success: true,
        data: responsePayload,
        message: responsePayload.message, // Use the potentially updated message
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error(
        "Error during payment transaction for loan ID " + loan_id + ":",
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to create payment due to a server error.",
        error: error.message,
      });
    }
  } catch (outerError) {
    // Catch errors from getConnection or beginTransaction
    console.error(
      "Outer error in createPayment (e.g., DB connection issue) for loan ID " +
        (req.body.loan_id || "unknown") +
        ":",
      outerError
    );
    res.status(500).json({
      success: false,
      message:
        "An unexpected server error occurred while attempting to create payment.",
      error: outerError.message,
    });
  }
};

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

    const [updateResult] = await pool.query(
      `UPDATE payments SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found or no changes made",
      });
    }

    // Fetch the loan_id from the updated payment
    const [paymentDetails] = await pool.query(
      "SELECT loan_id FROM payments WHERE id = ?",
      [id]
    );

    if (paymentDetails.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Updated payment details could not be retrieved (loan_id missing).",
      });
    }
    const loan_id = paymentDetails[0].loan_id;

    // Fetch the client_id from the loans table
    const [loanDetails] = await pool.query(
      "SELECT client_id FROM loans WHERE id = ?",
      [loan_id]
    );

    let client_id = null;
    if (loanDetails.length > 0) {
      client_id = loanDetails[0].client_id;
    } else {
      console.warn(
        `Client ID not found for loan_id: ${loan_id} during payment update.`
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      payment_id: parseInt(id, 10),
      loan_id: loan_id,
      client_id: client_id,
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
    const [paymentResult] = await pool.query(
      "SELECT * FROM payments WHERE id = ?",
      [id]
    );

    if (paymentResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const amountToRestore = paymentResult[0].amount;
    const loanIdToUpdate = paymentResult[0].loan_id;

    // Delete the payment
    await pool.query("DELETE FROM payments WHERE id = ?", [id]);

    // Update loan remaining balance (add back the payment amount)
    // This assumes a trigger might not handle reversing a payment.
    // If a trigger *does* handle it, this manual update might be redundant or cause issues.
    await pool.query(
      "UPDATE loans SET remaining_balance = remaining_balance + ? WHERE id = ?",
      [amountToRestore, loanIdToUpdate]
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
