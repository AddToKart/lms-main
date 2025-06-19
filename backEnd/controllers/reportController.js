const pool = require("../config/db");

// Export loan summary report
exports.exportLoanSummary = async (req, res) => {
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

    if (date_from && date_to) {
      dateFilter = "WHERE l.created_at BETWEEN ? AND ?";
      params.push(date_from, date_to);
    } else if (date_from) {
      dateFilter = "WHERE l.created_at >= ?";
      params.push(date_from);
    } else if (date_to) {
      dateFilter = "WHERE l.created_at <= ?";
      params.push(date_to);
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
      // Generate Excel file
      const ExcelJS = require("exceljs");
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
