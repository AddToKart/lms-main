# Entity-Relationship Diagram (ERD) for Loan Management System

## 1. Conceptual Design

### Overview

The Loan Management System is designed to manage the complete lifecycle of loans from application to repayment, including client management, loan processing, payment tracking, and system administration.

### Key Entities and Their Purpose:

#### **Client**

Represents borrowers who apply for and receive loans from the financial institution.

- **Purpose**: Store customer information for loan applications and relationship management
- **Business Role**: Primary beneficiaries of loan services

#### **Loan**

Represents financial products extended to clients with specific terms and conditions.

- **Purpose**: Track loan details, terms, approval status, and repayment progress
- **Business Role**: Core financial instrument of the lending business

#### **Payment**

Represents monetary transactions made by clients toward their loan obligations.

- **Purpose**: Record all payment activities and maintain transaction history
- **Business Role**: Revenue generation and loan balance management

#### **User**

Represents system operators who manage loans, process payments, and administer the system.

- **Purpose**: System access control and operational workflow management
- **Business Role**: Staff members who facilitate loan operations

### High-Level Relationships:

1. **Client-Loan Relationship**: One client can have multiple loans (1:M)

   - Supports multiple loan products per customer
   - Enables relationship-based lending

2. **Loan-Payment Relationship**: One loan receives multiple payments (1:M)

   - Tracks payment history and remaining balances
   - Supports various payment schedules

3. **User-Loan Relationship**: Users approve and manage loans (M:M)

   - Workflow control and audit trail
   - Role-based loan processing

4. **User-Payment Relationship**: Users process and record payments (M:M)
   - Transaction verification and recording
   - Operational accountability

### Key Business Rules:

- Clients must be active to receive new loans
- Loans require approval before disbursement
- Payments must be linked to active loans
- Users must have appropriate roles for specific operations

## 2. Logical Design

### Advanced Normalization Process:

#### First Normal Form (1NF):

- All tables have atomic values (no repeating groups)
- Each table has a primary key
- No duplicate rows exist
- **Enhanced**: All multi-valued attributes separated into junction tables

#### Second Normal Form (2NF):

- All non-key attributes are fully functionally dependent on primary keys
- Partial dependencies eliminated through table separation
- **Enhanced**: Composite keys analyzed for proper functional dependencies

#### Third Normal Form (3NF):

- Transitive dependencies removed
- Each non-key attribute depends only on the primary key
- **Enhanced**: All lookup values normalized into reference tables

#### Boyce-Codd Normal Form (BCNF):

- Every determinant is a candidate key
- **Enhanced**: Eliminates remaining anomalies from 3NF

### Enhanced Entity Definitions with Detailed Attributes:

#### **Users Entity** (System Administration)

- **Primary Key**: id (AUTO_INCREMENT, BIGINT for scalability)
- **Unique Constraints**: username, email
- **Attributes**:
  - **Authentication**:
    - username (VARCHAR(50), NOT NULL, UNIQUE)
    - email (VARCHAR(100), UNIQUE, validated format)
    - password_hash (VARCHAR(255), NOT NULL, bcrypt encrypted)
  - **Personal Information**:
    - first_name (VARCHAR(50))
    - last_name (VARCHAR(50))
    - full_name (VARCHAR(100), computed field)
  - **Authorization & Access**:
    - role (ENUM: 'admin','manager','officer','viewer', DEFAULT 'officer')
    - permissions (JSON, role-specific permissions)
    - is_active (BOOLEAN, DEFAULT TRUE)
    - account_locked (BOOLEAN, DEFAULT FALSE)
    - failed_login_attempts (TINYINT, DEFAULT 0)
  - **Session Management**:
    - last_login (DATETIME)
    - login_count (INT, DEFAULT 0)
    - password_changed_at (DATETIME)
  - **Audit Trail**:
    - created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
    - updated_at (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)
    - created_by (INT, FK to users.id)

#### **Clients Entity** (Customer Management)

- **Primary Key**: id (AUTO_INCREMENT, BIGINT)
- **Unique Constraints**: email, id_number (when provided)
- **Attributes**:
  - **Personal Information**:
    - first_name (VARCHAR(50), NOT NULL)
    - last_name (VARCHAR(50), NOT NULL)
    - middle_name (VARCHAR(50))
    - full_name (VARCHAR(150), computed: first + middle + last)
    - date_of_birth (DATE)
    - gender (ENUM: 'male','female','other')
  - **Contact Information**:
    - email (VARCHAR(100), UNIQUE, validated)
    - phone_primary (VARCHAR(20))
    - phone_secondary (VARCHAR(20))
    - preferred_contact_method (ENUM: 'email','phone','sms')
  - **Address Information**:
    - address_line1 (VARCHAR(100))
    - address_line2 (VARCHAR(100))
    - city (VARCHAR(50))
    - state_province (VARCHAR(50))
    - postal_code (VARCHAR(20))
    - country (VARCHAR(50), DEFAULT 'Philippines')
  - **Identification**:
    - id_type (ENUM: 'passport','drivers_license','national_id','voters_id')
    - id_number (VARCHAR(50), UNIQUE when not null)
    - id_expiry_date (DATE)
  - **Financial Information**:
    - monthly_income (DECIMAL(12,2))
    - employment_status (ENUM: 'employed','self_employed','unemployed','retired')
    - employer_name (VARCHAR(100))
  - **Risk Assessment**:
    - credit_score (SMALLINT, 300-850 range)
    - risk_category (ENUM: 'low','medium','high','very_high')
    - status (ENUM: 'active','inactive','suspended','blacklisted', DEFAULT 'active')
    - blacklist_reason (TEXT)
  - **Audit Trail**:
    - created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
    - updated_at (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)
    - created_by (INT, FK to users.id)
    - updated_by (INT, FK to users.id)

#### **Loan_Types Entity** (Product Catalog) - **NEW**

- **Primary Key**: id (AUTO_INCREMENT)
- **Attributes**:
  - name (VARCHAR(50), NOT NULL, UNIQUE)
  - description (TEXT)
  - min_amount (DECIMAL(15,2), NOT NULL)
  - max_amount (DECIMAL(15,2), NOT NULL)
  - min_term_months (TINYINT, NOT NULL)
  - max_term_months (SMALLINT, NOT NULL)
  - base_interest_rate (DECIMAL(5,2), NOT NULL)
  - processing_fee_percent (DECIMAL(5,2), DEFAULT 0)
  - early_payment_penalty_percent (DECIMAL(5,2), DEFAULT 0)
  - late_payment_penalty_percent (DECIMAL(5,2), DEFAULT 5.00)
  - requires_collateral (BOOLEAN, DEFAULT FALSE)
  - is_active (BOOLEAN, DEFAULT TRUE)
  - created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

#### **Loans Entity** (Enhanced Financial Products)

- **Primary Key**: id (AUTO_INCREMENT, BIGINT)
- **Foreign Keys**:
  - client_id → Clients(id) ON DELETE RESTRICT
  - loan_type_id → Loan_Types(id) ON DELETE RESTRICT
  - approved_by → Users(id) ON DELETE SET NULL
  - created_by → Users(id) ON DELETE SET NULL
- **Attributes**:
  - **Application Information**:
    - application_number (VARCHAR(20), UNIQUE, auto-generated)
    - loan_type_id (INT, NOT NULL, FK to loan_types)
    - requested_amount (DECIMAL(15,2), NOT NULL)
    - requested_term_months (SMALLINT, NOT NULL)
    - purpose (TEXT, NOT NULL)
    - collateral_description (TEXT)
  - **Approval Information**:
    - approved_amount (DECIMAL(15,2))
    - approved_term_months (SMALLINT)
    - approved_interest_rate (DECIMAL(5,2))
    - processing_fee (DECIMAL(10,2), computed)
    - approval_date (DATE)
    - approval_notes (TEXT)
    - approved_by (INT, FK to users)
  - **Financial Calculations**:
    - principal_amount (DECIMAL(15,2), same as approved_amount)
    - installment_amount (DECIMAL(10,2), computed)
    - total_interest (DECIMAL(15,2), computed)
    - total_payable (DECIMAL(15,2), computed)
    - remaining_balance (DECIMAL(15,2))
    - remaining_payments (SMALLINT)
  - **Schedule Information**:
    - payment_frequency (ENUM: 'daily','weekly','bi_weekly','monthly','quarterly')
    - start_date (DATE)
    - maturity_date (DATE, computed)
    - next_due_date (DATE)
    - last_payment_date (DATE)
  - **Status Management**:
    - status (ENUM: 'draft','pending','under_review','approved','disbursed','active','overdue','defaulted','paid_off','cancelled','rejected')
    - days_overdue (SMALLINT, computed)
    - overdue_amount (DECIMAL(15,2), computed)
  - **Audit Trail**:
    - created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
    - updated_at (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)
    - created_by (INT, FK to users.id)
    - updated_by (INT, FK to users.id)
    - disbursed_at (TIMESTAMP)
    - disbursed_by (INT, FK to users.id)

#### **Payment_Schedules Entity** (Amortization Table) - **NEW**

- **Primary Key**: id (AUTO_INCREMENT, BIGINT)
- **Foreign Keys**:
  - loan_id → Loans(id) ON DELETE CASCADE
- **Attributes**:
  - payment_number (SMALLINT, NOT NULL)
  - due_date (DATE, NOT NULL)
  - principal_amount (DECIMAL(10,2), NOT NULL)
  - interest_amount (DECIMAL(10,2), NOT NULL)
  - total_payment (DECIMAL(10,2), computed)
  - remaining_balance_after (DECIMAL(15,2), NOT NULL)
  - is_paid (BOOLEAN, DEFAULT FALSE)
  - paid_date (DATE)
  - created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- **Unique Constraint**: (loan_id, payment_number)

#### **Payments Entity** (Enhanced Transaction Records)

- **Primary Key**: id (AUTO_INCREMENT, BIGINT)
- **Foreign Keys**:
  - loan_id → Loans(id) ON DELETE RESTRICT
  - client_id → Clients(id) ON DELETE RESTRICT
  - schedule_id → Payment_Schedules(id) ON DELETE SET NULL
  - processed_by → Users(id) ON DELETE SET NULL
- **Attributes**:
  - **Transaction Details**:
    - payment_number (VARCHAR(20), UNIQUE, auto-generated)
    - amount (DECIMAL(15,2), NOT NULL, CHECK > 0)
    - payment_date (DATE, NOT NULL)
    - value_date (DATE, business date)
    - payment_method (ENUM: 'cash','bank_transfer','credit_card','debit_card','check','online','mobile_payment')
  - **Payment Allocation**:
    - principal_paid (DECIMAL(10,2), NOT NULL)
    - interest_paid (DECIMAL(10,2), NOT NULL)
    - penalty_paid (DECIMAL(10,2), DEFAULT 0)
    - fees_paid (DECIMAL(10,2), DEFAULT 0)
  - **Reference Information**:
    - reference_number (VARCHAR(100))
    - bank_reference (VARCHAR(100))
    - receipt_number (VARCHAR(50))
    - external_transaction_id (VARCHAR(100))
  - **Status & Verification**:
    - status (ENUM: 'pending','processing','completed','failed','cancelled','reversed')
    - verification_status (ENUM: 'unverified','verified','disputed')
    - failure_reason (TEXT)
  - **Audit Trail**:
    - notes (TEXT)
    - created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
    - updated_at (TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP)
    - processed_by (INT, FK to users.id)
    - verified_by (INT, FK to users.id)
    - verified_at (TIMESTAMP)

#### **Loan_Status_History Entity** (Status Audit Trail) - **NEW**

- **Primary Key**: id (AUTO_INCREMENT, BIGINT)
- **Foreign Keys**:
  - loan_id → Loans(id) ON DELETE CASCADE
  - changed_by → Users(id) ON DELETE SET NULL
- **Attributes**:
  - previous_status (VARCHAR(20))
  - new_status (VARCHAR(20), NOT NULL)
  - reason (TEXT)
  - notes (TEXT)
  - changed_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
  - changed_by (INT, FK to users.id)

### Enhanced Referential Integrity Rules:

#### **Cascade Rules**:

1. **Loans → Payment_Schedules**: CASCADE DELETE (schedule tied to loan)
2. **Loans → Loan_Status_History**: CASCADE DELETE (history tied to loan)
3. **Clients → Loans**: RESTRICT DELETE (protect if loans exist)

#### **Restrict Rules**:

1. **Loan_Types → Loans**: RESTRICT DELETE (protect active loan products)
2. **Users → Loans**: RESTRICT DELETE (protect if user has loans)
3. **Loans → Payments**: RESTRICT DELETE (protect payment history)

#### **Set Null Rules**:

1. **Users → Loans (approved_by)**: SET NULL (maintain loan record)
2. **Users → Payments (processed_by)**: SET NULL (maintain payment record)
3. **Payment_Schedules → Payments**: SET NULL (payment can exist without schedule link)

### Advanced Business Rules & Constraints:

#### **Domain Constraints**

```sql
-- Payment amount validation
CONSTRAINT chk_payment_amount CHECK (amount > 0)

-- Interest rate validation
CONSTRAINT chk_interest_rate CHECK (approved_interest_rate >= 0 AND approved_interest_rate <= 50)

-- Term validation
CONSTRAINT chk_loan_term CHECK (approved_term_months > 0 AND approved_term_months <= 360)

-- Credit score validation
CONSTRAINT chk_credit_score CHECK (credit_score IS NULL OR (credit_score >= 300 AND credit_score <= 850))

-- Date validation
CONSTRAINT chk_loan_dates CHECK (start_date <= maturity_date)
CONSTRAINT chk_birth_date CHECK (date_of_birth <= CURDATE() - INTERVAL 18 YEAR)
```

#### **Computed Fields**

```sql
-- Full name computation
full_name = CONCAT_WS(' ', first_name, middle_name, last_name)

-- Days overdue computation
days_overdue = CASE
    WHEN status = 'overdue' THEN DATEDIFF(CURDATE(), next_due_date)
    ELSE 0
END

-- Total payable computation
total_payable = principal_amount + total_interest + processing_fee
```

#### **Trigger Requirements**:

1. **Loan Status Updates**: Auto-update loan status based on payment completion
2. **Balance Calculations**: Auto-recalculate remaining balance after payments
3. **Audit Trail**: Auto-log all status changes and critical updates
4. **Overdue Detection**: Auto-identify and flag overdue loans daily
5. **Schedule Updates**: Auto-mark payment schedules as paid when payments received

### Data Integrity Measures:

#### **Transaction Isolation**:

- Payment processing uses SERIALIZABLE isolation level
- Loan approvals use READ COMMITTED with row locking
- Report generation uses READ UNCOMMITTED for performance

#### **Concurrency Control**:

- Optimistic locking for loan updates using version fields
- Pessimistic locking for payment processing
- Deadlock detection and retry mechanisms

#### **Data Validation Layers**:

1. **Database Level**: CHECK constraints, foreign keys, triggers
2. **Application Level**: Business rule validation, format checking
3. **UI Level**: Input validation, real-time feedback

This enhanced logical design provides a robust, scalable, and maintainable foundation for a production loan management system with comprehensive audit trails, data integrity, and business rule enforcement.
