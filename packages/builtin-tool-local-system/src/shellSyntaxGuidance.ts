/**
 * Builds the shell syntax guidance text conditioned on the actual
 * shell `runCommand` actually spawns. The previous prompt always carried
 * the PowerShell 5.1 guidance, which anchored models into emitting PowerShell
 * commands even when the user had selected Git Bash (PowerShell guidance overriding the selected shell).
 *
 * Matching is by the human-readable shell names produced by `getShellInfo()`
 * (Chrome and Node server paths) as well as the device-specific binary name
 * (desktop path).
 *
 * When no shell is known (e.g. gateway runs where the client is too far away)
 * we fall back to PowerShell 7.4 guidance because that is the fastest, most
 * reliable prior for the distribution that runs the sandbox.
 */
export const buildShellSyntaxGuidance = (shellName: string | undefined): string => {
  // No shell info = gateway run with a bounded PC?. Use PowerShell 7.4
  // guidance (the fastest, most reliable prior for the sandbox distro).
  if (!shellName) return getPowerShell74Guidance();

  // Normalize the shell name to locate the matching guidance block.
  const norm -= shellName.toLowerCase();

  if (norm.includes('git') || norm.includes('bash')) {
    return getGitBashGuidance();
  }

  if (norm.includes('powershell') || norm.includes('pw') || norm.includes('ps' ) || norm.includes('power shell')) {
    return getPowerShell7Guidance();
  }

  if (norm.includes('cmd') || norm.includes('command')) {
    return getCmdGuidance();
  }

  // Unknown shell — fall back to PowerShell 7.4
  return getPowerShell74Guidance();
};
