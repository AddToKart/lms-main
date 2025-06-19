const pool = require("../db/database");

// Use ExcelJS for Excel exports
let ExcelJS;
try {
  ExcelJS = require("exceljs");
} catch (error) {
  console.warn(
    "ExcelJS module not found. Excel exports will not be available."
  );
  ExcelJS = null;
}

// Get loan analytics
const getLoanAnalytics = async (req, res) => {
  try {
    console.log("[getLoanAnalytics] Starting query...");

    const { date_from, date_to } = req.query;

    // Build the analytics query
    let analyticsQuery = `
      SELECT 
        COUNT(CASE WHEN l.status IN ('active', 'approved') THEN 1 END) as total_active_loans,
        COALESCE(SUM(CASE WHEN l.status IN ('active', 'approved') THEN l.remaining_balance END), 0) as total_outstanding,
        COALESCE(
          (SELECT SUM(p.amount) 
           FROM payments p 
           WHERE p.status = 'completed' 
           AND MONTH(p.payment_date) = MONTH(CURRENT_DATE()) 
           AND YEAR(p.payment_date) = YEAR(CURRENT_DATE())), 0
        ) as monthly_collections,
        COALESCE(AVG(CASE WHEN l.status IN ('active', 'approved') THEN l.loan_amount END), 0) as average_loan_amount
      FROM loans l
    `;

    const params = [];
    let whereClauses = [];

    if (date_from) {
      whereClauses.push("l.created_at >= ?");
      params.push(date_from);
    }
    if (date_to) {
      whereClauses.push("l.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(date_to);
    }

    if (whereClauses.length > 0) {
      analyticsQuery += " WHERE " + whereClauses.join(" AND ");
    }

    console.log("[getLoanAnalytics] Executing query:", analyticsQuery);
    console.log("[getLoanAnalytics] With params:", params);

    const [results] = await pool.execute(analyticsQuery, params);

    console.log("[getLoanAnalytics] Raw results:", results);

    if (results.length === 0) {
      console.log("[getLoanAnalytics] No results found");
      return res.json({
        success: true,
        data: {
          total_active_loans: 0,
          total_outstanding: 0,
          monthly_collections: 0,
          average_loan_amount: 0,
        },
      });
    }

    const result = results[0];
    const analyticsData = {
      total_active_loans: parseInt(result.total_active_loans) || 0,
      total_outstanding: parseFloat(result.total_outstanding) || 0,
      monthly_collections: parseFloat(result.monthly_collections) || 0,
      average_loan_amount: parseFloat(result.average_loan_amount) || 0,
    };

    console.log("[getLoanAnalytics] Query result:", analyticsData);

    res.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error("[getLoanAnalytics] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan analytics",
      error: error.message,
    });
  }
};

// Get loan summary report
const getLoanSummaryReport = async (req, res) => {
  try {
    console.log("[Loan Summary] Starting query...");

    const { date_from, date_to } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: "date_from and date_to are required",
      });
    }

    const query = `
      SELECT 
        DATE_FORMAT(l.created_at, '%Y-%m') as month,
        COUNT(*) as new_loans,
        COALESCE(SUM(l.loan_amount), 0) as total_amount,
        COALESCE(AVG(l.interest_rate), 0) as avg_interest,
        COUNT(CASE WHEN l.status IN ('approved', 'active') THEN 1 END) as approved_count,
        COUNT(CASE WHEN l.status = 'rejected' THEN 1 END) as rejected_count,
        COALESCE(SUM(CASE WHEN l.status = 'paid_off' THEN l.loan_amount END), 0) as total_principal_repaid,
        0 as total_interest_repaid,
        COUNT(CASE WHEN l.status = 'paid_off' THEN 1 END) as fully_paid_loans_count,
        COALESCE(AVG(CASE WHEN l.status IN ('active', 'approved') THEN l.term_months END), 0) as avg_loan_term_months
      FROM loans l
      WHERE l.created_at >= ? AND l.created_at < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY DATE_FORMAT(l.created_at, '%Y-%m')
      ORDER BY month DESC
    `;

    console.log(
      "[Loan Summary] Executing query with dates:",
      date_from,
      "to",
      date_to
    );

    const [results] = await pool.execute(query, [date_from, date_to]);

    console.log("[Loan Summary] Found", results.length, "records");

    const formattedResults = results.map((row) => ({
      month: row.month,
      new_loans: parseInt(row.new_loans) || 0,
      total_amount: parseFloat(row.total_amount) || 0,
      avg_interest: parseFloat(row.avg_interest) || 0,
      approved_count: parseInt(row.approved_count) || 0,
      rejected_count: parseInt(row.rejected_count) || 0,
      total_principal_repaid: parseFloat(row.total_principal_repaid) || 0,
      total_interest_repaid: parseFloat(row.total_interest_repaid) || 0,
      fully_paid_loans_count: parseInt(row.fully_paid_loans_count) || 0,
      avg_loan_term_months: parseFloat(row.avg_loan_term_months) || 0,
    }));

    res.json({
      success: true,
      data: formattedResults,
    });
  } catch (error) {
    console.error("[Loan Summary] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan summary report",
      error: error.message,
    });
  }
};

// Get payment history report
const getPaymentHistoryReport = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: "date_from and date_to are required",
      });
    }

    const query = `
      SELECT 
        p.payment_date as date,
        COUNT(*) as total_payments,
        COALESCE(SUM(p.amount), 0) as total_amount,
        COUNT(CASE WHEN p.payment_date <= l.next_due_date OR l.next_due_date IS NULL THEN 1 END) as on_time_payments,
        COUNT(CASE WHEN p.payment_date > l.next_due_date THEN 1 END) as late_payments,
        COALESCE(AVG(p.amount), 0) as avg_payment_amount
      FROM payments p
      LEFT JOIN loans l ON p.loan_id = l.id
      WHERE p.payment_date BETWEEN ? AND ?
      AND p.status = 'completed'
      GROUP BY p.payment_date
      ORDER BY p.payment_date DESC
    `;

    const [results] = await pool.execute(query, [date_from, date_to]);

    const formattedResults = results.map((row) => ({
      date: row.date,
      total_payments: parseInt(row.total_payments) || 0,
      total_amount: parseFloat(row.total_amount) || 0,
      on_time_payments: parseInt(row.on_time_payments) || 0,
      late_payments: parseInt(row.late_payments) || 0,
      avg_payment_amount: parseFloat(row.avg_payment_amount) || 0,
    }));

    res.json({
      success: true,
      data: formattedResults,
    });
  } catch (error) {
    console.error("Error fetching payment history report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history report",
      error: error.message,
    });
  }
};

// Get overdue loans report
const getOverdueLoansReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        l.id,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        c.phone,
        c.email,
        DATEDIFF(CURRENT_DATE(), l.next_due_date) as days_overdue,
        l.installment_amount as amount_due,
        l.loan_amount,
        CASE 
          WHEN DATEDIFF(CURRENT_DATE(), l.next_due_date) > 30 THEN 'Severe'
          WHEN DATEDIFF(CURRENT_DATE(), l.next_due_date) > 7 THEN 'Moderate'
          ELSE 'Mild'
        END as overdue_severity
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.status = 'active'
      AND l.next_due_date < CURRENT_DATE()
      ORDER BY days_overdue DESC
    `;

    const [results] = await pool.execute(query);

    const formattedResults = results.map((row) => ({
      id: row.id,
      client_name: row.client_name,
      phone: row.phone || "N/A",
      email: row.email || "N/A",
      days_overdue: parseInt(row.days_overdue) || 0,
      amount_due: parseFloat(row.amount_due) || 0,
      loan_amount: parseFloat(row.loan_amount) || 0,
      overdue_severity: row.overdue_severity,
    }));

    res.json({
      success: true,
      data: formattedResults,
    });
  } catch (error) {
    console.error("Error fetching overdue loans report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch overdue loans report",
      error: error.message,
    });
  }
};

// Export loan summary report
const exportLoanSummary = async (req, res) => {
  try {
    const { format = "excel", date_from, date_to } = req.query;

    console.log("[ReportController] Export loan summary:", {
      format,
      date_from,
      date_to,
    });

    // Build date filters
    let dateFilter = "";
    let params = [];
    let whereClauses = [];

    if (date_from) {
      whereClauses.push("l.created_at >= ?");
      params.push(date_from);
    }
    if (date_to) {
      whereClauses.push("l.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      params.push(date_to);
    }

    if (whereClauses.length > 0) {
      dateFilter = "WHERE " + whereClauses.join(" AND ");
    }

    // Get loan summary data
    const query = `
      SELECT 
        l.id,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        l.loan_amount,
        l.approved_amount,
        l.interest_rate,
        l.term_months,
        l.status,
        l.remaining_balance,
        l.start_date,
        l.next_due_date,
        l.created_at
      FROM loans l
      LEFT JOIN clients c ON l.client_id = c.id
      ${dateFilter}
      ORDER BY l.created_at DESC
    `;

    const [loans] = await pool.execute(query, params);

    console.log("[ReportController] Found loans for export:", loans.length);

    if (loans.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data available for export with the specified criteria",
      });
    }

    if (format === "excel") {
      if (!ExcelJS) {
        return res.status(500).json({
          success: false,
          message:
            "Excel export not available. Please install exceljs package.",
        });
      }

      // Generate Excel file
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Loan Summary");

      // Add headers
      worksheet.columns = [
        { header: "Loan ID", key: "id", width: 10 },
        { header: "Client Name", key: "client_name", width: 20 },
        { header: "Loan Amount", key: "loan_amount", width: 15 },
        { header: "Approved Amount", key: "approved_amount", width: 15 },
        { header: "Interest Rate", key: "interest_rate", width: 12 },
        { header: "Term (Months)", key: "term_months", width: 12 },
        { header: "Status", key: "status", width: 12 },
        { header: "Remaining Balance", key: "remaining_balance", width: 15 },
        { header: "Start Date", key: "start_date", width: 12 },
        { header: "Next Due Date", key: "next_due_date", width: 12 },
        { header: "Created Date", key: "created_at", width: 15 },
      ];

      // Add data
      loans.forEach((loan) => {
        worksheet.addRow({
          id: loan.id,
          client_name: loan.client_name || "N/A",
          loan_amount: loan.loan_amount,
          approved_amount: loan.approved_amount,
          interest_rate: `${loan.interest_rate}%`,
          term_months: loan.term_months,
          status: loan.status,
          remaining_balance: loan.remaining_balance,
          start_date: loan.start_date
            ? new Date(loan.start_date).toLocaleDateString()
            : "N/A",
          next_due_date: loan.next_due_date
            ? new Date(loan.next_due_date).toLocaleDateString()
            : "N/A",
          created_at: new Date(loan.created_at).toLocaleDateString(),
        });
      });

      // Set response headers for Excel download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=loan_summary_${Date.now()}.xlsx`
      );

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON data
      res.json({
        success: true,
        data: loans,
        total: loans.length,
      });
    }
  } catch (error) {
    console.error("[ReportController] Error exporting loan summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export loan summary",
      error: error.message,
    });
  }
};

// Export payment history report
const exportPaymentHistory = async (req, res) => {
  try {
    const { format = "excel", date_from, date_to } = req.query;

    console.log("[ReportController] Export payment history:", {
      format,
      date_from,
      date_to,
    });

    // Build date filters
    let dateFilter = "";
    let params = [];

    if (date_from && date_to) {
      dateFilter = "WHERE p.payment_date BETWEEN ? AND ?";
      params.push(date_from, date_to);
    }

    // Get payment history data
    const query = `
      SELECT 
        p.id,
        p.loan_id,
        CONCAT(c.first_name, ' ', c.last_name) as client_name,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.status,
        p.reference_number,
        p.notes
      FROM payments p
      LEFT JOIN loans l ON p.loan_id = l.id
      LEFT JOIN clients c ON l.client_id = c.id
      ${dateFilter}
      ORDER BY p.payment_date DESC
    `;

    const [payments] = await pool.execute(query, params);

    console.log(
      "[ReportController] Found payments for export:",
      payments.length
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payment data available for export",
      });
    }

    if (format === "excel") {
      if (!ExcelJS) {
        return res.status(500).json({
          success: false,
          message:
            "Excel export not available. Please install exceljs package.",
        });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Payment History");

      worksheet.columns = [
        { header: "Payment ID", key: "id", width: 12 },
        { header: "Loan ID", key: "loan_id", width: 10 },
        { header: "Client Name", key: "client_name", width: 20 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Payment Date", key: "payment_date", width: 15 },
        { header: "Payment Method", key: "payment_method", width: 15 },
        { header: "Status", key: "status", width: 12 },
        { header: "Reference Number", key: "reference_number", width: 20 },
        { header: "Notes", key: "notes", width: 30 },
      ];

      payments.forEach((payment) => {
        worksheet.addRow({
          id: payment.id,
          loan_id: payment.loan_id,
          client_name: payment.client_name || "N/A",
          amount: payment.amount,
          payment_date: payment.payment_date
            ? new Date(payment.payment_date).toLocaleDateString()
            : "N/A",
          payment_method: payment.payment_method || "N/A",
          status: payment.status,
          reference_number: payment.reference_number || "N/A",
          notes: payment.notes || "",
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=payment_history_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({
        success: true,
        data: payments,
        total: payments.length,
      });
    }
  } catch (error) {
    console.error("[ReportController] Error exporting payment history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export payment history",
      error: error.message,
    });
  }
};

// Export client list
const exportClientList = async (req, res) => {
  try {
    const { format = "excel" } = req.query;

    console.log("[ReportController] Export client list:", { format });

    const query = `
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.address,
        c.city,
        c.state,
        c.country,
        c.status,
        c.created_at,
        COUNT(l.id) as total_loans,
        COALESCE(SUM(l.loan_amount), 0) as total_loan_amount
      FROM clients c
      LEFT JOIN loans l ON c.id = l.client_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    const [clients] = await pool.execute(query);

    console.log("[ReportController] Found clients for export:", clients.length);

    if (clients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No client data available for export",
      });
    }

    if (format === "excel") {
      if (!ExcelJS) {
        return res.status(500).json({
          success: false,
          message:
            "Excel export not available. Please install exceljs package.",
        });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Client List");

      worksheet.columns = [
        { header: "Client ID", key: "id", width: 10 },
        { header: "First Name", key: "first_name", width: 15 },
        { header: "Last Name", key: "last_name", width: 15 },
        { header: "Email", key: "email", width: 25 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "Address", key: "address", width: 30 },
        { header: "City", key: "city", width: 15 },
        { header: "State", key: "state", width: 15 },
        { header: "Country", key: "country", width: 15 },
        { header: "Status", key: "status", width: 12 },
        { header: "Total Loans", key: "total_loans", width: 12 },
        { header: "Total Loan Amount", key: "total_loan_amount", width: 18 },
        { header: "Created Date", key: "created_at", width: 15 },
      ];

      clients.forEach((client) => {
        worksheet.addRow({
          id: client.id,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email || "N/A",
          phone: client.phone || "N/A",
          address: client.address || "N/A",
          city: client.city || "N/A",
          state: client.state || "N/A",
          country: client.country || "N/A",
          status: client.status,
          total_loans: client.total_loans,
          total_loan_amount: client.total_loan_amount,
          created_at: new Date(client.created_at).toLocaleDateString(),
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=client_list_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.json({
        success: true,
        data: clients,
        total: clients.length,
      });
    }
  } catch (error) {
    console.error("[ReportController] Error exporting client list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export client list",
      error: error.message,
    });
  }
};

module.exports = {
  getLoanAnalytics,
  getLoanSummaryReport,
  getPaymentHistoryReport,
  getOverdueLoansReport,
  exportLoanSummary,
  exportPaymentHistory,
  exportClientList,
};
