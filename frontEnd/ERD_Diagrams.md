# Entity-Relationship Diagrams (Visual)

## 1. Conceptual ERD

```
+--------+       applies       +----------+
|        |<-------------------+|          |
|  User  |                     |   Loan   |
|        |+-------------------->          |
+--------+     processes       +----------+
    |                               |
    | makes                         | requires
    v                               v
+------------+              +------------+
|            |              |            |
|  Payment   |<-relates to--| Application|
|            |              |            |
+------------+              +------------+
    ^                               ^
    |                               |
    |                               |
+--------+                    +----------+
|        |                    |          |
|  User  |+--submits docs for->| Document |
|        |                    |          |
+--------+                    +----------+
    |
    | receives
    v
+---------------+
|               |
| Notification  |
|               |
+---------------+
```

## 2. Logical ERD

```
+------------------+       +-------------------+        +-------------------+
| Users            |       | Loans             |        | Applications      |
+------------------+       +-------------------+        +-------------------+
| PK: UserID       |<---+  | PK: LoanID        |<----+  | PK: ApplicationID |
| FirstName        |    |  | LoanType          |     |  | FK: UserID        |
| LastName         |    |  | Description       |     |  | FK: LoanID        |
| Email            |    |  | InterestRate      |     |  | ApplicationDate   |
| PasswordHash     |    |  | MaxAmount         |     |  | RequestedAmount   |
| Role             |    |  | MinAmount         |     |  | Status            |
| DateJoined       |    |  | TermMonths        |     |  | ApprovedAmount    |
| LastLogin        |    |  | RequiredCreditScore|     |  | ApprovalDate      |
| ProfilePicture   |    |  | Status            |     |  | FK: LoanOfficerID |
| Status           |    |  +-------------------+     |  +-------------------+
| CreditScore      |    |                            |
| Income           |    |                            |
| PhoneNumber      |    |                            |
+------------------+    |                            |
        ^               |         +-------------------+
        |               |         | Payments          |
        |               |         +-------------------+
        |               +---------+ PK: PaymentID     |
        |                         | FK: ApplicationID |
        |                         | FK: UserID        |
        |                         | PaymentDate       |
        |                         | Amount            |
        |                         | PaymentType       |
        |                         | PaymentMethod     |
        |                         | Status            |
        |                         +-------------------+
        |                                 |
+------------------+                      |
| Documents        |                      |
+------------------+                      |
| PK: DocumentID   |                      |
| FK: ApplicationID|<---------------------+
| DocumentType     |
| FileName         |
| FilePath         |
| UploadDate       |
| FK: UploadedBy  -+--+
| Status           |  |
+------------------+  |
                      |
+------------------+  |
| Collaterals      |  |
+------------------+  |
| PK: CollateralID |  |
| FK: ApplicationID|  |
| CollateralType   |  |
| Description      |  |
| EstimatedValue   |  |
| AppraisalValue   |  |
| AppraisalDate    |  |
| Status           |  |
+------------------+  |
                      |
+------------------+  |
| CreditChecks     |  |
+------------------+  |
| PK: CreditCheckID|  |
| FK: UserID      -+--+
| FK: ApplicationID|
| CheckDate        |
| CreditScore      |
| CreditBureau     |
| Status           |
| ReportPath       |
+------------------+

+------------------+
| Notifications    |
+------------------+
| PK: NotificationID|
| FK: UserID        |
| Content           |
| NotificationType  |
| CreationDate      |
| IsRead            |
| RelatedEntityID   |
| RelatedEntityType |
+------------------+
```

## 3. Physical ERD (Table Structure)

```
+--------------------------------------------------+
| Users                                            |
+--------------------------------------------------+
| UserID INT PRIMARY KEY AUTO_INCREMENT            |
| FirstName VARCHAR(50) NOT NULL                   |
| LastName VARCHAR(50) NOT NULL                    |
| Email VARCHAR(100) UNIQUE NOT NULL               |
| PasswordHash VARCHAR(255) NOT NULL               |
| Role ENUM('Borrower', 'LoanOfficer', 'Admin') NOT NULL |
| DateJoined DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP |
| LastLogin DATETIME                               |
| ProfilePicture VARCHAR(255)                      |
| Status ENUM('Active', 'Inactive') DEFAULT 'Active' |
| CreditScore INT                                  |
| Income DECIMAL(12,2)                             |
| PhoneNumber VARCHAR(20)                          |
| INDEX idx_email (Email)                          |
+--------------------------------------------------+

+--------------------------------------------------+
| Loans                                            |
+--------------------------------------------------+
| LoanID INT PRIMARY KEY AUTO_INCREMENT            |
| LoanType VARCHAR(50) NOT NULL                    |
| Description TEXT                                 |
| InterestRate DECIMAL(5,2) NOT NULL               |
| MaxAmount DECIMAL(12,2) NOT NULL                 |
| MinAmount DECIMAL(12,2) NOT NULL                 |
| TermMonths INT NOT NULL                          |
| RequiredCreditScore INT                          |
| Status ENUM('Active', 'Discontinued') DEFAULT 'Active' |
| INDEX idx_loan_type (LoanType)                   |
+--------------------------------------------------+

+--------------------------------------------------+
| Applications                                     |
+--------------------------------------------------+
| ApplicationID INT PRIMARY KEY AUTO_INCREMENT     |
| UserID INT NOT NULL                              |
| LoanID INT NOT NULL                              |
| ApplicationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP |
| RequestedAmount DECIMAL(12,2) NOT NULL           |
| Status ENUM('Pending', 'Approved', 'Rejected', 'Disbursed') DEFAULT 'Pending' |
| ApprovedAmount DECIMAL(12,2)                     |
| ApprovalDate DATETIME                            |
| LoanOfficerID INT                                |
| FOREIGN KEY (UserID) REFERENCES Users(UserID)    |
| FOREIGN KEY (LoanID) REFERENCES Loans(LoanID)    |
| FOREIGN KEY (LoanOfficerID) REFERENCES Users(UserID) |
| INDEX idx_user_loan (UserID, LoanID)             |
| INDEX idx_status (Status)                        |
+--------------------------------------------------+

+--------------------------------------------------+
| Payments                                         |
+--------------------------------------------------+
| PaymentID INT PRIMARY KEY AUTO_INCREMENT         |
| ApplicationID INT NOT NULL                       |
| UserID INT NOT NULL                              |
| PaymentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP |
| Amount DECIMAL(12,2) NOT NULL                    |
| PaymentType ENUM('Principal', 'Interest', 'Fee') NOT NULL |
| PaymentMethod ENUM('Bank', 'Cash', 'Online') NOT NULL |
| Status ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending' |
| FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID) |
| FOREIGN KEY (UserID) REFERENCES Users(UserID)    |
| INDEX idx_application_user (ApplicationID, UserID) |
| INDEX idx_payment_date (PaymentDate)             |
+--------------------------------------------------+

+--------------------------------------------------+
| Documents                                        |
+--------------------------------------------------+
| DocumentID INT PRIMARY KEY AUTO_INCREMENT        |
| ApplicationID INT NOT NULL                       |
| DocumentType ENUM('ID', 'Income', 'Bank Statement', 'Tax Return') NOT NULL |
| FileName VARCHAR(255) NOT NULL                   |
| FilePath VARCHAR(500) NOT NULL                   |
| UploadDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP |
| UploadedBy INT NOT NULL                          |
| Status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending' |
| FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID) |
| FOREIGN KEY (UploadedBy) REFERENCES Users(UserID)|
| INDEX idx_application (ApplicationID)            |
+--------------------------------------------------+

+--------------------------------------------------+
| Collaterals                                      |
+--------------------------------------------------+
| CollateralID INT PRIMARY KEY AUTO_INCREMENT      |
| ApplicationID INT NOT NULL                       |
| CollateralType ENUM('Property', 'Vehicle', 'Equipment') NOT NULL |
| Description TEXT                                 |
| EstimatedValue DECIMAL(12,2) NOT NULL            |
| AppraisalValue DECIMAL(12,2)                     |
| AppraisalDate DATETIME                           |
| Status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending' |
| FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID) |
| INDEX idx_application (ApplicationID)            |
+--------------------------------------------------+

+--------------------------------------------------+
| CreditChecks                                     |
+--------------------------------------------------+
| CreditCheckID INT PRIMARY KEY AUTO_INCREMENT     |
| UserID INT NOT NULL                              |
| ApplicationID INT NOT NULL                       |
| CheckDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP |
| CreditScore INT NOT NULL                         |
| CreditBureau VARCHAR(50) NOT NULL                |
| Status ENUM('Completed', 'Failed') NOT NULL      |
| ReportPath VARCHAR(500)                          |
| FOREIGN KEY (UserID) REFERENCES Users(UserID)    |
| FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID) |
| INDEX idx_user_application (UserID, ApplicationID) |
+--------------------------------------------------+

+--------------------------------------------------+
| Notifications                                    |
+--------------------------------------------------+
| NotificationID INT PRIMARY KEY AUTO_INCREMENT    |
| UserID INT NOT NULL                              |
| Content TEXT NOT NULL                            |
| NotificationType ENUM('Application', 'Payment', 'Document', 'Approval') NOT NULL |
| CreationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP |
| IsRead BOOLEAN DEFAULT FALSE                     |
| RelatedEntityID INT                              |
| RelatedEntityType ENUM('Application', 'Payment', 'Document') |
| FOREIGN KEY (UserID) REFERENCES Users(UserID)    |
| INDEX idx_user (UserID)                          |
| INDEX idx_creation_date (CreationDate)           |
+--------------------------------------------------+
```