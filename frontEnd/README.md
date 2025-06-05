# Loan Management System (LMS) - Frontend

This repository contains the frontend application for a comprehensive Loan Management System built with React, TypeScript, and modern UI components.

## Project Overview

This Loan Management System provides a complete solution for financial institutions to manage their loan operations, including:

- **Client Management**: Comprehensive client profiles with contact information, identification details, and status tracking
- **Loan Management**: Full loan lifecycle management from application to completion
- **Payment Processing**: Track payments, collections, and overdue accounts
- **Dashboard Analytics**: Real-time insights and performance metrics
- **Reporting**: Detailed reports for loans, clients, and financial performance

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **React Router** for navigation
- **Recharts** for data visualization
- **React Icons** for iconography

### Backend Integration

- **RESTful API** communication
- **JWT Authentication** for secure access
- **Real-time data** synchronization

## Key Features

### 🏦 Client Management

- Create, update, and manage client profiles
- Advanced search and filtering capabilities
- Client status tracking (Active, Inactive, Blacklisted)
- Contact information management
- Geographic data with city/state organization

### 💰 Loan Management

- Complete loan application workflow
- Loan approval and disbursement tracking
- Interest calculation and payment scheduling
- Loan status management (Pending, Approved, Active, Paid, Defaulted)
- Comprehensive loan portfolio overview

### 📊 Dashboard & Analytics

- Real-time performance metrics
- Interactive charts and visualizations
- Portfolio health indicators
- Collection rate tracking
- Monthly performance summaries

### 💳 Payment Processing

- Payment recording and tracking
- Multiple payment methods support
- Overdue payment identification
- Payment history and receipts
- Automated reminder systems

### 📈 Reporting System

- Loan summary reports
- Client performance analysis
- Payment history tracking
- Overdue loan management
- Export capabilities (PDF, Excel)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API server running

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd lms/frontEnd
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Configure your API URL and other settings
VITE_API_URL=http://localhost:5000
```

4. Start the development server:

```bash
npm run dev
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── forms/           # Form components
│   ├── pages/           # Page components
│   └── ui/              # Base UI components
├── services/            # API service functions
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── styles/              # Global styles and themes
```

## API Integration

The frontend communicates with a Node.js/Express backend through RESTful APIs:

- **Authentication**: JWT-based secure authentication
- **Client Management**: CRUD operations for client data
- **Loan Management**: Complete loan lifecycle APIs
- **Payment Processing**: Payment recording and tracking
- **Analytics**: Real-time data for dashboard metrics

## Authentication & Security

- JWT token-based authentication
- Protected routes and components
- Role-based access control
- Secure API communication
- Input validation and sanitization

## UI/UX Features

- **Responsive Design**: Mobile-first approach with full responsiveness
- **Dark/Light Mode**: Theme switching capability
- **Glassmorphism**: Modern glass effect styling
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: ARIA compliant and keyboard navigation
- **Performance**: Optimized rendering and lazy loading

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## Database Integration

The system integrates with a MySQL database containing:

- **users** - System user accounts
- **clients** - Client information and profiles
- **loans** - Loan applications and details
- **payments** - Payment records and history

## Future Enhancements

- **Mobile App**: React Native implementation
- **Advanced Analytics**: Machine learning insights
- **Document Management**: File upload and storage
- **API Integration**: Third-party service connections
- **Audit Trails**: Complete activity logging
- **Backup Systems**: Automated data protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
