-- Add remaining_balance column to loans table
ALTER TABLE loans 
ADD COLUMN remaining_balance DECIMAL(15, 2) DEFAULT NULL AFTER approved_amount;

-- Update existing loans to set remaining_balance
UPDATE loans 
SET remaining_balance = COALESCE(approved_amount, loan_amount)
WHERE remaining_balance IS NULL;

-- Create trigger to automatically update remaining_balance when payments are made
DELIMITER //

CREATE TRIGGER update_remaining_balance_after_payment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE loans 
        SET remaining_balance = remaining_balance - NEW.amount
        WHERE id = NEW.loan_id;
    END IF;
END//

CREATE TRIGGER update_remaining_balance_after_payment_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status OR OLD.amount != NEW.amount THEN
        -- Revert old payment if it was completed
        IF OLD.status = 'completed' THEN
            UPDATE loans 
            SET remaining_balance = remaining_balance + OLD.amount
            WHERE id = OLD.loan_id;
        END IF;
        
        -- Apply new payment if it's completed
        IF NEW.status = 'completed' THEN
            UPDATE loans 
            SET remaining_balance = remaining_balance - NEW.amount
            WHERE id = NEW.loan_id;
        END IF;
    END IF;
END//

CREATE TRIGGER update_remaining_balance_after_payment_delete
AFTER DELETE ON payments
FOR EACH ROW
BEGIN
    IF OLD.status = 'completed' THEN
        UPDATE loans 
        SET remaining_balance = remaining_balance + OLD.amount
        WHERE id = OLD.loan_id;
    END IF;
END//

DELIMITER ;
