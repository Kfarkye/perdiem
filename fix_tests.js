const fs = require('fs');

const path = 'src/lib/__tests__/financials.test.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/201, 79/g, '156, 86');
content = content.replace(/weekly_max = 1960, "weekly_max = \(201\+79\)\*7"/g, 'weekly_max = 1694, "weekly_max = (156+86)*7"');
content = content.replace(/monthly_max = 8400, "monthly_max = \(201\+79\)\*30"/g, 'monthly_max = 7260, "monthly_max = (156+86)*30"');
content = content.replace(/lodging_daily = 201/g, 'lodging_daily = 156');
content = content.replace(/meals_daily = 79/g, 'meals_daily = 86');

content = content.replace(/1960/g, '1694');
content = content.replace(/540/g, '806'); // taxable_weekly
content = content.replace(/15, "taxable_hourly = 540\/36"/g, '22.39, "taxable_hourly = 806/36"');
content = content.replace(/108, "tax_estimate = 540 \* 0\.20"/g, '161.2, "tax_estimate = 806 * 0.20"');
content = content.replace(/2392, "net_weekly = 2500 - 108"/g, '2338.8, "net_weekly = 2500 - 161.2"');

content = content.replace(/6260, "surplus = \(201\+79\)\*30 - 2140"/g, '5120, "surplus = (156+86)*30 - 2140"');

// housing neg surplus: 100, 30, 5000 -> untouched

content = content.replace(/1372, "70% band"/g, '1186, "70% band"');
content = content.replace(/1568, "80% band"/g, '1355, "80% band"');
content = content.replace(/1862, "95% band"/g, '1609, "95% band"');
content = content.replace(/1568\);/g, '1355);'); // partial stipend argument

content = content.replace(/25480, "tax_free = 1960 \* 13"/g, '22022, "tax_free = 1694 * 13"');
content = content.replace(/31096, "net = 2392 \* 13"/g, '30404, "net = 2338.8 * 13"');

// deriveFinancials pipeline assertions:
content = content.replace(/2392, "pipeline: net weekly"/g, '2338.8, "pipeline: net weekly"');
content = content.replace(/6260, "pipeline: surplus"/g, '5120, "pipeline: surplus"');
content = content.replace(/31096, "pipeline: contract net"/g, '30404, "pipeline: contract net"');

fs.writeFileSync(path, content);
console.log('Test file updated');
