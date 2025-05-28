import React, { useState } from 'react';

interface Loan {
  id: number;
  clientId: number;
  clientName: string;
  amount: number;
  interestRate: number;
  term: number; // in months
  startDate: string;
  endDate: string;
  status: 'Active' | 'Paid' | 'Overdue' | 'Default';
  balance: number;
}

const Loans: React.FC = () => {
  // Mock data
  const initialLoans: Loan[] = [
    {
      id: 1,
      clientId: 1,
      clientName: 'John Doe',
      amount: 5000,
      interestRate: 10,
      term: 12,
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      status: 'Active',
      balance: 3750
    },
    {
      id: 2,
      clientId: 2,
      clientName: 'Jane Smith',
      amount: 10000,
      interestRate: 8,
      term: 24,
      startDate: '2024-03-22',
      endDate: '2026-03-22',
      status: 'Active',
      balance: 9500
    },
    {
      id: 3,
      clientId: 1,
      clientName: 'John Doe',
      amount: 2500,
      interestRate: 12,
      term: 6,
      startDate: '2023-11-10',
      endDate: '2024-05-10',
      status: 'Overdue',
      balance: 750
    }
  ];

  // Using underscore to indicate we're intentionally not using the setter for now
  // Will be implemented when adding/editing loans functionality
  const [loans, _setLoans] = useState<Loan[]>(initialLoans);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.id.toString().includes(searchTerm);
    
    const matchesStatus = selectedStatus === 'all' || loan.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['all', 'Active', 'Paid', 'Overdue', 'Default'];

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
  };

  const handleNewLoan = () => {
    // This would open a form or modal in a real application
    // For now, it's just a placeholder that uses _setLoans to satisfy TypeScript
    alert('New Loan functionality will be implemented in the future.');
    
    // Uncomment to implement adding a new loan
    /*
    const newLoan: Loan = {
      id: loans.length + 1,
      clientId: 0,
      clientName: '',
      amount: 0,
      interestRate: 0,
      term: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      balance: 0
    };
    _setLoans([...loans, newLoan]);
    */
  };

  const calculateTotalBalance = (loans: Loan[]) => {
    return loans.reduce((total, loan) => total + loan.balance, 0);
  };

  const handleViewLoanDetails = (loanId: number) => {
    // In a real app, navigate to loan details page or open modal
    console.log(`View loan details for loan #${loanId}`);
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Active': return 'status-badge-success';
      case 'Paid': return 'status-badge-info';
      case 'Overdue': return 'status-badge-warning';
      case 'Default': return 'status-badge-danger';
      default: return 'status-badge-info';
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-secondary-900 dark:text-white">Loan Management</h1>
        <div className="flex flex-col sm:flex-row items-end gap-4 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:items-end">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pr-10 w-full"
              />
              <span className="material-icons absolute right-3 top-2 text-secondary-400 dark:text-secondary-500">search</span>
            </div>
            <div>
              <label className="text-sm text-secondary-700 dark:text-secondary-300 block mb-1">Status</label>
              <select 
                value={selectedStatus} 
                onChange={handleStatusChange}
                className="input py-1.5"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All' : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button 
            className="btn btn-primary whitespace-nowrap h-[38px] self-end flex items-center gap-2 shadow-sm" 
            onClick={handleNewLoan}
          >
            <span className="material-icons text-sm">add</span>
            <span>New Loan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mr-4">
              <span className="material-icons">account_balance</span>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Total Active Loans</p>
              <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">
                {loans.filter(loan => loan.status === 'Active').length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400 mr-4">
              <span className="material-icons">payments</span>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Total Outstanding Balance</p>
              <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">
                ${calculateTotalBalance(loans).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center text-warning-600 dark:text-warning-400 mr-4">
              <span className="material-icons">warning</span>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Overdue Loans</p>
              <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">
                {loans.filter(loan => loan.status === 'Overdue').length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Interest</th>
              <th>Term</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Balance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.map(loan => (
              <tr key={loan.id}>
                <td>{loan.id}</td>
                <td className="font-medium">{loan.clientName}</td>
                <td>${loan.amount.toLocaleString()}</td>
                <td>{loan.interestRate}%</td>
                <td>{loan.term} months</td>
                <td>{loan.startDate}</td>
                <td>{loan.endDate}</td>
                <td>
                  <span className={getStatusBadgeClass(loan.status)}>
                    {loan.status}
                  </span>
                </td>
                <td className="font-medium">${loan.balance.toLocaleString()}</td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button 
                      className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
                      onClick={() => handleViewLoanDetails(loan.id)}
                      title="View Details"
                    >
                      <span className="material-icons text-primary-600 dark:text-primary-400">visibility</span>
                    </button>
                    <button 
                      className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
                      title="Edit Loan"
                    >
                      <span className="material-icons text-secondary-600 dark:text-secondary-400">edit</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredLoans.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-secondary-500 dark:text-secondary-400">
                  No loans found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Loans; 