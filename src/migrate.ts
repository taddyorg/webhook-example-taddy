import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient);

await migrate(db, { migrationsFolder: "./drizzle" });
await migrationClient.end();
console.log("Migrations complete");
