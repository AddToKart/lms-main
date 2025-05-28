# Entity-Relationship Diagram (ERD) for Loan Management System

## 1. Conceptual Design

### Key Entities:
- **User**: Represents all users of the system (can be borrowers, loan officers, administrators)
- **Loan**: Loan products available in the system
- **Application**: Represents a borrower's loan application
- **Payment**: Payment transactions made by borrowers
- **Document**: Required documents for loan processing
- **Collateral**: Assets pledged as security for loans
- **CreditCheck**: Credit verification and scoring records
- **Notification**: System messages to users

### Relationships:
- Users can apply for multiple Loans (many-to-many)
- Loans require multiple Documents (one-to-many)
- Loans have multiple Payments (one-to-many)
- Users make Payments for Applications (many-to-many)
- Users submit Documents for Applications (many-to-many)
- Users receive Notifications (one-to-many)

### Attributes:
- **User**: UserID, Name, Email, Password, Role, DateJoined
- **Loan**: LoanID, LoanType, Description, InterestRate, MaxAmount
- **Application**: ApplicationID, ApplicationDate, Status
- **Payment**: PaymentID, Amount, PaymentDate, PaymentType
- **Document**: DocumentID, DocumentType, UploadDate, Status
- **Collateral**: CollateralID, Type, Value, Description
- **CreditCheck**: CreditCheckID, Score, CheckDate, Status
- **Notification**: NotificationID, Content, Date, Status

## 2. Logical Design

### Normalized Tables:

#### Users
- UserID (PK)
- FirstName
- LastName
- Email
- PasswordHash
- Role [Borrower, LoanOfficer, Admin]
- DateJoined
- LastLogin
- ProfilePicture
- Status [Active, Inactive]
- CreditScore
- Income
- PhoneNumber

#### Loans
- LoanID (PK)
- LoanType
- Description
- InterestRate
- MaxAmount
- MinAmount
- TermMonths
- RequiredCreditScore
- Status [Active, Discontinued]

#### Applications
- ApplicationID (PK)
- UserID (FK -> Users.UserID)
- LoanID (FK -> Loans.LoanID)
- ApplicationDate
- RequestedAmount
- Status [Pending, Approved, Rejected, Disbursed]
- ApprovedAmount
- ApprovalDate
- LoanOfficerID (FK -> Users.UserID)

#### Payments
- PaymentID (PK)
- ApplicationID (FK -> Applications.ApplicationID)
- UserID (FK -> Users.UserID)
- PaymentDate
- Amount
- PaymentType [Principal, Interest, Fee]
- PaymentMethod [Bank, Cash, Online]
- Status [Pending, Completed, Failed]

#### Documents
- DocumentID (PK)
- ApplicationID (FK -> Applications.ApplicationID)
- DocumentType [ID, Income, Bank Statement, Tax Return]
- FileName
- FilePath
- UploadDate
- UploadedBy (FK -> Users.UserID)
- Status [Pending, Verified, Rejected]

#### Collaterals
- CollateralID (PK)
- ApplicationID (FK -> Applications.ApplicationID)
- CollateralType [Property, Vehicle, Equipment]
- Description
- EstimatedValue
- AppraisalValue
- AppraisalDate
- Status [Pending, Approved, Rejected]

#### CreditChecks
- CreditCheckID (PK)
- UserID (FK -> Users.UserID)
- ApplicationID (FK -> Applications.ApplicationID)
- CheckDate
- CreditScore
- CreditBureau
- Status [Completed, Failed]
- ReportPath

#### Notifications
- NotificationID (PK)
- UserID (FK -> Users.UserID)
- Content
- NotificationType [Application, Payment, Document, Approval]
- CreationDate
- IsRead [True, False]
- RelatedEntityID
- RelatedEntityType [Application, Payment, Document]

## 3. Physical Design

```sql
-- Users Table
CREATE TABLE Users (
    UserID INT PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    Role ENUM('Borrower', 'LoanOfficer', 'Admin') NOT NULL,
    DateJoined DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastLogin DATETIME,
    ProfilePicture VARCHAR(255),
    Status ENUM('Active', 'Inactive') DEFAULT 'Active',
    CreditScore INT,
    Income DECIMAL(12,2),
    PhoneNumber VARCHAR(20),
    INDEX idx_email (Email)
);

-- Loans Table
CREATE TABLE Loans (
    LoanID INT PRIMARY KEY AUTO_INCREMENT,
    LoanType VARCHAR(50) NOT NULL,
    Description TEXT,
    InterestRate DECIMAL(5,2) NOT NULL,
    MaxAmount DECIMAL(12,2) NOT NULL,
    MinAmount DECIMAL(12,2) NOT NULL,
    TermMonths INT NOT NULL,
    RequiredCreditScore INT,
    Status ENUM('Active', 'Discontinued') DEFAULT 'Active',
    INDEX idx_loan_type (LoanType)
);

-- Applications Table
CREATE TABLE Applications (
    ApplicationID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    LoanID INT NOT NULL,
    ApplicationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    RequestedAmount DECIMAL(12,2) NOT NULL,
    Status ENUM('Pending', 'Approved', 'Rejected', 'Disbursed') DEFAULT 'Pending',
    ApprovedAmount DECIMAL(12,2),
    ApprovalDate DATETIME,
    LoanOfficerID INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (LoanID) REFERENCES Loans(LoanID),
    FOREIGN KEY (LoanOfficerID) REFERENCES Users(UserID),
    INDEX idx_user_loan (UserID, LoanID),
    INDEX idx_status (Status)
);

-- Payments Table
CREATE TABLE Payments (
    PaymentID INT PRIMARY KEY AUTO_INCREMENT,
    ApplicationID INT NOT NULL,
    UserID INT NOT NULL,
    PaymentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Amount DECIMAL(12,2) NOT NULL,
    PaymentType ENUM('Principal', 'Interest', 'Fee') NOT NULL,
    PaymentMethod ENUM('Bank', 'Cash', 'Online') NOT NULL,
    Status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',
    FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    INDEX idx_application_user (ApplicationID, UserID),
    INDEX idx_payment_date (PaymentDate)
);

-- Documents Table
CREATE TABLE Documents (
    DocumentID INT PRIMARY KEY AUTO_INCREMENT,
    ApplicationID INT NOT NULL,
    DocumentType ENUM('ID', 'Income', 'Bank Statement', 'Tax Return') NOT NULL,
    FileName VARCHAR(255) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    UploadDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UploadedBy INT NOT NULL,
    Status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID),
    FOREIGN KEY (UploadedBy) REFERENCES Users(UserID),
    INDEX idx_application (ApplicationID)
);

-- Collaterals Table
CREATE TABLE Collaterals (
    CollateralID INT PRIMARY KEY AUTO_INCREMENT,
    ApplicationID INT NOT NULL,
    CollateralType ENUM('Property', 'Vehicle', 'Equipment') NOT NULL,
    Description TEXT,
    EstimatedValue DECIMAL(12,2) NOT NULL,
    AppraisalValue DECIMAL(12,2),
    AppraisalDate DATETIME,
    Status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID),
    INDEX idx_application (ApplicationID)
);

-- CreditChecks Table
CREATE TABLE CreditChecks (
    CreditCheckID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    ApplicationID INT NOT NULL,
    CheckDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreditScore INT NOT NULL,
    CreditBureau VARCHAR(50) NOT NULL,
    Status ENUM('Completed', 'Failed') NOT NULL,
    ReportPath VARCHAR(500),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID),
    INDEX idx_user_application (UserID, ApplicationID)
);

-- Notifications Table
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    Content TEXT NOT NULL,
    NotificationType ENUM('Application', 'Payment', 'Document', 'Approval') NOT NULL,
    CreationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IsRead BOOLEAN DEFAULT FALSE,
    RelatedEntityID INT,
    RelatedEntityType ENUM('Application', 'Payment', 'Document'),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    INDEX idx_user (UserID),
    INDEX idx_creation_date (CreationDate)
);
```

### Database Constraints and Optimizations:

1. **Primary Keys**: Each table has an auto-incrementing integer primary key
2. **Foreign Keys**: Proper references between tables to maintain referential integrity
3. **Indexes**: Added on frequently queried columns to improve performance
4. **Data Types**: Appropriate data types chosen for each field
5. **Constraints**: 
   - UNIQUE constraints on combinations that should be unique (e.g., one submission per assignment per user)
   - NOT NULL constraints on required fields
   - DEFAULT values where appropriate
6. **Enumerations**: Used for fields with a fixed set of possible values