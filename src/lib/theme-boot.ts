/**
 * Inline script that applies the saved theme before first paint, preventing a
 * flash of the wrong theme (FOUC). It must stay dependency-free and CSP-safe.
 *
 * The SHA-256 hash below is allowlisted in the Content-Security-Policy
 * (see security-headers.ts) so this script can run without 'unsafe-inline'.
 * If you edit THEME_BOOT_SCRIPT, you MUST recompute THEME_BOOT_SCRIPT_HASH or
 * the browser will block the script. A test in tests/csp.test.ts enforces this.
 */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("vb-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export const THEME_BOOT_SCRIPT_HASH =
  "sha256-elYi7S0wuXL47DnraEI1T3MV8PR1iHwsaEfBpJKQIUs=";
