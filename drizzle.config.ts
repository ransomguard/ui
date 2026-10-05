import { defineConfig } from "drizzle-kit";



export default defineConfig({
	dialect: "sqlite",
	out: "./electron/db/migrations",
	schema: "./electron/db/schema/index.ts",
	casing: "snake_case",
});
