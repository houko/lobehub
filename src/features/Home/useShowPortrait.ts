import { HOME_PORTRAIT_ENABLED } from '@lobechat/business-const';

import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';

/**
 * Whether the dashboard mounts the Chief Agent portrait and the speech bubble
 * beside it. The two are one decision: the bubble's tail points at the portrait
 * and its copy is written as the agent speaking, so shipping either alone is a
 * bug rather than a variant.
 *
 * Signed-out visitors never had a portrait — there is no agent to speak the
 * line — and `HOME_PORTRAIT_ENABLED` lets a distribution drop it entirely. That
 * matters to self-hosted installs in particular: the artwork is served from the
 * hosted ops bucket, so it is the one thing on this page that cannot come from
 * the deployment's own origin.
 *
 * `showHomePortrait` is the user's own Customize-home switch. It sits below the
 * distribution flag rather than beside it: a deployment that ships no portrait
 * cannot have one turned back on from the UI.
 */
export const useShowPortrait = (): boolean => {
  const isLogin = useUserStore(authSelectors.isLogin);
  const showHomePortrait = useGlobalStore(systemStatusSelectors.showHomePortrait);

  return Boolean(isLogin && showHomePortrait && HOME_PORTRAIT_ENABLED);
};
