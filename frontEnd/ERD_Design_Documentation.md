# Entity-Relationship Diagram (ERD) for Loan Management System - Production

## 1. Conceptual Design - Production System

### Key Entities:

- **Client**: Your actual borrowers in the system
- **Loan**: Active and historical loans from your business
- **Payment**: Real payment transactions from clients
- **User**: System administrators and staff who process loans/payments

### Current Business Relationships:

- Clients have multiple Loans (one-to-many)
- Loans have multiple Payments (one-to-many)
- Users process Payments and approve Loans (many-to-many)

### Production Data Attributes:

- **Client**: Real customer information, contact details, identification
- **Loan**: Actual loan amounts, interest rates, payment schedules
- **Payment**: Historical payment records with dates and amounts
- **User**: Your staff accounts for system access

## 2. Current Production Schema

### Production Tables (Existing Data):

#### Clients (Your Customers)

- id, first_name, last_name, email, phone
- address, city, state, postal_code, country
- id_type, id_number, status
- created_at, updated_at

#### Loans (Your Business Loans)

- id, client_id, loan_amount, approved_amount
- interest_rate, term_months, purpose
- start_date, end_date, status, next_due_date
- payment_frequency, remaining_balance
- approved_by, created_at, updated_at

#### Payments (Your Transaction History)

- id, loan_id, client_id, amount
- payment_date, payment_method, reference_number
- status, notes, processed_by
- created_at, updated_at

#### Users (Your Staff)

- id, username, email, password_hash
- first_name, last_name, role, is_active
- last_login, created_at, updated_at

## 3. Data Migration Notes

This system is designed to work with your existing loan management data.
The database schema supports:

- Multiple loan statuses (pending, approved, active, paid_off, overdue, etc.)
- Various payment methods (cash, bank_transfer, credit_card, check, online)
- User roles (admin, manager, officer)
- Client status tracking (active, inactive, blacklisted)

Your historical data remains intact and accessible through the new interface.
