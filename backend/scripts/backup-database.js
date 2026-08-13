require('dotenv').config();

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');
const mongoose = require('mongoose');

const confirmBackup = process.argv.includes('--confirm-backup');

if (!confirmBackup) {
  console.error('Refusing to back up without --confirm-backup. Example: npm run db:backup -- --confirm-backup');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required to create a database backup.');
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupRoot = path.resolve(__dirname, '..', '..', 'backups', `mongodb-${timestamp}`);

async function backupCollection(db, collectionName) {
  const destination = path.join(backupRoot, `${collectionName}.jsonl.gz`);
  const cursor = db.collection(collectionName).find({});
  const output = fs.createWriteStream(destination, { flags: 'wx' });
  const gzip = zlib.createGzip({ level: 9 });
  let documents = 0;

  const source = async function* () {
    for await (const document of cursor) {
      documents += 1;
      yield `${JSON.stringify(document)}\n`;
    }
  };

  await pipeline(source(), gzip, output);
  return { collection: collectionName, documents, file: path.basename(destination) };
}

async function main() {
  fs.mkdirSync(backupRoot, { recursive: true });
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const db = mongoose.connection.db;
    const collections = (await db.listCollections().toArray())
      .map(({ name }) => name)
      .filter((name) => !name.startsWith('system.'))
      .sort();

    const results = [];
    for (const collection of collections) {
      results.push(await backupCollection(db, collection));
    }

    const manifest = {
      createdAt: new Date().toISOString(),
      database: db.databaseName,
      collections: results,
      restoreNotice: 'Validate this archive with a controlled restore before authorizing any database reset.'
    };
    fs.writeFileSync(path.join(backupRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
    console.log(`Backup completed: ${backupRoot}`);
    console.table(results.map(({ collection, documents }) => ({ collection, documents })));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Backup failed:', error.message);
  process.exitCode = 1;
});
