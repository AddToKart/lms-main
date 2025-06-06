# Loan Management System (LMS)

A comprehensive, full-stack loan management application designed for financial institutions to manage their complete loan lifecycle, from client onboarding to payment processing and reporting.

## 🏗️ System Architecture

### **Frontend**

- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS 3.4.17 with custom design system
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Icons**: Lucide React & React Icons
- **Charts**: Recharts for data visualization
- **State Management**: TanStack React Query 5.80.5
- **Routing**: React Router DOM 7.6.0

### **Backend**

- **Runtime**: Node.js with Express.js 4.18.2
- **Language**: JavaScript (ES6+)
- **Database**: MySQL 2 (mysql2 3.6.0 driver)
- **Authentication**: JWT (jsonwebtoken 9.0.0)
- **Security**: Helmet 7.2.0, Express Rate Limit 7.5.0
- **Password Hashing**: bcrypt 5.1.0
- **File Processing**: ExcelJS 4.3.0, XLSX 0.18.5
- **Environment**: dotenv 16.0.3
- **Logging**: Colors 1.4.0, Morgan 1.10.0

### **Database Design**

- **Engine**: MySQL 8.0+ with InnoDB storage engine
- **Character Set**: utf8mb4_unicode_ci (full Unicode support)
- **Architecture**: Normalized relational database (3NF/BCNF)
- **Key Tables**: users, clients, loans, payments
- **Features**: Foreign key constraints, triggers, indexes

## 🚀 Key Features

### **Client Management**

- ✅ Complete client profile management
- ✅ Contact information and identification tracking
- ✅ Client status management (Active, Inactive, Blacklisted)
- ✅ Advanced search and filtering
- ✅ Geographic organization by city/state

### **Loan Management**

- ✅ End-to-end loan application workflow
- ✅ Loan approval and disbursement tracking
- ✅ Multiple loan statuses (Pending, Approved, Active, Paid Off, Overdue, Defaulted)
- ✅ Interest rate calculation and payment scheduling
- ✅ Loan portfolio overview and analytics

### **Payment Processing**

- ✅ Multiple payment methods (Cash, Bank Transfer, Credit Card, Check, Online)
- ✅ Payment history tracking and receipts
- ✅ Automated balance calculations
- ✅ Overdue payment identification and management
- ✅ Payment status tracking (Pending, Completed, Failed)

### **Dashboard & Analytics**

- ✅ Real-time performance metrics
- ✅ Interactive charts and data visualizations
- ✅ Portfolio health indicators
- ✅ Collection rate tracking
- ✅ Monthly/quarterly performance summaries

### **Reporting System**

- ✅ Loan summary reports
- ✅ Client performance analysis
- ✅ Payment history reports
- ✅ Overdue loan management
- ✅ Excel export capabilities

### **Security & Authentication**

- ✅ JWT-based authentication system
- ✅ Role-based access control (Admin, Manager, Officer)
- ✅ Password encryption with bcrypt
- ✅ Rate limiting and security headers
- ✅ Protected API endpoints

## 📋 Prerequisites

### **System Requirements**

- **Node.js**: 18.0.0 or higher
- **MySQL**: 8.0 or higher
- **npm**: 9.0.0 or higher (or yarn 1.22.0+)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux

### **Development Tools**

- Git for version control
- VS Code (recommended) or any modern code editor
- MySQL Workbench or similar database management tool
- Postman or similar API testing tool

## ⚡ Quick Start Guide

### **1. Clone Repository**

```bash
git clone <repository-url>
cd lms-main
```

### **2. Database Setup**

#### **Create MySQL Database**

```sql
CREATE DATABASE lms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON lms_db.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
```

### **3. Backend Configuration**

#### **Navigate to Backend Directory**

```bash
cd backEnd
```

#### **Install Dependencies**

```bash
npm install
npm install colors@^1.4.0 express-rate-limit@^7.1.5 helmet@^7.1.0
```

#### **Environment Configuration**

Create `.env` file in `backEnd` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=lms_user
DB_PASSWORD=your_password
DB_NAME=lms_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

#### **Initialize Database**

```bash
# Run database migrations and create tables
npm run init-db

# Optional: Seed with sample data
npm run seed
```

#### **Start Backend Server**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### **4. Frontend Configuration**

#### **Navigate to Frontend Directory**

```bash
cd frontEnd
```

#### **Install Dependencies**

```bash
npm install
```

#### **Environment Configuration**

Create `.env` file in `frontEnd` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Loan Management System
VITE_APP_VERSION=1.0.0
```

#### **Start Frontend Development Server**

```bash
npm run dev
```

### **5. Access Application**

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🔑 Default Login Credentials

```
Username: admin
Password: admin123
Role: Administrator
```

**⚠️ Important**: Change default credentials immediately after first login!

## 📁 Project Structure

```
lms-main/
├── backEnd/                    # Node.js Express Backend
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── clientController.js
│   │   ├── loanController.js
│   │   ├── paymentController.js
│   │   └── reportsController.js
│   ├── db/                    # Database configuration
│   │   ├── database.js        # MySQL connection pool
│   │   ├── migrations.js      # Database migrations
│   │   └── schema.js          # Database schema
│   ├── middleware/            # Express middleware
│   │   └── auth.js            # JWT authentication
│   ├── routes/                # API route definitions
│   │   ├── authRoutes.js
│   │   ├── clientRoutes.js
│   │   ├── loanRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── reportRoutes.js
│   ├── scripts/               # Utility scripts
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Main server file
│
├── frontEnd/                   # React TypeScript Frontend
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── forms/         # Form components
│   │   │   ├── pages/         # Page components
│   │   │   └── ui/            # Reusable UI components
│   │   ├── services/          # API service functions
│   │   ├── types/             # TypeScript definitions
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # Main App component
│   │   ├── main.tsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── .env                   # Environment variables
│   ├── package.json
│   ├── tailwind.config.js     # Tailwind configuration
│   ├── tsconfig.json          # TypeScript configuration
│   └── vite.config.ts         # Vite configuration
│
└── README.md                   # This documentation
```

## 🔧 Development Commands

### **Backend Commands**

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run init-db        # Initialize database and create tables
npm run seed           # Populate database with sample data
```

### **Frontend Commands**

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

## 🛠️ API Documentation

### **Authentication Endpoints**

```
POST   /api/auth/login           # User login
POST   /api/auth/register        # User registration
GET    /api/auth/profile         # Get user profile
POST   /api/auth/change-password # Change password
POST   /api/auth/logout          # User logout
```

### **Client Management Endpoints**

```
GET    /api/clients              # Get all clients
GET    /api/clients/:id          # Get client by ID
POST   /api/clients              # Create new client
PUT    /api/clients/:id          # Update client
DELETE /api/clients/:id          # Delete client
GET    /api/clients/search       # Search clients
```

### **Loan Management Endpoints**

```
GET    /api/loans                # Get all loans
GET    /api/loans/:id            # Get loan by ID
POST   /api/loans                # Create new loan
PUT    /api/loans/:id            # Update loan
DELETE /api/loans/:id            # Delete loan
POST   /api/loans/:id/approve    # Approve loan
GET    /api/loans/client/:id     # Get loans by client
```

### **Payment Processing Endpoints**

```
GET    /api/payments             # Get all payments
GET    /api/payments/:id         # Get payment by ID
POST   /api/payments             # Record new payment
PUT    /api/payments/:id         # Update payment
DELETE /api/payments/:id         # Delete payment
GET    /api/payments/loan/:id    # Get payments by loan
```

### **Reporting Endpoints**

```
GET    /api/reports/analytics    # Dashboard analytics
GET    /api/reports/loan-summary # Loan summary report
GET    /api/reports/client-summary # Client summary report
GET    /api/reports/payment-history # Payment history
GET    /api/reports/overdue-loans # Overdue loans report
GET    /api/reports/export       # Export reports
```

## 🎨 UI/UX Features

### **Design System**

- **Theme**: Custom design system with light/dark mode support
- **Typography**: Inter font family for modern readability
- **Colors**: Comprehensive color palette with semantic naming
- **Components**: Consistent UI components using Shadcn/ui
- **Responsive**: Mobile-first design approach

### **User Experience**

- **Navigation**: Intuitive sidebar navigation with breadcrumbs
- **Forms**: Smart form validation with real-time feedback
- **Tables**: Advanced data tables with sorting, filtering, and pagination
- **Charts**: Interactive data visualizations using Recharts
- **Loading States**: Skeleton loaders and loading indicators
- **Error Handling**: User-friendly error messages and retry options

## 🔒 Security Features

### **Backend Security**

- **Authentication**: JWT token-based authentication
- **Authorization**: Role-based access control (RBAC)
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: API request rate limiting
- **Headers**: Security headers using Helmet.js
- **CORS**: Configured Cross-Origin Resource Sharing
- **Input Validation**: Server-side input validation and sanitization

### **Frontend Security**

- **Protected Routes**: Route-level authentication guards
- **Token Management**: Secure JWT token storage and handling
- **Input Sanitization**: Client-side input validation
- **HTTPS Ready**: Production-ready HTTPS configuration
- **XSS Protection**: Cross-site scripting prevention

## 📊 Database Schema

### **Core Tables**

```sql
users           # System users (admin, staff)
├── id (PK)
├── username (UNIQUE)
├── email (UNIQUE)
├── password_hash
├── role (admin/manager/officer)
└── audit fields

clients         # Loan applicants/borrowers
├── id (PK)
├── personal_info (name, email, phone)
├── address_info (address, city, state)
├── identification (id_type, id_number)
├── status (active/inactive/blacklisted)
└── audit fields

loans           # Loan products and applications
├── id (PK)
├── client_id (FK → clients)
├── financial_details (amount, interest_rate, term)
├── status (pending/approved/active/paid_off/overdue)
├── dates (start_date, end_date, next_due_date)
├── approved_by (FK → users)
└── audit fields

payments        # Payment transactions
├── id (PK)
├── loan_id (FK → loans)
├── client_id (FK → clients)
├── amount, payment_date, payment_method
├── status (pending/completed/failed)
├── processed_by (FK → users)
└── audit fields
```

## 🚀 Deployment

### **Production Deployment**

#### **Backend Deployment**

```bash
# Build production version
npm run build

# Set production environment
export NODE_ENV=production

# Start with PM2 (recommended)
pm2 start server.js --name "lms-backend"

# Or start directly
npm start
```

#### **Frontend Deployment**

```bash
# Build for production
npm run build

# Deploy dist/ folder to web server (Nginx, Apache, or CDN)
# Configure reverse proxy to backend API
```

#### **Database Optimization**

```sql
-- Production optimizations
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
SET GLOBAL max_connections = 500;
SET GLOBAL query_cache_size = 268435456; -- 256MB

-- Create additional indexes for performance
CREATE INDEX idx_loans_performance ON loans(status, next_due_date, client_id);
CREATE INDEX idx_payments_performance ON payments(payment_date, status, loan_id);
```

### **Environment-Specific Configurations**

#### **Production Environment Variables**

```env
NODE_ENV=production
DB_HOST=your-production-db-host
JWT_SECRET=your-super-secure-production-jwt-secret
FRONTEND_URL=https://your-domain.com
```

## 🔍 Troubleshooting

### **Common Issues**

#### **Database Connection Issues**

```bash
# Check MySQL service
sudo systemctl status mysql

# Test connection
mysql -u lms_user -p lms_db

# Check user privileges
SHOW GRANTS FOR 'lms_user'@'localhost';
```

#### **Frontend Build Issues**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### **Backend API Issues**

```bash
# Check server logs
npm run dev

# Test API health
curl http://localhost:5000/api/health

# Check environment variables
echo $NODE_ENV
```

## 🧪 Testing

### **Backend Testing**

```bash
# Run API tests (when implemented)
npm test

# Manual API testing with curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### **Frontend Testing**

```bash
# Run component tests (when implemented)
npm test

# E2E testing setup
npm run test:e2e
```

## 📈 Performance Monitoring

### **Database Performance**

```sql
-- Monitor slow queries
SHOW PROCESSLIST;
SHOW FULL PROCESSLIST;

-- Check table sizes
SELECT
    table_name AS "Table",
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'lms_db'
ORDER BY (data_length + index_length) DESC;
```

### **Application Monitoring**

- **Backend**: Built-in health check endpoint
- **Frontend**: Performance monitoring with React DevTools
- **Database**: MySQL performance schema monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### **Documentation**

- [ERD Design Documentation](frontEnd/ERD_Design_Documentation.md)
- [ERD Diagrams](frontEnd/ERD_Diagrams.md)

### **Getting Help**

- Create an issue for bug reports
- Join our Discord community (if available)
- Email: support@yourcompany.com

### **Useful Resources**

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Built with ❤️ for financial institutions seeking modern loan management solutions.**
