import { isCustomBranding } from '@/const/version';

/**
 * A link to the vendor's own site, dropped on a rebranded build.
 *
 * `OFFICIAL_SITE`, `PRIVACY_URL`, `GITHUB_ISSUES` and the rest all point at
 * lobehub.com. They are correct for the upstream build and wrong for every
 * other one: a distribution that renders them sends its users to a different
 * product's terms, docs or issue tracker under its own branding.
 *
 * Returning `undefined` rather than a replacement is deliberate. There is no
 * safe substitute to guess — a deployment either publishes its own page or it
 * does not — so call sites treat the absence as "render the label as plain
 * text, or drop the row", which is what they already do for an optional link.
 *
 * Extracted from the About page, which has been doing exactly this since the
 * branding work started; the surfaces added since had each been missing it.
 */
export const vendorLink = (href: string): string | undefined =>
  isCustomBranding ? undefined : href;
