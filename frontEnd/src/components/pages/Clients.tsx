import React, { useState } from 'react';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  activeLoans: number;
}

const Clients: React.FC = () => {
  // Mock data
  const initialClients: Client[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      address: '123 Main St, Anytown, CA 12345',
      joinDate: '2023-01-15',
      activeLoans: 2
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '(555) 987-6543',
      address: '456 Oak Ave, Somewhere, NY 54321',
      joinDate: '2023-03-22',
      activeLoans: 1
    },
    {
      id: 3,
      name: 'Michael Johnson',
      email: 'michael.j@example.com',
      phone: '(555) 456-7890',
      address: '789 Pine Rd, Nowhere, TX 67890',
      joinDate: '2023-05-10',
      activeLoans: 0
    }
  ];

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [editClientId, setEditClientId] = useState<number | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (editClientId !== null) {
      setClients(clients.map(client => 
        client.id === editClientId 
          ? { ...client, [name]: value } 
          : client
      ));
    } else {
      setNewClient({ ...newClient, [name]: value });
    }
  };

  const handleAddClient = () => {
    // In a real app, this would be submitted to a backend
    const newId = Math.max(...clients.map(client => client.id)) + 1;
    const today = new Date().toISOString().split('T')[0];
    
    const clientToAdd: Client = {
      id: newId,
      name: newClient.name || '',
      email: newClient.email || '',
      phone: newClient.phone || '',
      address: newClient.address || '',
      joinDate: today,
      activeLoans: 0
    };
    
    setClients([...clients, clientToAdd]);
    setNewClient({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setIsAddingClient(false);
  };

  const handleEditClient = (id: number) => {
    setEditClientId(id);
  };

  const handleSaveEdit = () => {
    setEditClientId(null);
  };

  const handleCancelEdit = () => {
    setEditClientId(null);
    // Reset client data to original state if needed
  };

  const handleDeleteClient = (id: number) => {
    // In a real app, this would be submitted to a backend
    setClients(clients.filter(client => client.id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-semibold">Client Management</h1>
        <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-icons text-secondary-400 dark:text-secondary-500">search</span>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddingClient(true)}
          >
            <span className="material-icons text-sm">add</span>
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {isAddingClient && (
        <div className="card mb-6 overflow-hidden">
          <div className="px-6 py-4 bg-secondary-50 dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold">Add New Client</h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newClient.name}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={newClient.email}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={newClient.phone}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  value={newClient.address}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsAddingClient(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleAddClient}
              >
                Save Client
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Join Date</th>
              <th>Active Loans</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map(client => (
              <tr key={client.id}>
                <td>
                  {editClientId === client.id ? (
                    <input
                      type="text"
                      name="name"
                      value={client.name}
                      onChange={handleInputChange}
                      className="input"
                    />
                  ) : (
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">{client.name}</div>
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  {editClientId === client.id ? (
                    <input
                      type="email"
                      name="email"
                      value={client.email}
                      onChange={handleInputChange}
                      className="input"
                    />
                  ) : (
                    <div className="text-sm">{client.email}</div>
                  )}
                </td>
                <td>
                  {editClientId === client.id ? (
                    <input
                      type="tel"
                      name="phone"
                      value={client.phone}
                      onChange={handleInputChange}
                      className="input"
                    />
                  ) : (
                    <div className="text-sm">{client.phone}</div>
                  )}
                </td>
                <td>
                  {editClientId === client.id ? (
                    <input
                      type="text"
                      name="address"
                      value={client.address}
                      onChange={handleInputChange}
                      className="input"
                    />
                  ) : (
                    <div className="text-sm truncate max-w-xs">{client.address}</div>
                  )}
                </td>
                <td>
                  <div className="text-sm">{client.joinDate}</div>
                </td>
                <td>
                  <div className="text-sm">
                    {client.activeLoans > 0 ? (
                      <span className="status-badge-info">{client.activeLoans}</span>
                    ) : (
                      <span>0</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    {editClientId === client.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
                          title="Save"
                        >
                          <span className="material-icons text-success-600 dark:text-success-400">check</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
                          title="Cancel"
                        >
                          <span className="material-icons text-danger-600 dark:text-danger-400">close</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClient(client.id)}
                          className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
                          title="Edit"
                        >
                          <span className="material-icons text-primary-600 dark:text-primary-400">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800"
                          title="Delete"
                        >
                          <span className="material-icons text-danger-600 dark:text-danger-400">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-secondary-500 dark:text-secondary-400">
                  No clients found matching your search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm text-secondary-500 dark:text-secondary-400">
        <div>
          Showing {filteredClients.length} of {clients.length} clients
        </div>
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 rounded border border-secondary-300 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Previous
          </button>
          <button 
            className="px-3 py-1 rounded border border-secondary-300 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Clients; 