// @ts-check
/**
 * This file is included in `/next.config.mjs` which ensures the app isn't built with invalid env vars.
 * It has to be a `.mjs`-file to be imported there.
 */
import { serverSchema } from "./schema.mjs";
import { env as clientEnv, formatErrors } from "./client.mjs";

// SKIP_ENV_VALIDATION (CI, Docker builds) hands back process.env unchecked,
// so a build can run without real secrets. Never set it in production.
const parsed = process.env.SKIP_ENV_VALIDATION
  ? null
  : serverSchema.safeParse(process.env);

if (parsed && !parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(parsed.error.format()),
  );
  throw new Error("Invalid environment variables");
}

const serverEnv = /** @type {import('zod').infer<typeof serverSchema>} */ (
  parsed ? parsed.data : process.env
);

for (let key of parsed ? Object.keys(serverEnv) : []) {
  if (key.startsWith("NEXT_PUBLIC_")) {
    console.warn("❌ You are exposing a server-side env-variable:", key);

    throw new Error("You are exposing a server-side env-variable");
  }
}

export const env = { ...serverEnv, ...clientEnv };
