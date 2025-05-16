const fs = require('fs');
const path = require('path');
const { pool } = require('./database');
const { format } = require('fast-csv');

const outputPath = path.join(__dirname, '../profitable_items.csv');

function exportProfitableItemsToCSV() {
  const query = `
    SELECT name, lowest_price, median_price, expected_profit, volume, last_checked
    FROM items
    ORDER BY expected_profit DESC
  `;

  pool.query(query, [], (err, result) => {
    if (err) {
      return console.error('❌ Error reading the database:', err.message);
    }

    const rows = result.rows;

    const ws = fs.createWriteStream(outputPath);
    format.write(rows, { headers: true }).pipe(ws);

    console.log(`✅ CSV file updated: ${outputPath} (${rows.length} items)`);
  });
}

module.exports = exportProfitableItemsToCSV;