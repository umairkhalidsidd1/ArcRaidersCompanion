/**
 * In-App Review utility
 * Uses native SKStoreReviewController (iOS) / Play In-App Review API (Android)
 *
 * - iOS: system enforces max 3 prompts per 365 days
 * - Android: quota managed by Play Store
 * - We only add our own session/timing guards to avoid wasted calls
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import InAppReview from 'react-native-in-app-review';

const REVIEW_PROMPT_KEY = '@arcc_last_review_prompt';
const SESSION_COUNT_KEY = '@arcc_session_count';
const REVIEW_MILESTONE_KEY = '@arcc_review_milestones';
const MIN_DAYS_BETWEEN_PROMPTS = 30;

let _promptedThisSession = false;

/**
 * Track app session and request native review starting at 3rd session.
 */
export async function trackSessionAndMaybeReview(): Promise<void> {
  try {
    const milestones = await getReviewMilestones();
    if (milestones.sessionReviewDone) return;

    const countStr = await AsyncStorage.getItem(SESSION_COUNT_KEY);
    const count = (parseInt(countStr || '0', 10)) + 1;
    await AsyncStorage.setItem(SESSION_COUNT_KEY, count.toString());

    if (count < 3) return;

    const shown = await requestAppReview();
    if (shown) {
      await markMilestone('sessionReviewDone');
    }
  } catch {}
}

/**
 * Request native review after 5+ completed quests.
 */
export async function checkQuestMilestoneReview(completedQuestCount: number): Promise<void> {
  try {
    const milestones = await getReviewMilestones();
    if (milestones.quest5ReviewDone) return;

    if (completedQuestCount >= 5) {
      const shown = await requestAppReview();
      if (shown) {
        await markMilestone('quest5ReviewDone');
      }
    }
  } catch {}
}

type ReviewMilestones = {
  sessionReviewDone?: boolean;
  quest5ReviewDone?: boolean;
};

async function getReviewMilestones(): Promise<ReviewMilestones> {
  try {
    const data = await AsyncStorage.getItem(REVIEW_MILESTONE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

async function markMilestone(key: keyof ReviewMilestones): Promise<void> {
  const milestones = await getReviewMilestones();
  milestones[key] = true;
  await AsyncStorage.setItem(REVIEW_MILESTONE_KEY, JSON.stringify(milestones));
}

/**
 * Request native in-app review dialog.
 * @param force Skip session/timing guards (for explicit user actions like "Rate App").
 */
export async function requestAppReview(force = false): Promise<boolean> {
  try {
    if (!force && _promptedThisSession) return false;
    if (!InAppReview.isAvailable()) return false;

    if (!force) {
      const lastPrompt = await AsyncStorage.getItem(REVIEW_PROMPT_KEY);
      if (lastPrompt) {
        const daysSince =
          (Date.now() - parseInt(lastPrompt, 10)) / (1000 * 60 * 60 * 24);
        if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return false;
      }
    }

    const result = await InAppReview.RequestInAppReview();

    _promptedThisSession = true;
    await AsyncStorage.setItem(REVIEW_PROMPT_KEY, Date.now().toString());

    return result;
  } catch {
    return false;
  }
}

/**
 * Check if native review prompt is available.
 */
export function isReviewAvailable(): boolean {
  return InAppReview.isAvailable();
}
