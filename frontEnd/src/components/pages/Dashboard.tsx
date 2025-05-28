import React from 'react';

const Dashboard: React.FC = () => {
  // Mock data
  const summaryData = {
    activeLoans: 128,
    totalClients: 245,
    overduePayments: 15,
    collectedThisMonth: 45750
  };

  const recentActivities = [
    {
      id: 1,
      date: 'May 10, 2025',
      type: 'payment',
      description: 'Payment received from John Doe',
      loanId: '12345',
      amount: 850.00,
      status: 'completed'
    },
    {
      id: 2, 
      date: 'May 9, 2025',
      type: 'approval',
      description: 'New loan approved for Jane Smith',
      loanId: '12342',
      amount: 5000.00,
      status: 'approved'
    },
    {
      id: 3,
      date: 'May 8, 2025',
      type: 'overdue',
      description: 'Payment overdue for Michael Johnson',
      loanId: '12336',
      amount: 750.00,
      status: 'overdue'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">Welcome to your Loan Management System</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button className="btn btn-secondary">
            <span className="material-icons text-sm">refresh</span>
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary">
            <span className="material-icons text-sm">calendar_today</span>
            <span>This Month</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="card relative overflow-hidden group transition-all duration-300 hover:shadow-lg">
          <div className="absolute right-0 top-0 h-full w-1 bg-primary-500 opacity-75"></div>
          <div className="flex items-center">
            <div className="h-14 w-14 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mr-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-icons text-2xl">account_balance</span>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Active Loans</p>
              <h3 className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">{summaryData.activeLoans}</h3>
              <p className="text-xs text-success-600 dark:text-success-400 flex items-center mt-2">
                <span className="material-icons text-sm mr-1">trending_up</span>
                <span>+4.5% from last month</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="card relative overflow-hidden group transition-all duration-300 hover:shadow-lg">
          <div className="absolute right-0 top-0 h-full w-1 bg-success-500 opacity-75"></div>
          <div className="flex items-center">
            <div className="h-14 w-14 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 dark:text-success-400 mr-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-icons text-2xl">people</span>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Total Clients</p>
              <h3 className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">{summaryData.totalClients}</h3>
              <p className="text-xs text-success-600 dark:text-success-400 flex items-center mt-2">
                <span className="material-icons text-sm mr-1">trending_up</span>
                <span>+2.8% from last month</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="card relative overflow-hidden group transition-all duration-300 hover:shadow-lg">
          <div className="absolute right-0 top-0 h-full w-1 bg-danger-500 opacity-75"></div>
          <div className="flex items-center">
            <div className="h-14 w-14 rounded-lg bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center text-danger-600 dark:text-danger-400 mr-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-icons text-2xl">warning</span>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Overdue Payments</p>
              <h3 className="text-3xl font-bold text-danger-600 dark:text-danger-400 mt-1">{summaryData.overduePayments}</h3>
              <p className="text-xs text-danger-600 dark:text-danger-400 flex items-center mt-2">
                <span className="material-icons text-sm mr-1">warning</span>
                <span>Requires attention</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="card relative overflow-hidden group transition-all duration-300 hover:shadow-lg">
          <div className="absolute right-0 top-0 h-full w-1 bg-primary-500 opacity-75"></div>
          <div className="flex items-center">
            <div className="h-14 w-14 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mr-4 group-hover:scale-110 transition-transform duration-300">
              <span className="material-icons text-2xl">payments</span>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Collected This Month</p>
              <h3 className="text-3xl font-bold text-secondary-900 dark:text-white mt-1">${summaryData.collectedThisMonth.toLocaleString()}</h3>
              <p className="text-xs text-success-600 dark:text-success-400 flex items-center mt-2">
                <span className="material-icons text-sm mr-1">trending_up</span>
                <span>+12.3% from last month</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <div className="flex items-center">
            <button className="p-1.5 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full transition-colors duration-150">
              <span className="material-icons text-secondary-500 dark:text-secondary-400">more_vert</span>
            </button>
          </div>
        </div>
        <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="px-6 py-4 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors duration-150">
              <div className="flex items-start">
                <div className={`
                  h-12 w-12 rounded-lg flex items-center justify-center mr-4 shadow-sm
                  ${activity.status === 'completed' ? 'bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400' : 
                    activity.status === 'approved' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 
                    'bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400'}
                `}>
                  <span className="material-icons text-xl">
                    {activity.status === 'completed' ? 'payments' : 
                      activity.status === 'approved' ? 'check_circle' : 
                      'schedule'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">
                        <span className="font-semibold">Loan #{activity.loanId}</span> - {activity.description}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{activity.date}</p>
                    </div>
                    <div className={`
                      text-sm font-semibold 
                      ${activity.status === 'completed' ? 'text-success-600 dark:text-success-400' : 
                        activity.status === 'approved' ? 'text-primary-600 dark:text-primary-400' : 
                        'text-warning-600 dark:text-warning-400'}
                    `}>
                      ${activity.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-secondary-50 dark:bg-secondary-800/50 border-t border-secondary-200 dark:border-secondary-700">
          <button className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 flex items-center justify-center w-full transition-colors duration-150">
            <span>View all activity</span>
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 