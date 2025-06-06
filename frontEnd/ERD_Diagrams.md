# Entity-Relationship Diagrams (Visual) - Production Schema

## 1. Conceptual ERD

```
+--------+       has loans      +----------+
|        |<-------------------+|          |
| Client |                     |   Loan   |
|        |+-------------------->          |
+--------+     makes payments  +----------+
    |                               |
    | makes                         | receives
    v                               v
+------------+              +------------+
|            |              |            |
|  Payment   |<-belongs to--| Loan       |
|            |              |            |
+------------+              +------------+
    ^
    |
    |
+--------+
|        |
|  User  |+--processes payments
|        |
+--------+
```

## 2. Logical ERD - Current Production Schema

```
+------------------+       +-------------------+
| Users            |       | Clients           |
+------------------+       +-------------------+
| PK: id           |       | PK: id            |
| username         |       | first_name        |
| email            |       | last_name         |
| password_hash    |       | email             |
| first_name       |       | phone             |
| last_name        |       | address           |
| role             |       | city              |
| is_active        |       | state             |
| last_login       |       | postal_code       |
| created_at       |       | country           |
| updated_at       |       | id_type           |
+------------------+       | id_number         |
        ^                  | status            |
        |                  | created_at        |
        |                  | updated_at        |
        |                  +-------------------+
        |                           |
        |                           |
        |         +-------------------+
        |         | Loans             |
        |         +-------------------+
        +---------+ PK: id            |
        processes | FK: client_id     |
                  | loan_amount       |
                  | approved_amount   |
                  | interest_rate     |
                  | term_months       |
                  | purpose           |
                  | start_date        |
                  | end_date          |
                  | status            |
                  | next_due_date     |
                  | payment_frequency |
                  | remaining_balance |
                  | FK: approved_by   |
                  | created_at        |
                  | updated_at        |
                  +-------------------+
                           |
                           |
                  +-------------------+
                  | Payments          |
                  +-------------------+
                  | PK: id            |
                  | FK: loan_id       |
                  | FK: client_id     |
                  | amount            |
                  | payment_date      |
                  | payment_method    |
                  | reference_number  |
                  | status            |
                  | notes             |
                  | FK: processed_by  |
                  | created_at        |
                  | updated_at        |
                  +-------------------+
```

## 3. Physical ERD (Current Production Tables)

Your actual database tables with real client and loan data.
