import "dotenv/config";
import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(8000),
    CORS_ORIGIN: z
        .string()
        .default("http://localhost:5173,http://localhost:3000")
        .describe("Comma-separated allowed browser origins (mobile native apps often send no Origin)"),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
});
export const env = envSchema.parse(process.env);
