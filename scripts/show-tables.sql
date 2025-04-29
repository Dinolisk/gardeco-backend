USE cashiersystem_db;

-- Show all tables
SHOW TABLES;

-- Show table details
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    UPDATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'cashiersystem_db'; 