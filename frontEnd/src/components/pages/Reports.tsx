import React, { useState } from 'react';

type ReportType = 'loanSummary' | 'clientSummary' | 'paymentHistory' | 'overdueLoans';

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('loanSummary');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    to: new Date().toISOString().split('T')[0] // Today
  });

  // Mock data for reports
  const loanSummaryData = [
    { month: 'January', newLoans: 12, totalAmount: 45000, avgInterest: 8.5 },
    { month: 'February', newLoans: 15, totalAmount: 52000, avgInterest: 8.2 },
    { month: 'March', newLoans: 18, totalAmount: 67000, avgInterest: 7.9 },
    { month: 'April', newLoans: 14, totalAmount: 55000, avgInterest: 8.1 },
    { month: 'May', newLoans: 16, totalAmount: 61000, avgInterest: 8.0 }
  ];

  const clientSummaryData = [
    { id: 1, name: 'John Doe', totalLoans: 3, activeLoans: 2, totalBorrowed: 15000, paymentStatus: 'Good' },
    { id: 2, name: 'Jane Smith', totalLoans: 1, activeLoans: 1, totalBorrowed: 10000, paymentStatus: 'Good' },
    { id: 3, name: 'Michael Johnson', totalLoans: 2, activeLoans: 1, totalBorrowed: 7500, paymentStatus: 'Warning' },
    { id: 4, name: 'Sarah Williams', totalLoans: 1, activeLoans: 1, totalBorrowed: 5000, paymentStatus: 'Good' },
    { id: 5, name: 'Robert Brown', totalLoans: 2, activeLoans: 0, totalBorrowed: 8000, paymentStatus: 'Completed' }
  ];

  const paymentHistoryData = [
    { date: '2024-05-01', totalPayments: 12, totalAmount: 4850, onTimePayments: 10, latePayments: 2 },
    { date: '2024-05-02', totalPayments: 8, totalAmount: 3200, onTimePayments: 8, latePayments: 0 },
    { date: '2024-05-03', totalPayments: 5, totalAmount: 2100, onTimePayments: 4, latePayments: 1 },
    { date: '2024-05-04', totalPayments: 10, totalAmount: 4050, onTimePayments: 9, latePayments: 1 },
    { date: '2024-05-05', totalPayments: 15, totalAmount: 6200, onTimePayments: 14, latePayments: 1 }
  ];

  const overdueLoansData = [
    { id: 3, clientName: 'Michael Johnson', daysOverdue: 15, amountDue: 750, totalBalance: 1500, contactInfo: '(555) 456-7890' },
    { id: 7, clientName: 'Emily Davis', daysOverdue: 30, amountDue: 1200, totalBalance: 4800, contactInfo: '(555) 222-3333' },
    { id: 12, clientName: 'David Wilson', daysOverdue: 10, amountDue: 450, totalBalance: 3750, contactInfo: '(555) 777-8888' },
    { id: 15, clientName: 'Jennifer Garcia', daysOverdue: 5, amountDue: 650, totalBalance: 5850, contactInfo: '(555) 111-9999' }
  ];

  const handleReportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedReport(e.target.value as ReportType);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Good': return 'status-badge-success';
      case 'Warning': return 'status-badge-warning';
      case 'Completed': return 'status-badge-info';
      default: return 'status-badge-info';
    }
  };

  const renderReportContent = () => {
    switch(selectedReport) {
      case 'loanSummary':
        return (
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Loan Summary Report</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
              Monthly summary of new loans, total amount disbursed, and average interest rates.
            </p>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>New Loans</th>
                    <th>Total Amount</th>
                    <th>Average Interest Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {loanSummaryData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.month}</td>
                      <td>{item.newLoans}</td>
                      <td>${item.totalAmount.toLocaleString()}</td>
                      <td>{item.avgInterest}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-secondary-50 dark:bg-secondary-800">
                    <td className="font-semibold">Total</td>
                    <td className="font-semibold">{loanSummaryData.reduce((total, item) => total + item.newLoans, 0)}</td>
                    <td className="font-semibold">${loanSummaryData.reduce((total, item) => total + item.totalAmount, 0).toLocaleString()}</td>
                    <td className="font-semibold">
                      {(loanSummaryData.reduce((total, item) => total + item.avgInterest, 0) / loanSummaryData.length).toFixed(2)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      
      case 'clientSummary':
        return (
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Client Summary Report</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
              Summary of clients' borrowing history and current loan status.
            </p>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client ID</th>
                    <th>Name</th>
                    <th>Total Loans</th>
                    <th>Active Loans</th>
                    <th>Total Borrowed</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clientSummaryData.map((client) => (
                    <tr key={client.id}>
                      <td>{client.id}</td>
                      <td className="font-medium">{client.name}</td>
                      <td>{client.totalLoans}</td>
                      <td>{client.activeLoans}</td>
                      <td>${client.totalBorrowed.toLocaleString()}</td>
                      <td>
                        <span className={getStatusBadgeClass(client.paymentStatus)}>
                          {client.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'paymentHistory':
        return (
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Payment History Report</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
              Daily record of payments received, including on-time and late payments.
            </p>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Payments</th>
                    <th>Total Amount</th>
                    <th>On-Time Payments</th>
                    <th>Late Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistoryData.map((item, index) => (
                    <tr key={index}>
                      <td>{item.date}</td>
                      <td>{item.totalPayments}</td>
                      <td>${item.totalAmount.toLocaleString()}</td>
                      <td>{item.onTimePayments}</td>
                      <td>{item.latePayments}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-secondary-50 dark:bg-secondary-800">
                    <td className="font-semibold">Total</td>
                    <td className="font-semibold">{paymentHistoryData.reduce((total, item) => total + item.totalPayments, 0)}</td>
                    <td className="font-semibold">${paymentHistoryData.reduce((total, item) => total + item.totalAmount, 0).toLocaleString()}</td>
                    <td className="font-semibold">{paymentHistoryData.reduce((total, item) => total + item.onTimePayments, 0)}</td>
                    <td className="font-semibold">{paymentHistoryData.reduce((total, item) => total + item.latePayments, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      
      case 'overdueLoans':
        return (
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Overdue Loans Report</h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
              List of loans with overdue payments that require follow-up.
            </p>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Client Name</th>
                    <th>Days Overdue</th>
                    <th>Amount Due</th>
                    <th>Total Balance</th>
                    <th>Contact Info</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueLoansData.map((loan) => (
                    <tr key={loan.id}>
                      <td>{loan.id}</td>
                      <td className="font-medium">{loan.clientName}</td>
                      <td>
                        <span className={`${loan.daysOverdue > 20 ? 'status-badge-danger' : loan.daysOverdue > 10 ? 'status-badge-warning' : 'status-badge-warning'}`}>
                          {loan.daysOverdue} days
                        </span>
                      </td>
                      <td className="font-medium text-danger-600 dark:text-danger-400">${loan.amountDue.toLocaleString()}</td>
                      <td>${loan.totalBalance.toLocaleString()}</td>
                      <td>{loan.contactInfo}</td>
                      <td>
                        <div className="flex space-x-2">
                          <button className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800" title="Send Reminder">
                            <span className="material-icons text-primary-600 dark:text-primary-400">mail</span>
                          </button>
                          <button className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800" title="Call Client">
                            <span className="material-icons text-success-600 dark:text-success-400">call</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      default:
        return <div>Select a report to view</div>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <div className="flex flex-col sm:flex-row items-end gap-4 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div>
              <label className="text-sm text-secondary-700 dark:text-secondary-300 block mb-1">Report Type</label>
              <select
                value={selectedReport}
                onChange={handleReportChange}
                className="input py-1.5"
              >
                <option value="loanSummary">Loan Summary</option>
                <option value="clientSummary">Client Summary</option>
                <option value="paymentHistory">Payment History</option>
                <option value="overdueLoans">Overdue Loans</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-secondary-700 dark:text-secondary-300 block mb-1">From Date</label>
              <input
                type="date"
                name="from"
                value={dateRange.from}
                onChange={handleDateChange}
                className="input py-1.5"
              />
            </div>
            <div>
              <label className="text-sm text-secondary-700 dark:text-secondary-300 block mb-1">To Date</label>
              <input
                type="date"
                name="to"
                value={dateRange.to}
                onChange={handleDateChange}
                className="input py-1.5"
              />
            </div>
          </div>
          <button className="btn btn-primary whitespace-nowrap h-[38px] flex items-center gap-2 shadow-sm">
            <span className="material-icons text-sm">download</span>
            <span>Export</span>
          </button>
        </div>
      </div>
      
      {renderReportContent()}
    </div>
  );
};

export default Reports; 