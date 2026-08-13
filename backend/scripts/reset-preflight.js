#!/usr/bin/env node

/**
 * GentsConcerts database reset preflight.
 *
 * This tool is intentionally READ-ONLY. It never drops collections, deletes
 * documents, creates users, or changes indexes. It creates a precise manifest
 * of the current MongoDB database so an approved reset can be reviewed safely.
 *
 * Usage:
 *   npm run db:reset:preflight
 *   npm run db:reset:preflight -- --write-manifest
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const WRITE_MANIFEST = process.argv.includes('--write-manifest');
const KNOWN_APPLICATION_COLLECTIONS = new Set([
  'users',
  'events',
  'tickets',
  'transactions',
  'activitylogs',
  'flags',
  'fs.files',
  'fs.chunks'
]);

function redactMongoUri(uri) {
  try {
    const parsed = new URL(uri);
    const auth = parsed.username ? '***:***@' : '';
    return `${parsed.protocol}//${auth}${parsed.host}${parsed.pathname}`;
  } catch {
    return '[unavailable]';
  }
}

function isApplicationCollection(name) {
  return KNOWN_APPLICATION_COLLECTIONS.has(name)
    || name.startsWith('fs.')
    || /^(users|events|tickets|transactions|activitylogs|flags)/.test(name);
}

async function buildManifest() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required. This preflight cannot run without an explicit database connection.');
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });

  const database = mongoose.connection.db;
  const collections = await database.listCollections({}, { nameOnly: true }).toArray();
  const manifestCollections = [];

  for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    const collection = database.collection(name);
    const documentCount = await collection.countDocuments({});
    const indexes = await collection.indexes();

    manifestCollections.push({
      name,
      resetScope: isApplicationCollection(name) ? 'APPLICATION_DATA' : 'OUTSIDE_APPLICATION_SCOPE',
      documentCount,
      indexes: indexes.map((index) => ({
        name: index.name,
        key: index.key,
        unique: Boolean(index.unique)
      }))
    });
  }

  const applicationCollections = manifestCollections.filter(
    (collection) => collection.resetScope === 'APPLICATION_DATA'
  );

  return {
    manifestVersion: 1,
    generatedAt: new Date().toISOString(),
    mode: 'READ_ONLY_PREFLIGHT',
    database: {
      redactedConnection: redactMongoUri(mongoUri),
      name: database.databaseName
    },
    summary: {
      totalCollections: manifestCollections.length,
      applicationCollections: applicationCollections.length,
      applicationDocuments: applicationCollections.reduce(
        (total, collection) => total + collection.documentCount,
        0
      )
    },
    collections: manifestCollections,
    resetGuard: {
      destructiveActionsPerformed: false,
      explicitUserApprovalRequiredBeforeReset: true,
      requiredPreResetControls: [
        'Verified backup or provider snapshot',
        'Restore rehearsal or archive-read validation',
        'User-approved final collection manifest',
        'Maintenance window with write traffic stopped',
        'Approved post-reset owner/admin bootstrap plan'
      ]
    }
  };
}

async function main() {
  try {
    const manifest = await buildManifest();
    const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

    if (WRITE_MANIFEST) {
      const outputDirectory = path.resolve(
        process.env.RESET_MANIFEST_DIR || path.join(__dirname, '..', 'reset-manifests')
      );
      fs.mkdirSync(outputDirectory, { recursive: true });
      const outputPath = path.join(
        outputDirectory,
        `reset-preflight-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      );
      fs.writeFileSync(outputPath, serialized, { mode: 0o600 });
      console.log(`Read-only reset manifest written to ${outputPath}`);
    } else {
      console.log(serialized);
    }

    console.log('No database records, collections, users, or indexes were changed.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(`Reset preflight failed: ${error.message}`);
  process.exitCode = 1;
});
