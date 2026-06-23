// Hardcoded credentials for this private, single-user journal.
// Change these before you deploy anywhere other than your own machine.
//
// Note: because this is a client-side app, these values end up in the
// JavaScript bundle that ships to the browser — anyone who really wants to
// read the source could find them. This gate is meant to keep the app off
// casual/accidental access (e.g. a shared link), not to withstand a
// determined attacker. If you ever need real security, swap this for
// Supabase Auth instead.

export const AUTH_USERNAME = "dinesha";
export const AUTH_PASSWORD = "changeme123";
