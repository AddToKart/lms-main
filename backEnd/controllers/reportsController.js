const pool = require("../db/database");
const ExcelJS = require('exceljs');

// Get loan summary report
exports.getLoanSummaryReport = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let dateFilter = "";
    const params = [];

    if (date_from && date_to) {
      dateFilter = "WHERE l.created_at BETWEEN ? AND ?";
      params.push(date_from, date_to);
    }

    const query = `
      SELECT 
        DATE_FORMAT(l.created_at, '%Y-%m') as month,
        COUNT(*) as new_loans,
        COALESCE(SUM(l.loan_amount), 0) as total_amount,
        COALESCE(AVG(l.interest_rate), 0) as avg_interest,
        COALESCE(SUM(CASE WHEN l.status IN ('approved', 'active') THEN l.loan_amount ELSE 0 END), 0) as approved_amount,
        COUNT(CASE WHEN l.status IN ('approved', 'active') THEN 1 END) as approved_count,
        COUNT(CASE WHEN l.status = 'rejected' THEN 1 END) as rejected_count
      FROM loans l
      ${dateFilter}
      GROUP BY DATE_FORMAT(l.created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `;

    const [results] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching loan summary report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan summary report",
      error: error.message,
    });
  }
};

// Get client summary report
exports.getClientSummaryReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id,
        CONCAT(c.first_name, ' ', c.last_name) as name,
        c.email,
        c.phone,
        c.status as client_status,
        COUNT(l.id) as total_loans,
        COUNT(CASE WHEN l.status IN ('active', 'overdue') THEN 1 END) as active_loans,
        COALESCE(SUM(l.loan_amount), 0) as total_borrowed,
        COALESCE(SUM(CASE WHEN l.status IN ('active', 'overdue') THEN l.remaining_balance ELSE 0 END), 0) as current_balance,
        COALESCE(SUM(p.amount), 0) as total_payments,
        CASE 
          WHEN COUNT(CASE WHEN l.status = 'overdue' THEN 1 END) > 0 THEN 'Overdue'
          WHEN COUNT(CASE WHEN l.status = 'active' THEN 1 END) > 0 THEN 'Good'
          WHEN COUNT(l.id) = 0 THEN 'No Loans'
          ELSE 'Completed'
        END as payment_status
      FROM clients c
      LEFT JOIN loans l ON c.id = l.client_id
      LEFT JOIN payments p ON l.id = p.loan_id AND p.status = 'completed'
      WHERE c.status = 'active'
      GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.status
      ORDER BY total_borrowed DESC
      LIMIT 50
    `;

    const [results] = await pool.query(query);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching client summary report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client summary report",
      error: error.message,
    });
  }
};

// Get payment history report
exports.getPaymentHistoryReport = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let dateFilter = "";
    const params = [];

    if (date_from && date_to) {
      dateFilter = "WHERE p.payment_date BETWEEN ? AND ?";
      params.push(date_from, date_to);
    } else {
      // Default to last 30 days
      dateFilter = "WHERE p.payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }

    const query = `
      SELECT 
        DATE(p.payment_date) as date,
        COUNT(*) as total_payments,
        SUM(p.amount) as total_amount,
        COUNT(CASE WHEN p.created_at <= DATE_ADD(l.next_due_date, INTERVAL 1 DAY) THEN 1 END) as on_time_payments,
        COUNT(CASE WHEN p.created_at > DATE_ADD(l.next_due_date, INTERVAL 1 DAY) THEN 1 END) as late_payments,
        AVG(p.amount) as avg_payment_amount
      FROM payments p
      LEFT JOIN loans l ON p.loan_id = l.id
      ${dateFilter}
      AND p.status = 'completed'
      GROUP BY DATE(p.payment_date)
      ORDER BY date DESC
      LIMIT 30
    `;

    const [results] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: results,
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
exports.getOverdueLoansReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        l.id,
        CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as client_name,
        c.phone,
        c.email,
        l.loan_amount,
        COALESCE(l.remaining_balance, l.loan_amount) as amount_due,
        l.next_due_date,
        COALESCE(DATEDIFF(NOW(), l.next_due_date), 0) as days_overdue,
        COALESCE(l.interest_rate, 0) as interest_rate,
        CASE 
          WHEN COALESCE(DATEDIFF(NOW(), l.next_due_date), 0) <= 7 THEN 'Recent'
          WHEN COALESCE(DATEDIFF(NOW(), l.next_due_date), 0) <= 30 THEN 'Moderate'
          ELSE 'Severe'
        END as overdue_severity
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      WHERE l.status IN ('active', 'overdue') 
      AND l.next_due_date < NOW()
      AND COALESCE(l.remaining_balance, l.loan_amount) > 0
      ORDER BY days_overdue DESC, amount_due DESC
    `;

    const [results] = await pool.query(query);

    res.status(200).json({
      success: true,
      data: results,
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

// Get dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Get overall statistics with better error handling
    const [overallStats] = await pool.query(`
      SELECT 
        COALESCE(COUNT(CASE WHEN l.status IN ('pending', 'approved', 'active', 'overdue') THEN 1 END), 0) as total_active_loans,
        COALESCE(SUM(CASE WHEN l.status IN ('active', 'overdue') THEN 
          COALESCE(l.remaining_balance, l.loan_amount) ELSE 0 END), 0) as total_outstanding,
        COALESCE(COUNT(DISTINCT c.id), 0) as total_active_clients,
        COALESCE(SUM(CASE WHEN p.payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN p.amount ELSE 0 END), 0) as monthly_collections
      FROM loans l
      LEFT JOIN clients c ON l.client_id = c.id AND c.status = 'active'
      LEFT JOIN payments p ON l.id = p.loan_id AND p.status = 'completed'
    `);

    // Get monthly performance for last 6 months with better error handling
    const [monthlyPerformance] = await pool.query(`
      SELECT 
        DATE_FORMAT(p.payment_date, '%Y-%m') as month,
        COALESCE(SUM(p.amount), 0) as collected,
        COUNT(DISTINCT l.client_id) as active_clients,
        COUNT(p.id) as payment_count
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      WHERE p.status = 'completed' 
      AND p.payment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `);

    // Get loan status distribution
    const [loanStatusDistribution] = await pool.query(`
      SELECT 
        l.status,
        COUNT(*) as count,
        COALESCE(SUM(l.loan_amount), 0) as total_amount
      FROM loans l
      GROUP BY l.status
    `);

    res.status(200).json({
      success: true,
      data: {
        overall_stats: overallStats[0] || {
          total_active_loans: 0,
          total_outstanding: 0,
          total_active_clients: 0,
          monthly_collections: 0,
        },
        monthly_performance: monthlyPerformance || [],
        loan_status_distribution: loanStatusDistribution || [],
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard analytics",
      error: error.message,
    });
  }
};

// Export report data (for PDF/Excel generation)
exports.exportReport = async (req, res) => {
  try {
    const { type, format = "json" } = req.query;

    let reportDataForExport = []; // Renamed for clarity
    let filename = "";
    let capturedDataPayload = null; // To store data from mocked calls

    console.log(`[Export Report] Received type: ${type}, format: ${format}`);

    // Improved mock response object to capture data from controller functions
    const mockResForDataCapture = {
      _capturedData: null,
      status: function(statusCode) {
        this.statusCode = statusCode;
        return this; // Allow chaining .json()
      },
      json: function(payload) {
        // Assuming payload is { success: boolean, data: array, ... } or just the data array
        if (payload && typeof payload.data !== 'undefined') {
          this._capturedData = payload.data;
        } else {
          this._capturedData = payload; // Fallback if structure is different
        }
        return this; // To satisfy chaining if any
      },
      // Getter to easily access the captured data
      getCapturedData: function() {
        return this._capturedData;
      }
    };

    switch (type) {
      case "loan_summary":
        const loanSummaryReq = { query: req.query };
        mockResForDataCapture._capturedData = null; // Reset before use
        await exports.getLoanSummaryReport(loanSummaryReq, mockResForDataCapture);
        reportDataForExport = mockResForDataCapture.getCapturedData() || [];
        filename = "loan_summary_report";
        break;
      case "client_summary":
        const clientSummaryReq = { query: req.query };
        mockResForDataCapture._capturedData = null; // Reset before use
        await exports.getClientSummaryReport(
          clientSummaryReq,
          mockResForDataCapture
        );
        reportDataForExport = mockResForDataCapture.getCapturedData() || [];
        filename = "client_summary_report";
        break;
      case "payment_history":
        const paymentHistoryReq = { query: req.query };
        mockResForDataCapture._capturedData = null; // Reset before use
        await exports.getPaymentHistoryReport(
          paymentHistoryReq,
          mockResForDataCapture
        );
        reportDataForExport = mockResForDataCapture.getCapturedData() || [];
        filename = "payment_history_report";
        break;
      case "overdue_loans":
        const overdueLoansReq = { query: req.query };
        mockResForDataCapture._capturedData = null; // Reset before use
        await exports.getOverdueLoansReport(overdueLoansReq, mockResForDataCapture);
        reportDataForExport = mockResForDataCapture.getCapturedData() || [];
        filename = "overdue_loans_report";
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
    }

    console.log(`[Export Report] reportDataForExport length: ${reportDataForExport ? reportDataForExport.length : 'undefined'}`);
    if (reportDataForExport && reportDataForExport.length > 0) {
      console.log('[Export Report] First item of reportDataForExport:', JSON.stringify(reportDataForExport[0], null, 2));
    } else {
      console.log('[Export Report] reportDataForExport is empty or undefined.');
    }

    if (format === 'excel' && reportDataForExport && reportDataForExport.length > 0) {
      console.log('[Export Report] Attempting to generate EXCEL file.');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(filename || 'Report');

      // Add headers - assuming all objects in data have the same keys
      const headers = Object.keys(reportDataForExport[0]).map(key => ({ header: key, key: key }));
      worksheet.columns = headers;

      // Add rows
      worksheet.addRows(reportDataForExport);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}_${new Date().toISOString().split("T")[0]}.xlsx"`
      );

      await workbook.xlsx.write(res);
      // res.end() is likely handled by workbook.xlsx.write(res) when streaming

    } else {
      // Default to JSON if format is not excel, or data is empty
      res.status(200).json({
        success: true,
        data: reportDataForExport,
        meta: {
          filename: `${filename}_${new Date().toISOString().split("T")[0]}`, 
          format: format, // will be 'json' or the original if not 'excel'
          generated_at: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export report",
      error: error.message,
    });
  }
};
