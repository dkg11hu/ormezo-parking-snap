// manual-validate.js
const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const fs = require('fs');
const path = require('path');

// Resolve urls.json relative to this file (robust in script mode)
const facilities = require("./urls.json");

(async () => {
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(new firefox.Options().addArguments('--headless'))
    .build();

  try {
    for (const entry of facilities) {
      console.log(`\n=== Validating ${entry.label} (${entry.id}) ===`);
      if (!entry?.url) {
        console.error(`[${entry.id}] ERROR: missing url in urls.json`);
        continue;
      }

      console.log(`[${entry.id}] URL from urls.json: ${entry.url}`);
      await driver.get(entry.url);

      // Try CSS then XPath from urls.json
      let occupancyText = null;

      if (entry.selector?.css) {
        try {
          const el = await driver.wait(until.elementLocated(By.css(entry.selector.css)), 7000);
          occupancyText = await el.getText();
          console.log(`[${entry.id}] CSS text: "${occupancyText}"`);
        } catch {
          console.warn(`[${entry.id}] CSS selector failed: ${entry.selector.css}`);
        }
      }

      if (!occupancyText && entry.selector?.xpath) {
        try {
          const el = await driver.wait(until.elementLocated(By.xpath(entry.selector.xpath)), 7000);
          occupancyText = await el.getText();
          console.log(`[${entry.id}] XPath text: "${occupancyText}"`);
        } catch {
          console.warn(`[${entry.id}] XPath selector failed: ${entry.selector.xpath}`);
        }
      }

      // Parse "free / total"
      let free = null;
      let total = Number(entry.maxLot);
      if (occupancyText) {
        const any = occupancyText.trim().match(/(\d+)\s*\/\s*(\d+)/);
        if (any) {
          free = parseInt(any[1], 10);
          const parsedTotal = parseInt(any[2], 10);
          if (!Number.isFinite(total) && Number.isFinite(parsedTotal)) {
            total = parsedTotal;
            console.log(
              `[${entry.id}] Parsed total from text: ${parsedTotal} (consider updating maxLot in urls.json)`
            );
          }
        } else {
          console.warn(`[${entry.id}] Could not parse occupancy text: "${occupancyText}"`);
        }
      } else {
        console.warn(`[${entry.id}] No occupancy text found by provided selectors`);
      }

      // Timestamp from urls.json (if present)
      let updated = 'N/A';
      if (entry.timestampSelector?.xpath) {
        try {
          const tsEl = await driver.wait(until.elementLocated(By.xpath(entry.timestampSelector.xpath)), 7000);
          updated = await tsEl.getText();
          console.log(`[${entry.id}] Timestamp: "${updated}"`);
        } catch {
          console.warn(`[${entry.id}] Timestamp XPath failed: ${entry.timestampSelector.xpath}`);
        }
      } else {
        console.warn(`[${entry.id}] No timestampSelector.xpath in urls.json`);
      }

      console.log(
        `[${entry.id}] RESULT => free=${free ?? 'unknown'}, total=${Number.isFinite(total) ? total : 'unknown'}, updated=${updated}`
      );
      if (free === null || !Number.isFinite(total)) {
        console.warn(`[${entry.id}] ACTION: verify selectors and set maxLot in urls.json`);
      }
    }
  } finally {
    await driver.quit();
  }
})();
