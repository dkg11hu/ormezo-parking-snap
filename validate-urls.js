// validate-urls.js
const fs = require('fs');
const path = require('path');

const facilities = require(path.resolve(__dirname, 'urls.json'));

let errors = 0;

for (const entry of facilities) {
  console.log(`\n=== Checking ${entry.label} (${entry.id}) ===`);

  if (!entry.id) {
    console.error(`[${entry.label}] ERROR: missing id`);
    errors++;
  }
  if (!entry.label) {
    console.error(`[${entry.id}] ERROR: missing label`);
    errors++;
  }
  if (!entry.url) {
    console.error(`[${entry.id}] ERROR: missing url`);
    errors++;
  }
  if (!Number.isFinite(Number(entry.maxLot))) {
    console.error(`[${entry.id}] ERROR: missing or invalid maxLot`);
    errors++;
  }
  if (!entry.selector || (!entry.selector.css && !entry.selector.xpath)) {
    console.error(`[${entry.id}] ERROR: missing selector (css or xpath)`);
    errors++;
  }
  if (!entry.timestampSelector || !entry.timestampSelector.xpath) {
    console.warn(`[${entry.id}] WARNING: missing timestampSelector.xpath`);
  }
}

if (errors > 0) {
  console.error(`\nValidation failed: ${errors} error(s) found in urls.json`);
  process.exit(1);
} else {
  console.log(`\nValidation passed: all entries look good!`);
}
