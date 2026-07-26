import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

const configDirectory = dirname(fileURLToPath(import.meta.url));
config({ path: join(configDirectory, ".env") });

export default defineConfig({
  schema: join(configDirectory, "schema.prisma"),
  migrations: {
    path: join(configDirectory, "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
