import type { AskUserDraft, AskUserQuestionItem } from './types';

/**
 * The one sentinel key, and it lives in the *submit payload* — never in the
 * draft. When the payload sent back is exactly `{ __freeform__: <text> }`, the
 * bridge formatter forwards the text verbatim — no `User answers:` framing.
 * The in-progress draft keeps this same text in a named `escapeText` field
 * instead, so no sentinel leaks into form state.
 */
export const FREEFORM_PAYLOAD_KEY = '__freeform__';

/**
 * Default on-screen countdown, mirroring the server-side bridge timeout
 * (`DEFAULT_ASK_USER_TIMEOUT_MS`). Hosts that have no bridge timeout (the
 * builtin surfaces) pass `undefined` to disable the countdown entirely.
 */
export const DEFAULT_COUNTDOWN_MS = 10 * 60 * 1000;

/** Key under tool message `pluginState` where the in-progress draft lives. */
export const DRAFT_PLUGIN_STATE_KEY = 'askUserDraft';

/** Coerce a persisted (possibly partial / legacy) blob into a full draft. */
export const readDraft = (raw: unknown): AskUserDraft => {
  const d = (raw ?? {}) as Partial<AskUserDraft>;
  return {
    custom: d.custom ?? {},
    escapeActive: !!d.escapeActive,
    escapeText: typeof d.escapeText === 'string' ? d.escapeText : '',
    picks: d.picks ?? {},
  };
};

/** Stable form/payload key, with legacy question-text compatibility. */
export const getQuestionKey = (question: AskUserQuestionItem): string =>
  question.id ?? question.question;

/** A question counts as answered when it has a pick or non-empty custom text. */
export const isQuestionAnswered = (
  q: AskUserQuestionItem,
  picks: Record<string, string | string[]>,
  custom: Record<string, string>,
): boolean => {
  const key = getQuestionKey(q);
  if (custom[key]?.trim()) return true;
  const a = picks[key];
  return q.multiSelect ? Array.isArray(a) && a.length > 0 : !!a;
};

/**
 * Merge picks + custom text into the structured payload: each question maps to
 * its picks, its custom text, or both (multi-select appends custom as an extra
 * entry). Shared by the Submit button and the timeout fallback so the two never
 * diverge.
 */
export const buildSubmitPayload = (
  questions: AskUserQuestionItem[],
  picks: Record<string, string | string[]>,
  custom: Record<string, string>,
): Record<string, string | string[]> => {
  const payload: Record<string, string | string[]> = {};
  for (const q of questions) {
    const key = getQuestionKey(q);
    const text = custom[key]?.trim();
    if (q.multiSelect) {
      const chosen = Array.isArray(picks[key]) ? (picks[key] as string[]) : [];
      const merged = text ? [...chosen, text] : chosen;
      if (merged.length > 0) payload[key] = merged;
    } else if (text) {
      payload[key] = text;
    } else if (picks[key]) {
      payload[key] = picks[key];
    }
  }
  return payload;
};

export const formatRemaining = (msLeft: number): string => {
  const totalSec = Math.max(0, Math.floor(msLeft / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};
