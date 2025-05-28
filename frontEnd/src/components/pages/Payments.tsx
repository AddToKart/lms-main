import React, { useState } from 'react';

interface Payment {
  id: number;
  loanId: number;
  clientName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Check' | 'Bank Transfer' | 'Credit Card';
  status: 'Completed' | 'Pending' | 'Failed';
  notes?: string;
}

const Payments: React.FC = () => {
  // Mock data
  const initialPayments: Payment[] = [
    {
      id: 1,
      loanId: 1,
      clientName: 'John Doe',
      amount: 450,
      paymentDate: '2024-05-01',
      paymentMethod: 'Bank Transfer',
      status: 'Completed'
    },
    {
      id: 2,
      loanId: 2,
      clientName: 'Jane Smith',
      amount: 520,
      paymentDate: '2024-05-05',
      paymentMethod: 'Credit Card',
      status: 'Completed'
    },
    {
      id: 3,
      loanId: 3,
      clientName: 'John Doe',
      amount: 450,
      paymentDate: '2024-05-10',
      paymentMethod: 'Cash',
      status: 'Pending',
      notes: 'Payment receipt pending confirmation'
    }
  ];

  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  // New payment form state
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    loanId: 0,
    clientName: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    status: 'Completed',
    notes: ''
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewPayment({ ...newPayment, [name]: value });
  };

  const handleAddPayment = () => {
    // In a real app, this would be submitted to a backend
    const newId = Math.max(...payments.map(payment => payment.id)) + 1;
    
    const paymentToAdd: Payment = {
      id: newId,
      loanId: Number(newPayment.loanId),
      clientName: newPayment.clientName || '',
      amount: Number(newPayment.amount),
      paymentDate: newPayment.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: (newPayment.paymentMethod as Payment['paymentMethod']) || 'Cash',
      status: (newPayment.status as Payment['status']) || 'Completed',
      notes: newPayment.notes
    };
    
    setPayments([...payments, paymentToAdd]);
    setIsAddingPayment(false);
    
    // Reset form
    setNewPayment({
      loanId: 0,
      clientName: '',
      amount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      status: 'Completed',
      notes: ''
    });
  };

  // Filter payments based on search term and date range
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.loanId.toString().includes(searchTerm);
    
    const paymentDateObj = new Date(payment.paymentDate);
    const fromDateObj = filterDateFrom ? new Date(filterDateFrom) : null;
    const toDateObj = filterDateTo ? new Date(filterDateTo) : null;
    
    const matchesDateRange = 
      (!fromDateObj || paymentDateObj >= fromDateObj) &&
      (!toDateObj || paymentDateObj <= toDateObj);
    
    return matchesSearch && matchesDateRange;
  });

  // Calculate total payments for the filtered list
  const calculateTotalPayments = () => {
    return filteredPayments.reduce((total, payment) => {
      return payment.status === 'Completed' ? total + payment.amount : total;
    }, 0);
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'Completed': return 'status-badge-success';
      case 'Pending': return 'status-badge-warning';
      case 'Failed': return 'status-badge-danger';
      default: return 'status-badge-info';
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Payment Management</h1>
        <div className="flex flex-col sm:flex-row items-end gap-4 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:items-end">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search by client or loan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pr-10 w-full"
              />
              <span className="material-icons absolute right-3 top-2 text-secondary-400 dark:text-secondary-500">search</span>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="text-sm text-secondary-700 dark:text-secondary-300 block mb-1">From</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="input py-1.5"
                />
              </div>
              <div>
                <label className="text-sm text-secondary-700 dark:text-secondary-300 block mb-1">To</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="input py-1.5"
                />
              </div>
            </div>
          </div>
          <button 
            className="btn btn-primary whitespace-nowrap h-[38px] self-end flex items-center gap-2 shadow-sm"
            onClick={() => setIsAddingPayment(true)}
          >
            <span className="material-icons text-sm">add</span>
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {isAddingPayment && (
        <div className="card mb-6 overflow-hidden">
          <div className="px-6 py-4 bg-secondary-50 dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold">Record New Payment</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Loan ID</label>
                <input
                  type="number"
                  name="loanId"
                  value={newPayment.loanId}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={newPayment.clientName}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={newPayment.amount}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Payment Date</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={newPayment.paymentDate}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={newPayment.paymentMethod}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={newPayment.status}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                value={newPayment.notes}
                onChange={handleInputChange}
                className="input h-24 resize-none"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button 
                className="btn btn-secondary"
                onClick={() => setIsAddingPayment(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddPayment}
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mr-4">
              <span className="material-icons">payments</span>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Payment Summary</p>
              <h3 className="text-2xl font-bold">${calculateTotalPayments().toLocaleString()}</h3>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Total collected</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400 mr-4">
              <span className="material-icons">check_circle</span>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Completed</p>
              <h3 className="text-2xl font-bold">
                {filteredPayments.filter(p => p.status === 'Completed').length}
              </h3>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Successful payments</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center text-warning-600 dark:text-warning-400 mr-4">
              <span className="material-icons">schedule</span>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Pending</p>
              <h3 className="text-2xl font-bold">
                {filteredPayments.filter(p => p.status === 'Pending').length}
              </h3>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Awaiting confirmation</p>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Loan ID</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Method</th>
              <th>Status</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td>{payment.loanId}</td>
                <td className="font-medium">{payment.clientName}</td>
                <td className="font-medium">${payment.amount}</td>
                <td>{payment.paymentDate}</td>
                <td>{payment.paymentMethod}</td>
                <td>
                  <span className={getStatusBadgeClass(payment.status)}>
                    {payment.status}
                  </span>
                </td>
                <td className="max-w-xs truncate">
                  {payment.notes || '-'}
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button 
                      className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
                      title="View Details"
                    >
                      <span className="material-icons text-primary-600 dark:text-primary-400">visibility</span>
                    </button>
                    <button 
                      className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
                      title="Print Receipt"
                    >
                      <span className="material-icons text-secondary-600 dark:text-secondary-400">print</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-secondary-500 dark:text-secondary-400">
                  No payments found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments; 