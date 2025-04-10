-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS gardeco_db;

-- Create user if it doesn't exist and grant privileges
CREATE USER IF NOT EXISTS 'gardeco_user'@'localhost' IDENTIFIED BY 'gardeco_password';
GRANT ALL PRIVILEGES ON gardeco_db.* TO 'gardeco_user'@'localhost';
FLUSH PRIVILEGES;
