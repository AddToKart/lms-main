const pool = require("../db/database");

const checkData = async () => {
  try {
    console.log("🔍 Checking database data...");

    // Check table counts
    const [clientCount] = await pool.query(
      "SELECT COUNT(*) as count FROM clients"
    );
    const [loanCount] = await pool.query("SELECT COUNT(*) as count FROM loans");
    const [paymentCount] = await pool.query(
      "SELECT COUNT(*) as count FROM payments"
    );

    console.log(`📊 Database Status:`);
    console.log(`   Clients: ${clientCount[0].count}`);
    console.log(`   Loans: ${loanCount[0].count}`);
    console.log(`   Payments: ${paymentCount[0].count}`);

    if (loanCount[0].count === 0) {
      console.log(
        "\n⚠️  No loan data found. This is why Excel export is empty."
      );
      console.log(
        "   You need to add some loan data through the frontend first."
      );
    } else {
      // Show sample data
      console.log("\n📋 Sample Data:");

      const [sampleLoans] = await pool.query("SELECT * FROM loans LIMIT 3");
      console.log("   Sample Loans:", sampleLoans);

      if (paymentCount[0].count > 0) {
        const [samplePayments] = await pool.query(
          "SELECT * FROM payments LIMIT 3"
        );
        console.log("   Sample Payments:", samplePayments);
      }
    }
  } catch (error) {
    console.error("❌ Error checking data:", error);
  } finally {
    await pool.end();
  }
};

checkData();
