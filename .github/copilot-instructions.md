# GitHub Copilot Instructions for Steam Trade Bot

## Code Style and Language Requirements

### Language Standards
- **All code comments MUST be in English**
- **All console.log messages MUST be in English**
- **All user-facing text MUST be in English**
- **All variable and function names MUST be in English**
- **All documentation MUST be in English**

### Code Standards
- Use `async/await` instead of callbacks
- Always include error handling with try-catch
- Use meaningful variable names (camelCase)
- Add JSDoc comments for all functions
- Keep functions small and focused (single responsibility)

### Project-Specific Rules
- AppID for Rust is always `252490`
- Currency code for NOK is `20`
- Always include rate limiting when making Steam API requests
- Log all transactions to the database
- Use PostgreSQL pool for all database operations

### Security
- Never log sensitive data (passwords, secrets, cookies)
- Always validate user input
- Use environment variables for configuration
- Never commit `.env`, `cookies.json`, or `.csv` files

### Error Handling
- Always wrap Steam API calls in try-catch
- Log errors to the `logs` table in database
- Provide meaningful error messages
- Never crash the application on errors

### Database
- Always use parameterized queries to prevent SQL injection
- Use transactions for multiple related operations
- Add proper indexes for frequently queried columns
- Include timestamps for all records

### Example Code Style

```javascript
/**
 * Places a buy order for a Steam market item
 * @param {string} itemName - The market hash name of the item
 * @param {number} priceEUR - Price in EUR/NOK
 * @returns {Promise<Object>} Result of the buy order
 */
async function placeBuyOrder(itemName, priceEUR) {
  try {
    // Validate input
    if (!itemName || priceEUR <= 0) {
      throw new Error('Invalid parameters');
    }

    // Business logic here
    console.log(`Placing buy order for ${itemName} at ${priceEUR}`);

    return result;
  } catch (error) {
    console.error(`Failed to place buy order: ${error.message}`);
    throw error;
  }
}
```

## Response Format
- Always use English in explanations
- Keep console messages concise and informative
- Use emojis sparingly and only for important status messages (✅ ❌ 💰 📊)
