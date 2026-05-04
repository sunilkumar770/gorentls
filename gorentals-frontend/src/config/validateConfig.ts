/**
 * Runtime validation of required environment variables.
 * This runs in the browser and ensures the app has proper configuration.
 */

const REQUIRED_ENV_VARS = {
  NEXT_PUBLIC_API_URL: {
    description: "Backend API base URL",
    example: "https://api.gorentals.com",
  },
} as const;

export function validateConfiguration(): void {
  const missingVars: string[] = [];
  const invalidVars: string[] = [];

  // Check for missing variables
  for (const key of Object.keys(REQUIRED_ENV_VARS)) {
    const value = process.env[key];

    if (!value) {
      missingVars.push(key);
    } else if (!isValidUrl(value)) {
      invalidVars.push(`${key}="${value}" (must be valid URL)`);
    }
  }

  // Fail fast if validation fails
  if (missingVars.length > 0 || invalidVars.length > 0) {
    const errorMessage = [
      "\n❌ Configuration Validation Failed\n",
      missingVars.length > 0 && `Missing variables:\n${missingVars.map(v => `  • ${v}`).join("\n")}\n`,
      invalidVars.length > 0 && `Invalid variables:\n${invalidVars.map(v => `  • ${v}`).join("\n")}\n`,
      "Please check your environment configuration.",
    ]
      .filter(Boolean)
      .join("");

    console.error(errorMessage);
    throw new Error("Application configuration is invalid");
  }

  console.log("✅ Configuration validation passed");
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
