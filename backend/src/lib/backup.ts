import fs from "fs";
import path from "path";

export function createBackup(): string {
  const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./data/marketflow.db";

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database not found at ${dbPath}`);
  }

  const backupDir = process.env.BACKUP_DIR || "./data/backups";
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `marketflow-${timestamp}.db`);

  const { execSync } = require("child_process");
  execSync(`cp "${dbPath}" "${backupPath}"`);

  fs.writeFileSync(
    backupPath.replace(/\.db$/, ".json"),
    JSON.stringify({
      backupOf: dbPath,
      createdAt: new Date().toISOString(),
      version: "1.0.0",
    }, null, 2)
  );

  return backupPath;
}

export function cleanupOldBackups(maxAgeDays = 30): number {
  const backupDir = process.env.BACKUP_DIR || "./data/backups";
  if (!fs.existsSync(backupDir)) return 0;

  const cutoff = Date.now() - maxAgeDays * 86400000;
  let removed = 0;

  for (const file of fs.readdirSync(backupDir)) {
    const filePath = path.join(backupDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile() && stat.mtimeMs < cutoff) {
      fs.unlinkSync(filePath);
      removed++;
    }
  }

  return removed;
}

if (process.argv[1]?.includes("backup")) {
  try {
    const backupPath = createBackup();
    const cleaned = cleanupOldBackups();
    console.log(`Backup created: ${backupPath}`);
    console.log(`Old backups cleaned: ${cleaned}`);
    process.exit(0);
  } catch (err) {
    console.error("Backup failed:", err);
    process.exit(1);
  }
}
