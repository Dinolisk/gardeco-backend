-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS gardeco_db;

-- Create user if it doesn't exist and grant privileges
CREATE USER IF NOT EXISTS 'gardeco_user'@'localhost' IDENTIFIED BY 'gardeco_password';
GRANT ALL PRIVILEGES ON gardeco_db.* TO 'gardeco_user'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE gardeco_db;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  card_id VARCHAR(255),
  acquirer_terminal_id VARCHAR(255) NOT NULL,
  acquirer_merchant_id VARCHAR(255),
  card_type VARCHAR(50) NOT NULL,
  acquirer_transaction_timestamp DATETIME NOT NULL,
  transaction_amount DECIMAL(10, 2) NOT NULL,
  transaction_currency VARCHAR(3) NOT NULL,
  authorization_code VARCHAR(50) NOT NULL,
  system_trace_audit_number VARCHAR(50),
  retrieval_reference_number VARCHAR(50),
  masked_pan VARCHAR(50),
  merchant_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Add indexes for frequently queried fields
  INDEX idx_terminal_id (acquirer_terminal_id),
  INDEX idx_merchant_id (acquirer_merchant_id),
  INDEX idx_timestamp (acquirer_transaction_timestamp),
  INDEX idx_auth_code (authorization_code),
  INDEX idx_card_type (card_type)
);

-- Add any additional indexes for performance optimization
ALTER TABLE transactions
  ADD INDEX idx_transaction_lookup (
    acquirer_terminal_id,
    card_type,
    transaction_amount,
    transaction_currency,
    authorization_code,
    acquirer_transaction_timestamp
  );
