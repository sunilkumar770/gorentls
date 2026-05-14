/**
 * Runtime validation of required environment variables.
 * This runs at build time (next.config.ts) and server-side on startup.
 */

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const REQUIRED_ENV_VARS = {
  NEXT_PUBLIC_API_URL: {
    description: "Backend API base URL",
    example: "https://api.gorentals.com",
    validate: isValidUrl,
  },
  NEXT_PUBLIC_RAZORPAY_KEY_ID: {
    description: "Razorpay public key (rzp_live_xxx or rzp_test_xxx)",
    example: "rzp_live_xxxxxxxxxxxxxxxx",
    validate: (v: string) => v.startsWith('rzp_'),
  },
  NEXT_PUBLIC_WS_URL: {
    description: "WebSocket URL for real-time chat",
    example: "wss://api.gorentals.com/ws/chat",
    validate: (v: string) => v.startsWith('ws://') || v.startsWith('wss://'),
  },
} as const;

// Optional vars: warn if missing but don't block startup
const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

export function validateConfiguration(): void {
  const missingVars: string[] = [];
  const invalidVars: string[] = [];

  for (const key of Object.keys(REQUIRED_ENV_VARS) as Array<keyof typeof REQUIRED_ENV_VARS>) {
    const value = process.env[key];
    const config = REQUIRED_ENV_VARS[key];

    if (!value) {
      missingVars.push(key);
    } else if (config.validate && !config.validate(value)) {
      invalidVars.push(`${key}="${value}" (must match: ${config.description})`);
    }
  }

  // Warn about optional vars
  for (const key of OPTIONAL_ENV_VARS) {
    if (!process.env[key]) {
      console.warn(`[GoRentals] Optional env var ${key} is not set. File uploads and realtime features may be disabled.`);
    }
  }

  if (missingVars.length > 0 || invalidVars.length > 0) {
    const errorMessage = [
      "\n\u274C Configuration Validation Failed\n",
      missingVars.length > 0 && `Missing variables:\n${missingVars.map((v) => `  • ${v}`).join('\n')}`,
      invalidVars.length > 0 && `Invalid variables:\n${invalidVars.map((v) => `  • ${v}`).join('\n')}`,
      "Please check your environment configuration.",
    ]
      .filter(Boolean)
      .join("\n");

    throw new Error(errorMessage);
  }
}
