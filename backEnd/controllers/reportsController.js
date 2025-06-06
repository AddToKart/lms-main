const pool = require("../db/database");
const ExcelJS = require("exceljs");

// Get loan summary report
exports.getLoanSummaryReport = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let dateFilter = "";
    const params = [];

    if (date_from && date_to) {
      dateFilter = "WHERE DATE(l.created_at) BETWEEN ? AND ?";
      params.push(date_from, date_to);
    }

    // Fixed query to use correct column names that exist in your database
    const query = `
      SELECT 
        DATE_FORMAT(l.created_at, '%Y-%m') as month,
        COUNT(DISTINCT l.id) as new_loans,
        ROUND(COALESCE(SUM(DISTINCT l.loan_amount), 0), 2) as total_amount,
        ROUND(COALESCE(AVG(l.interest_rate), 0), 2) as avg_interest,
        ROUND(COALESCE(SUM(DISTINCT CASE WHEN l.status IN ('approved', 'active') THEN COALESCE(l.approved_amount, l.loan_amount) ELSE 0 END), 0), 2) as approved_amount,
        COUNT(DISTINCT CASE WHEN l.status IN ('approved', 'active') THEN l.id END) as approved_count,
        COUNT(DISTINCT CASE WHEN l.status = 'rejected' THEN l.id END) as rejected_count,
        ROUND(COALESCE(SUM(p.amount), 0), 2) as total_principal_repaid,
        0 as total_interest_repaid,
        COUNT(DISTINCT CASE WHEN l.status = 'paid_off' THEN l.id END) as fully_paid_loans_count,
        ROUND(COALESCE(AVG(l.term_months), 0), 1) as avg_loan_term_months
      FROM loans l
      LEFT JOIN payments p ON l.id = p.loan_id AND p.status = 'completed'
      ${dateFilter}
      GROUP BY DATE_FORMAT(l.created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `;

    console.log(`[Loan Summary] Running query: ${query}`);
    console.log(`[Loan Summary] With params:`, params);

    const [results] = await pool.query(query, params);

    console.log(`[Loan Summary] Found ${results.length} records`);

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
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as on_time_payments,
        COUNT(CASE WHEN p.status != 'completed' THEN 1 END) as late_payments,
        AVG(p.amount) as avg_payment_amount
      FROM payments p
      ${dateFilter}
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
      AND l.next_due_date IS NOT NULL
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
    const { type, format = "excel" } = req.query;

    console.log(`[Export Report] Received type: ${type}, format: ${format}`);
    console.log(`[Export Report] User:`, req.user ? req.user.id : "No user");

    let reportDataForExport = [];
    let filename = "";

    // Get data using the same queries as the report endpoints
    try {
      switch (type) {
        case "loanSummary":
          const { date_from, date_to } = req.query;
          let dateFilter = "";
          const params = [];

          if (date_from && date_to) {
            dateFilter = "WHERE DATE(l.created_at) BETWEEN ? AND ?";
            params.push(date_from, date_to);
          }

          const loanQuery = `
            SELECT 
              DATE_FORMAT(l.created_at, '%Y-%m') as month,
              COUNT(DISTINCT l.id) as new_loans,
              ROUND(COALESCE(SUM(DISTINCT l.loan_amount), 0), 2) as total_amount,
              ROUND(COALESCE(AVG(l.interest_rate), 0), 2) as avg_interest,
              ROUND(COALESCE(SUM(DISTINCT CASE WHEN l.status IN ('approved', 'active') THEN 
                COALESCE(l.approved_amount, l.loan_amount) ELSE 0 END), 0), 2) as approved_amount,
              COUNT(DISTINCT CASE WHEN l.status IN ('approved', 'active') THEN l.id END) as approved_count,
              COUNT(DISTINCT CASE WHEN l.status = 'rejected' THEN l.id END) as rejected_count,
              ROUND(COALESCE(SUM(p.amount), 0), 2) as total_principal_repaid,
              0 as total_interest_repaid,
              COUNT(DISTINCT CASE WHEN l.status = 'paid_off' THEN l.id END) as fully_paid_loans_count,
              ROUND(COALESCE(AVG(l.term_months), 0), 1) as avg_loan_term_months
            FROM loans l
            LEFT JOIN payments p ON l.id = p.loan_id AND p.status = 'completed'
            ${dateFilter}
            GROUP BY DATE_FORMAT(l.created_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
          `;

          const [loanResults] = await pool.query(loanQuery, params);
          reportDataForExport = loanResults;
          filename = "loan_summary_report";
          break;

        case "paymentHistory":
          const { date_from: paymentDateFrom, date_to: paymentDateTo } =
            req.query;
          let paymentDateFilter = "";
          const paymentParams = [];

          if (paymentDateFrom && paymentDateTo) {
            paymentDateFilter = "WHERE p.payment_date BETWEEN ? AND ?";
            paymentParams.push(paymentDateFrom, paymentDateTo);
          } else {
            paymentDateFilter =
              "WHERE p.payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
          }

          const paymentQuery = `
            SELECT 
              DATE(p.payment_date) as date,
              COUNT(*) as total_payments,
              ROUND(COALESCE(SUM(CAST(p.amount AS DECIMAL(15,2))), 0), 2) as total_amount,
              COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as on_time_payments,
              COUNT(CASE WHEN p.status != 'completed' THEN 1 END) as late_payments,
              ROUND(COALESCE(AVG(CAST(p.amount AS DECIMAL(15,2))), 0), 2) as avg_payment_amount
            FROM payments p
            ${paymentDateFilter}
            GROUP BY DATE(p.payment_date)
            ORDER BY date DESC
            LIMIT 30
          `;

          const [paymentResults] = await pool.query(
            paymentQuery,
            paymentParams
          );
          reportDataForExport = paymentResults;
          filename = "payment_history_report";
          break;

        case "overdueLoans":
          const overdueQuery = `
            SELECT 
              l.id,
              CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as client_name,
              COALESCE(c.phone, 'N/A') as phone,
              COALESCE(c.email, 'N/A') as email,
              ROUND(CAST(l.loan_amount AS DECIMAL(15,2)), 2) as loan_amount,
              ROUND(CAST(COALESCE(l.remaining_balance, l.loan_amount) AS DECIMAL(15,2)), 2) as amount_due,
              DATE_FORMAT(l.next_due_date, '%Y-%m-%d') as next_due_date,
              COALESCE(DATEDIFF(NOW(), l.next_due_date), 0) as days_overdue,
              ROUND(CAST(COALESCE(l.interest_rate, 0) AS DECIMAL(5,2)), 2) as interest_rate,
              CASE 
                WHEN COALESCE(DATEDIFF(NOW(), l.next_due_date), 0) <= 7 THEN 'Recent'
                WHEN COALESCE(DATEDIFF(NOW(), l.next_due_date), 0) <= 30 THEN 'Moderate'
                ELSE 'Severe'
              END as overdue_severity
            FROM loans l
            JOIN clients c ON l.client_id = c.id
            WHERE l.status IN ('active', 'overdue') 
            AND l.next_due_date IS NOT NULL
            AND l.next_due_date < NOW()
            AND CAST(COALESCE(l.remaining_balance, l.loan_amount) AS DECIMAL(15,2)) > 0
            ORDER BY days_overdue DESC, amount_due DESC
          `;

          const [overdueResults] = await pool.query(overdueQuery);
          reportDataForExport = overdueResults;
          filename = "overdue_loans_report";
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid report type",
          });
      }
    } catch (dbError) {
      console.error("[Export Report] Database error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database query failed",
        error: dbError.message,
      });
    }

    console.log(`[Export Report] Found ${reportDataForExport.length} records`);

    if (reportDataForExport.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data available for export",
      });
    }

    if (format === "excel") {
      try {
        // Generate actual Excel file using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Report Data");

        // Get headers from the first row of data
        const headers = Object.keys(reportDataForExport[0]);

        // Set up columns with headers
        worksheet.columns = headers.map((header) => ({
          header: header.replace(/_/g, " ").toUpperCase(), // Format header names
          key: header,
          width: 15, // Set default column width
        }));

        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "366092" },
        };
        headerRow.alignment = { horizontal: "center" };

        // Add data rows
        reportDataForExport.forEach((row) => {
          const formattedRow = {};
          headers.forEach((header) => {
            let value = row[header];
            // Handle dates
            if (value instanceof Date) {
              value = value.toISOString().split("T")[0];
            }
            // Handle null/undefined values
            if (value === null || value === undefined) {
              value = "";
            }
            formattedRow[header] = value;
          });
          worksheet.addRow(formattedRow);
        });

        // Auto-fit columns based on content
        worksheet.columns.forEach((column) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 10), 50); // Min 10, Max 50
        });

        // Add borders to all cells
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });

        const fileName = `${filename}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`;

        console.log(`[Export Report] Generated Excel file: ${fileName}`);

        // Set proper headers for Excel file download
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );

        // Generate and send the Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        return res.send(buffer);
      } catch (excelError) {
        console.error("[Export Report] Excel generation error:", excelError);
        return res.status(500).json({
          success: false,
          message: "Excel generation failed",
          error: excelError.message,
        });
      }
    } else if (format === "csv") {
      try {
        // Generate CSV format
        const headers = Object.keys(reportDataForExport[0]);
        const csvContent = [
          headers.join(","), // Header row
          ...reportDataForExport.map((row) =>
            headers
              .map((header) => {
                let value = row[header];
                // Handle null/undefined values
                if (value === null || value === undefined) {
                  value = "";
                }
                // Handle dates
                if (value instanceof Date) {
                  value = value.toISOString().split("T")[0];
                }
                // Wrap in quotes and escape existing quotes
                return `"${String(value).replace(/"/g, '""')}"`;
              })
              .join(",")
          ),
        ].join("\n");

        const fileName = `${filename}_${
          new Date().toISOString().split("T")[0]
        }.csv`;

        console.log(
          `[Export Report] Generated CSV with ${csvContent.length} characters`
        );
        console.log(`[Export Report] Filename: ${fileName}`);

        // Set proper headers for file download
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
        res.setHeader("Content-Length", Buffer.byteLength(csvContent, "utf8"));

        // Send the CSV content
        return res.send(csvContent);
      } catch (csvError) {
        console.error("[Export Report] CSV generation error:", csvError);
        return res.status(500).json({
          success: false,
          message: "CSV generation failed",
          error: csvError.message,
        });
      }
    } else {
      // Return JSON response
      return res.status(200).json({
        success: true,
        data: reportDataForExport,
        meta: {
          filename: `${filename}_${new Date().toISOString().split("T")[0]}`,
          format: format,
          generated_at: new Date().toISOString(),
          record_count: reportDataForExport.length,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting report:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to export report",
        error: error.message,
      });
    }
  }
};

// Get loan analytics (simplified version of dashboard analytics)
exports.getLoanAnalytics = async (req, res) => {
  try {
    console.log("[getLoanAnalytics] Starting query...");

    const [analytics] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN l.status IN ('active', 'overdue', 'approved') THEN 1 END) as total_active_loans,
        COALESCE(SUM(CASE WHEN l.status IN ('active', 'overdue') THEN COALESCE(l.remaining_balance, l.loan_amount) ELSE 0 END), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN p.payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND p.status = 'completed' THEN p.amount ELSE 0 END), 0) as monthly_collections,
        COALESCE(AVG(l.loan_amount), 0) as average_loan_amount
      FROM loans l
      LEFT JOIN payments p ON l.id = p.loan_id
    `);

    console.log("[getLoanAnalytics] Query result:", analytics[0]);

    res.status(200).json({
      success: true,
      data: analytics[0] || {
        total_active_loans: 0,
        total_outstanding: 0,
        monthly_collections: 0,
        average_loan_amount: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching loan analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch loan analytics",
      error: error.message,
    });
  }
};

// Get database status (sample implementation)
exports.getDatabaseStatus = async (req, res) => {
  try {
    // Check basic connectivity
    await pool.query("SELECT 1");

    // Check table row counts as a basic health check
    const [clientCount] = await pool.query(
      "SELECT COUNT(*) as count FROM clients"
    );
    const [paymentCount] = await pool.query(
      "SELECT COUNT(*) as count FROM payments"
    );
    const [loanCount] = await pool.query("SELECT COUNT(*) as count FROM loans");

    // Sample data retrieval
    const [clientSample] = await pool.query("SELECT * FROM clients LIMIT 5");
    const [paymentSample] = await pool.query("SELECT * FROM payments LIMIT 5");
    const [loanSample] = await pool.query("SELECT * FROM loans LIMIT 5");

    res.status(200).json({
      success: true,
      data: {
        client_count: clientCount[0].count,
        payment_count: paymentCount[0].count,
        loan_count: loanCount[0].count,
        client_sample: clientSample,
        payment_sample: paymentSample,
        loan_sample: loanSample,
      },
    });
  } catch (error) {
    console.error("Error checking database status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check database status",
      error: error.message,
    });
  }
};
