// ============================================================
//  Podhigai College — Local MongoDB to MongoDB Atlas Migration Tool
// ============================================================

require('dotenv').config();
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const COLLECTIONS = ['contacts', 'events', 'galleryphotos', 'reviews', 'chairmen'];

async function runMigration() {
  const targetUri = process.argv[2] || process.env.MONGODB_URI;

  if (!targetUri || !targetUri.trim()) {
    console.error('❌ ERROR: Missing target MongoDB Atlas URI.');
    console.error('Usage: node migrate_to_atlas.js "<MONGODB_ATLAS_URI>"');
    console.error('Or ensure MONGODB_URI in backend/.env points to your Atlas cluster.');
    process.exit(1);
  }

  const isAtlas = targetUri.includes('mongodb+srv://') || targetUri.includes('.mongodb.net');
  console.log(`\n============================================================`);
  console.log(`🚀 Starting Database Migration to ${isAtlas ? 'MongoDB Atlas' : 'Target MongoDB'}`);
  console.log(`============================================================`);

  // Step 1: Load source data from local MongoDB or backup file
  let sourceData = {};
  const backupPath = path.join(__dirname, '../scratch/local_mongodb_backup.json');

  let localConnected = false;
  let localConn = null;

  try {
    console.log('📡 Attempting connection to local MongoDB (mongodb://localhost:27017/podhigai_contacts)...');
    localConn = await mongoose.createConnection('mongodb://localhost:27017/podhigai_contacts', {
      serverSelectionTimeoutMS: 2000
    }).asPromise();
    localConnected = true;
    console.log('✅ Connected to local MongoDB.');

    for (const colName of COLLECTIONS) {
      const docs = await localConn.collection(colName).find({}).toArray();
      sourceData[colName] = docs;
      console.log(`   📦 Read ${docs.length} documents from local collection: "${colName}"`);
    }
  } catch (localErr) {
    console.log('ℹ️  Could not connect to live local MongoDB (or it is stopped).');
    if (fs.existsSync(backupPath)) {
      console.log(`📂 Loading local data from backup file: ${backupPath}`);
      sourceData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      for (const colName of COLLECTIONS) {
        console.log(`   📦 Read ${(sourceData[colName] || []).length} documents from backup: "${colName}"`);
      }
    } else {
      console.error('❌ ERROR: No live local MongoDB and no backup file found!');
      process.exit(1);
    }
  } finally {
    if (localConnected && localConn) {
      await localConn.close();
    }
  }

  // Step 2: Connect to MongoDB Atlas target
  console.log('\n📡 Connecting to target MongoDB Atlas database...');
  let atlasConn;
  try {
    atlasConn = await mongoose.createConnection(targetUri.trim(), {
      serverSelectionTimeoutMS: 15000
    }).asPromise();
    console.log(`✅ Successfully connected to MongoDB Atlas!`);
    console.log(`   → Database name: "${atlasConn.name}"`);
    console.log(`   → Host: ${atlasConn.host}`);
  } catch (atlasErr) {
    console.error('❌ Failed to connect to MongoDB Atlas:');
    console.error('   ' + atlasErr.message);
    console.error('\n🔍 Troubleshooting Tips:');
    console.error('   1. Check username & password in your Atlas connection string (no < > brackets).');
    console.error('   2. Verify Network Access in MongoDB Atlas allows IP: 0.0.0.0/0 (or your current IP).');
    console.error('   3. Ensure database name in connection string is "podhigai_contacts".');
    process.exit(1);
  }

  // Step 3: Migrate each collection with upsert to avoid duplication
  console.log('\n============================================================');
  console.log('🔄 Migrating collections and documents into MongoDB Atlas...');
  console.log('============================================================');

  const migrationSummary = {};

  for (const colName of COLLECTIONS) {
    const docs = sourceData[colName] || [];
    const targetCol = atlasConn.collection(colName);

    if (docs.length === 0) {
      const existingCount = await targetCol.countDocuments();
      migrationSummary[colName] = { source: 0, migrated: 0, targetTotal: existingCount };
      console.log(`⏩ "${colName}": 0 documents to migrate (Target has: ${existingCount})`);
      continue;
    }

    const bulkOps = docs.map(doc => {
      const docToInsert = { ...doc };
      if (docToInsert._id && typeof docToInsert._id === 'string' && docToInsert._id.length === 24) {
        try {
          docToInsert._id = new mongoose.Types.ObjectId(docToInsert._id);
        } catch (_) {}
      }
      return {
        replaceOne: {
          filter: { _id: docToInsert._id },
          replacement: docToInsert,
          upsert: true
        }
      };
    });

    const result = await targetCol.bulkWrite(bulkOps);
    const targetCount = await targetCol.countDocuments();
    migrationSummary[colName] = {
      source: docs.length,
      upserted: result.upsertedCount || 0,
      modified: result.modifiedCount || 0,
      matched: result.matchedCount || 0,
      targetTotal: targetCount
    };

    console.log(`✅ "${colName}": ${docs.length} records processed → Target total: ${targetCount}`);
  }

  await atlasConn.close();

  console.log('\n============================================================');
  console.log('🎉 Data Migration Complete!');
  console.log('============================================================');
  console.table(migrationSummary);
}

runMigration().catch(err => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
