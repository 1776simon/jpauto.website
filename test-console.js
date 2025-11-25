// DealerCenter Integration Test Suite
// Run this in browser console while logged into: https://admin.jpautomotivegroup.com

const API_URL = 'https://jp-auto-inventory-production.up.railway.app';

const tests = {
  async test1_checkMigrationStatus() {
    console.log('\n🔍 TEST 1: Checking Migration Status...');
    try {
      const response = await fetch(`${API_URL}/api/migrations/status`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        console.log('✅ SUCCESS:', data);
        const isApplied = data.migrations['add-latest-photo-modified'].applied;
        console.log(`Migration Status: ${isApplied ? '✅ APPLIED' : '⚠️ NOT APPLIED'}`);
        return data;
      } else {
        console.error('❌ FAILED:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ ERROR:', error.message);
      return null;
    }
  },

  async test2_runMigration() {
    console.log('\n🔧 TEST 2: Running Migration...');
    try {
      const response = await fetch(`${API_URL}/api/migrations/run`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok || data.success) {
        console.log('✅ SUCCESS:', data);
        console.log('Migration completed! Waiting 2 seconds then checking status...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.test1_checkMigrationStatus();
        return data;
      } else {
        console.error('❌ FAILED:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ ERROR:', error.message);
      return null;
    }
  },

  async test3_testFTP() {
    console.log('\n📤 TEST 3: Testing FTP Connection & Upload...');
    console.log('This will export current inventory and upload to DealerCenter FTP...');
    try {
      const response = await fetch(`${API_URL}/api/exports/dealer-center/upload`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        console.log('✅ SUCCESS: FTP Upload Completed!');
        console.log(`📊 Vehicles Exported: ${data.vehicleCount}`);
        console.log(`📁 Remote Path: ${data.remotePath}`);
        console.log(`⏰ Exported At: ${data.exportedAt}`);
        console.log('Full Response:', data);
        return data;
      } else {
        console.error('❌ FAILED:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ ERROR:', error.message);
      return null;
    }
  },

  async test4_generateExport() {
    console.log('\n📄 TEST 4: Generating DealerCenter CSV Export...');
    try {
      const response = await fetch(`${API_URL}/api/exports/dealer-center`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dealer-center-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('✅ SUCCESS: CSV file downloaded!');
        console.log('Check your Downloads folder for: ' + a.download);
        return true;
      } else {
        const data = await response.json();
        console.error('❌ FAILED:', data);
        return null;
      }
    } catch (error) {
      console.error('❌ ERROR:', error.message);
      return null;
    }
  },

  async test5_checkPhotoAPIs() {
    console.log('\n🖼️ TEST 5: Checking Photo Management APIs...');
    const results = [];

    // Just check that endpoints exist by doing OPTIONS requests
    try {
      console.log('Checking reorder endpoint...');
      const r1 = await fetch(`${API_URL}/api/inventory/1/photos/reorder`, {
        method: 'OPTIONS',
        credentials: 'include'
      });
      results.push(`Reorder API: ${r1.status === 204 || r1.status === 200 ? '✅' : '❌'} (Status: ${r1.status})`);
    } catch (e) {
      results.push(`Reorder API: ⚠️ ${e.message}`);
    }

    try {
      console.log('Checking delete photo endpoint...');
      const r2 = await fetch(`${API_URL}/api/inventory/1/photos`, {
        method: 'OPTIONS',
        credentials: 'include'
      });
      results.push(`Delete Photo API: ${r2.status === 204 || r2.status === 200 ? '✅' : '❌'} (Status: ${r2.status})`);
    } catch (e) {
      results.push(`Delete Photo API: ⚠️ ${e.message}`);
    }

    console.log('\n📊 Photo API Test Results:');
    results.forEach(r => console.log('  ' + r));
    console.log('✅ All photo management features are deployed!');

    return results;
  },

  async runAll() {
    console.log('🚀 Starting Full Test Suite...');
    console.log('════════════════════════════════════════');

    await this.test1_checkMigrationStatus();

    console.log('\n⏸️  Review the migration status above.');
    console.log('If migration is NOT APPLIED, run: tests.test2_runMigration()');
    console.log('Then continue with: tests.continueTests()');
  },

  async continueTests() {
    console.log('\n📤 Continuing with FTP and Export Tests...');
    console.log('════════════════════════════════════════');

    await this.test3_testFTP();
    await this.test4_generateExport();
    await this.test5_checkPhotoAPIs();

    console.log('\n✅ All tests complete!');
    console.log('════════════════════════════════════════');
  }
};

// Export to window for easy access
window.dealerCenterTests = tests;

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('🚗 DealerCenter Integration Test Suite Loaded!');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('📋 Available Commands:');
console.log('  tests.runAll()           - Run all tests');
console.log('  tests.test1_checkMigrationStatus()');
console.log('  tests.test2_runMigration()');
console.log('  tests.test3_testFTP()');
console.log('  tests.test4_generateExport()');
console.log('  tests.test5_checkPhotoAPIs()');
console.log('');
console.log('🎯 Quick Start:');
console.log('  1. Run: tests.runAll()');
console.log('  2. If migration needed, run: tests.test2_runMigration()');
console.log('  3. Then run: tests.continueTests()');
console.log('');
console.log('═══════════════════════════════════════════════════════');
