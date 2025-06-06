const pool = require("../db/database");

// Use ExcelJS instead of xlsx for better Excel compatibility
let ExcelJS;
try {
  ExcelJS = require("exceljs");
} catch (error) {
  console.error(
    "ExcelJS module not found. Please install it with: npm install exceljs"
  );
  ExcelJS = null;
}

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

// Export report function
const exportReport = async (req, res) => {
  try {
    const { type, format, date_from, date_to } = req.query;

    console.log(
      `[Export] Request received: type=${type}, format=${format}, from=${date_from}, to=${date_to}`
    );

    if (!type || !format) {
      console.log("[Export] Missing type or format parameter");
      return res.status(400).json({
        success: false,
        message: "Report type and format are required",
      });
    }

    // Check if ExcelJS is available for Excel exports
    if (
      (format.toLowerCase() === "excel" || format.toLowerCase() === "xlsx") &&
      !ExcelJS
    ) {
      console.log("[Export] ExcelJS module not available");
      return res.status(500).json({
        success: false,
        message:
          "Excel export functionality is not available. ExcelJS module is missing.",
      });
    }

    // Validate date parameters for date-dependent reports
    if (
      (type === "loanSummary" || type === "paymentHistory") &&
      (!date_from || !date_to)
    ) {
      console.log("[Export] Missing date parameters for date-dependent report");
      return res.status(400).json({
        success: false,
        message: "Date range is required for this report type",
      });
    }

    let data = [];
    let filename = "";
    let contentType = "";
    let fileExtension = "";

    // Set proper file extension and content type based on format
    switch (format.toLowerCase()) {
      case "excel":
      case "xlsx":
        fileExtension = ".xlsx";
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case "csv":
        fileExtension = ".csv";
        contentType = "text/csv; charset=utf-8";
        break;
      case "json":
        fileExtension = ".json";
        contentType = "application/json";
        break;
      default:
        console.log(`[Export] Unsupported format: ${format}`);
        return res.status(400).json({
          success: false,
          message: "Unsupported export format. Use excel, csv, or json.",
        });
    }

    // Get data based on report type
    try {
      switch (type) {
        case "loanSummary":
          console.log(
            `[Export] Getting loan summary data from ${date_from} to ${date_to}`
          );

          const loanSummaryQuery = `
            SELECT 
              DATE_FORMAT(l.created_at, '%Y-%m') as month,
              COUNT(*) as new_loans,
              SUM(l.loan_amount) as total_amount,
              AVG(l.interest_rate) as avg_interest,
              SUM(CASE WHEN l.status IN ('approved', 'active', 'paid_off', 'completed') THEN 1 ELSE 0 END) as approved_count,
              SUM(CASE WHEN l.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
              COALESCE(SUM(p.principal_payments), 0) as total_principal_repaid,
              COALESCE(SUM(p.interest_payments), 0) as total_interest_repaid,
              SUM(CASE WHEN l.status IN ('paid_off', 'completed') THEN 1 ELSE 0 END) as fully_paid_loans_count,
              AVG(l.term_months) as avg_loan_term_months
            FROM loans l
            LEFT JOIN (
              SELECT 
                loan_id,
                SUM(CASE WHEN amount <= (SELECT COALESCE(approved_amount, loan_amount) FROM loans WHERE id = loan_id) THEN amount ELSE 0 END) as principal_payments,
                SUM(CASE WHEN amount > (SELECT COALESCE(approved_amount, loan_amount) FROM loans WHERE id = loan_id) THEN amount - (SELECT COALESCE(approved_amount, loan_amount) FROM loans WHERE id = loan_id) ELSE 0 END) as interest_payments
              FROM payments 
              WHERE status = 'completed'
              GROUP by loan_id
            ) p ON l.id = p.loan_id
            WHERE DATE(l.created_at) BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(l.created_at, '%Y-%m')
            ORDER BY month DESC
          `;

          const [loanSummaryRows] = await pool.execute(loanSummaryQuery, [
            date_from,
            date_to,
          ]);
          data = loanSummaryRows;
          filename = `loan_summary_${
            new Date().toISOString().split("T")[0]
          }${fileExtension}`;
          console.log(`[Export] Retrieved ${data.length} loan summary records`);
          break;

        case "paymentHistory":
          console.log(
            `[Export] Getting payment history data from ${date_from} to ${date_to}`
          );

          const paymentHistoryQuery = `
            SELECT 
              DATE(p.payment_date) as date,
              COUNT(*) as total_payments,
              SUM(p.amount) as total_amount,
              SUM(CASE WHEN p.payment_date <= l.next_due_date OR l.next_due_date IS NULL THEN 1 ELSE 0 END) as on_time_payments,
              SUM(CASE WHEN p.payment_date > l.next_due_date AND l.next_due_date IS NOT NULL THEN 1 ELSE 0 END) as late_payments,
              AVG(p.amount) as avg_payment_amount
            FROM payments p
            JOIN loans l ON p.loan_id = l.id
            WHERE p.status = 'completed' 
            AND DATE(p.payment_date) BETWEEN ? AND ?
            GROUP BY DATE(p.payment_date)
            ORDER BY date DESC
          `;

          const [paymentHistoryRows] = await pool.execute(paymentHistoryQuery, [
            date_from,
            date_to,
          ]);
          data = paymentHistoryRows;
          filename = `payment_history_${
            new Date().toISOString().split("T")[0]
          }${fileExtension}`;
          console.log(
            `[Export] Retrieved ${data.length} payment history records`
          );
          break;

        case "overdueLoans":
          console.log(`[Export] Getting overdue loans data`);

          const overdueLoansQuery = `
            SELECT 
              l.id,
              CONCAT(c.first_name, ' ', c.last_name) as client_name,
              c.phone,
              c.email,
              DATEDIFF(CURDATE(), l.next_due_date) as days_overdue,
              l.remaining_balance as amount_due,
              l.loan_amount,
              CASE 
                WHEN DATEDIFF(CURDATE(), l.next_due_date) > 90 THEN 'Severe'
                WHEN DATEDIFF(CURDATE(), l.next_due_date) > 30 THEN 'Moderate'
                ELSE 'Mild'
              END as overdue_severity
            FROM loans l
            JOIN clients c ON l.client_id = c.id
            WHERE l.status IN ('active', 'overdue')
            AND l.next_due_date IS NOT NULL
            AND l.next_due_date < CURDATE()
            AND COALESCE(l.remaining_balance, l.approved_amount, l.loan_amount) > 0
            ORDER BY days_overdue DESC, amount_due DESC
          `;

          const [overdueLoansRows] = await pool.execute(overdueLoansQuery);
          data = overdueLoansRows;
          filename = `overdue_loans_${
            new Date().toISOString().split("T")[0]
          }${fileExtension}`;
          console.log(`[Export] Retrieved ${data.length} overdue loan records`);
          break;

        default:
          console.log(`[Export] Invalid report type: ${type}`);
          return res.status(400).json({
            success: false,
            message: "Invalid report type",
          });
      }

      console.log(
        `[Export] Successfully retrieved ${data.length} records for ${type}`
      );

      if (data.length === 0) {
        console.log(`[Export] No data found for ${type}`);
        return res.status(404).json({
          success: false,
          message: "No data available for export with the specified criteria",
        });
      }
    } catch (dataError) {
      console.error(
        `[Export] Database error retrieving ${type} data:`,
        dataError
      );
      return res.status(500).json({
        success: false,
        message: `Failed to retrieve ${type} data: ${dataError.message}`,
      });
    }

    // Handle different export formats
    if (format.toLowerCase() === "json") {
      console.log(`[Export] Generating JSON export for ${filename}`);
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      return res.json({
        success: true,
        data: data,
        exported_at: new Date().toISOString(),
        total_records: data.length,
      });
    }

    if (format.toLowerCase() === "csv") {
      console.log(`[Export] Generating CSV export for ${filename}`);

      // Generate CSV content with BOM for proper UTF-8 encoding
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Handle null/undefined values
              if (value === null || value === undefined) return "";
              // Escape quotes and wrap in quotes if contains comma, quote, or newline
              const stringValue = String(value);
              if (
                stringValue.includes(",") ||
                stringValue.includes('"') ||
                stringValue.includes("\n")
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(",")
        ),
      ].join("\n");

      // Add UTF-8 BOM for proper Excel compatibility
      const csvWithBOM = "\uFEFF" + csvContent;

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", Buffer.byteLength(csvWithBOM, "utf8"));
      return res.send(csvWithBOM);
    }

    if (format.toLowerCase() === "excel" || format.toLowerCase() === "xlsx") {
      console.log(`[Export] Generating Excel export for ${filename}`);

      try {
        if (!ExcelJS) {
          throw new Error("ExcelJS module is not available");
        }

        // Create a new workbook and worksheet using ExcelJS
        const workbook = new ExcelJS.Workbook();

        // Set workbook properties for better Excel compatibility
        workbook.creator = "LMS Report System";
        workbook.lastModifiedBy = "LMS Report System";
        workbook.created = new Date();
        workbook.modified = new Date();

        const worksheet = workbook.addWorksheet("Report Data", {
          pageSetup: {
            paperSize: 9, // A4
            orientation: "landscape",
            fitToPage: true,
            fitToHeight: 1,
            fitToWidth: 1,
          },
        });

        if (data.length > 0) {
          // Get headers from the first row
          const headers = Object.keys(data[0]);

          // Define column headers with better formatting
          const columnHeaders = headers.map((header) => {
            // Convert snake_case to Title Case
            return header
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
          });

          // Set up columns with proper widths and formatting
          worksheet.columns = headers.map((header, index) => ({
            header: columnHeaders[index],
            key: header,
            width: Math.max(columnHeaders[index].length + 2, 15), // Minimum width of 15
          }));

          // Style the header row
          const headerRow = worksheet.getRow(1);
          headerRow.font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
            size: 12,
          };
          headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" }, // Professional blue
          };
          headerRow.alignment = {
            vertical: "middle",
            horizontal: "center",
          };
          headerRow.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
          };

          // Add data rows with proper formatting
          data.forEach((row, rowIndex) => {
            const values = headers.map((header) => {
              const value = row[header];

              // Handle different data types
              if (value === null || value === undefined) return "";

              // Format numbers properly
              if (typeof value === "number") {
                // Check if it's a currency field
                if (header.includes("amount") || header.includes("balance")) {
                  return Number(value);
                }
                // Check if it's a percentage
                if (header.includes("rate") || header.includes("interest")) {
                  return Number(value);
                }
                return Number(value);
              }

              // Handle dates
              if (header.includes("date") && value) {
                try {
                  return new Date(value);
                } catch (e) {
                  return String(value);
                }
              }

              return String(value);
            });

            const dataRow = worksheet.addRow(values);

            // Apply alternating row colors for better readability
            if (rowIndex % 2 === 1) {
              dataRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF8F9FA" }, // Light gray
              };
            }

            // Add borders to all cells
            dataRow.eachCell((cell, colIndex) => {
              cell.border = {
                top: { style: "thin", color: { argb: "FFD0D0D0" } },
                left: { style: "thin", color: { argb: "FFD0D0D0" } },
                bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
                right: { style: "thin", color: { argb: "FFD0D0D0" } },
              };

              // Apply number formatting
              const header = headers[colIndex - 1];
              if (
                header &&
                (header.includes("amount") || header.includes("balance"))
              ) {
                cell.numFmt = "$#,##0.00";
              } else if (
                header &&
                (header.includes("rate") || header.includes("interest"))
              ) {
                cell.numFmt = "0.00%";
              } else if (header && header.includes("date")) {
                cell.numFmt = "mm/dd/yyyy";
              }

              // Center align numbers
              if (typeof cell.value === "number") {
                cell.alignment = { horizontal: "right", vertical: "middle" };
              } else {
                cell.alignment = { horizontal: "left", vertical: "middle" };
              }
            });
          });

          // Auto-fit columns based on content
          worksheet.columns.forEach((column, index) => {
            let maxLength = column.header ? column.header.length : 10;

            // Check data length for each column
            data.forEach((row) => {
              const value = row[headers[index]];
              const cellLength = value ? String(value).length : 0;
              maxLength = Math.max(maxLength, cellLength);
            });

            // Set width with reasonable limits
            column.width = Math.min(Math.max(maxLength + 2, 10), 50);
          });
        }

        // Generate Excel buffer with proper MIME type
        console.log(`[Export] Creating Excel workbook buffer...`);
        const excelBuffer = await workbook.xlsx.writeBuffer();

        console.log(
          `[Export] Excel file generated successfully using ExcelJS, size: ${excelBuffer.length} bytes`
        );

        // Set proper headers for Excel download
        res.setHeader("Content-Type", contentType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );
        res.setHeader("Content-Length", excelBuffer.length);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        return res.send(excelBuffer);
      } catch (excelError) {
        console.error("[Export] Excel generation error:", excelError);
        return res.status(500).json({
          success: false,
          message: "Failed to generate Excel file",
          error: excelError.message,
        });
      }
    }

    console.log(`[Export] Unsupported format reached end: ${format}`);
    return res.status(400).json({
      success: false,
      message: "Unsupported export format",
    });
  } catch (error) {
    console.error("[Export] General error:", error);
    // Make sure we haven't already sent a response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to export report",
        error: error.message,
      });
    }
  }
};

module.exports = {
  getLoanAnalytics,
  getLoanSummaryReport,
  getPaymentHistoryReport,
  getOverdueLoansReport,
  exportReport,
};
