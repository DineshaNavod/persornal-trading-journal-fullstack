// Private single-user credentials.
// These are compiled into the client bundle — this gate prevents casual
// access, not a determined attacker with source access. For true security
// migrate to Supabase Auth.
export const AUTH_USERNAME = "dinesha";
export const AUTH_PASSWORD = "DineSHa@05256#";

// Session expires after this many hours of inactivity.
export const SESSION_HOURS = 8;
