# Gardeco Backend

## Environment Setup

1. Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your actual values:
```env
# Database Configuration
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database_name

# Server Configuration
PORT=4001

# Terminal Service Configuration
API_KEY=your_api_key
CASHIER_SYSTEM_ID=your_cashier_system_id
# ... (other terminal service values)
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
# Run the database setup script
mysql -u your_user -p < src/setup-db.sql
```

3. Start the server:
```bash
npm start
```

## Testing

To run database tests (this will preserve existing data):
```bash
node src/test-db.js
```

## Important Notes

- Never commit the `.env` file to version control
- Always use environment variables for sensitive information
- Keep your API keys and credentials secure
