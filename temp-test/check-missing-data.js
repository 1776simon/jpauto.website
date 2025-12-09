const https = require('https');

https.get('https://jp-auto-inventory-production.up.railway.app/api/market-research/overview', (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);

  res.on('end', () => {
    const json = JSON.parse(data);
    const vehicles = json.data.vehicles;
    const noData = vehicles.filter(v => !v.lastAnalyzed);

    console.log('=== Vehicles WITHOUT Market Data ===\n');
    noData.forEach(v => {
      console.log(`${v.year} ${v.make} ${v.model} ${v.trim || '(no trim)'}`);
      console.log(`  VIN: ${v.vin}`);
      console.log(`  Price: $${v.ourPrice}`);
      console.log(`  ID: ${v.id}`);
      console.log('');
    });

    console.log(`Total without data: ${noData.length} of ${vehicles.length}`);

    console.log('\n=== Vehicles WITH Market Data ===\n');
    const withData = vehicles.filter(v => v.lastAnalyzed);
    withData.forEach(v => {
      console.log(`${v.year} ${v.make} ${v.model} - ${v.listingsFound} listings found`);
    });
    console.log(`\nTotal with data: ${withData.length} of ${vehicles.length}`);
  });
}).on('error', err => console.error('Error:', err.message));
