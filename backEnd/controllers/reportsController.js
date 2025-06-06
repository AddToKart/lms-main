const pool = require("../db/database");
const ExcelJS = require("exceljs");

// Get loan analytics
const getLoanAnalytics = async (req, res) => {
  try {
    console.log("[getLoanAnalytics] Starting query...");

    const { date_from, date_to } = req.query;

    // Build the analytics query
    const analyticsQuery = `
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
      ${
        date_from && date_to
          ? `WHERE l.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)`
          : "WHERE 1=1"
      }
    `;

    const params = date_from && date_to ? [date_from, date_to] : [];

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
        COALESCE(AVG(l.term_months), 0) as avg_loan_term_months
      FROM loans l
      WHERE l.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
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

// Export report
const exportReport = async (req, res) => {
  try {
    const { report_type, format, date_from, date_to } = req.query;

    // This is a placeholder - implement actual export logic based on your needs
    res.json({
      success: true,
      message: `${report_type} export in ${format} format would be generated here`,
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export report",
      error: error.message,
    });
  }
};

module.exports = {
  getLoanAnalytics,
  getLoanSummaryReport,
  getPaymentHistoryReport,
  getOverdueLoansReport,
  exportReport,
};
