import { describe, expect, it, vi } from 'vitest';

const load = async (isCustomBranding: boolean) => {
  vi.resetModules();
  vi.doMock('@/const/version', () => ({ isCustomBranding }));

  const { vendorLink } = await import('./vendorLink');
  return vendorLink;
};

describe('vendorLink', () => {
  it('drops the link on a rebranded build', async () => {
    const vendorLink = await load(true);

    // The failure this prevents: a customer-branded product whose "terms of
    // service" opens a different company's terms.
    expect(vendorLink('https://lobehub.com/terms')).toBeUndefined();
  });

  it('leaves an upstream build untouched', async () => {
    const vendorLink = await load(false);

    expect(vendorLink('https://lobehub.com/terms')).toBe('https://lobehub.com/terms');
  });
});
