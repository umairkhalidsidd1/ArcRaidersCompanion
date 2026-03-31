/**
 * In-App Review utility
 * Uses native App Store / Play Store review dialogs
 *
 * Best practices:
 * - iOS allows max 3 prompts per year (system enforced)
 * - Ask after positive experiences (quest completion, etc.)
 * - Don't ask immediately on first launch
 * - Track if already prompted this session to avoid spam
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import InAppReview from 'react-native-in-app-review';

const REVIEW_PROMPT_KEY = '@arcc_last_review_prompt';
const SESSION_COUNT_KEY = '@arcc_session_count';
const REVIEW_MILESTONE_KEY = '@arcc_review_milestones';
const MIN_DAYS_BETWEEN_PROMPTS = 30; // Don't prompt more than once per month

let _promptedThisSession = false;

/**
 * Track app session and prompt on 3rd session
 * Call this once at app startup (e.g., in App.tsx or HomeScreen)
 */
export async function trackSessionAndMaybeReview(): Promise<void> {
  try {
    const milestones = await getReviewMilestones();
    if (milestones.sessionReviewDone) return; // Already did session-based review

    const countStr = await AsyncStorage.getItem(SESSION_COUNT_KEY);
    const count = (parseInt(countStr || '0', 10)) + 1;
    await AsyncStorage.setItem(SESSION_COUNT_KEY, count.toString());

    if (count === 3) {
      const shown = await requestAppReview(true); // force=true, no cooldown for milestone
      if (shown) {
        await markMilestone('sessionReviewDone');
      }
    }
  } catch {}
}

/**
 * Check if we should prompt after quest completion
 * Call this after a quest is marked complete
 */
export async function checkQuestMilestoneReview(completedQuestCount: number): Promise<void> {
  try {
    const milestones = await getReviewMilestones();
    if (milestones.quest5ReviewDone) return; // Already did 5-quest review

    if (completedQuestCount === 5) {
      const shown = await requestAppReview(true); // force=true, no cooldown for milestone
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
 * Request in-app review if appropriate
 * @param force - Skip timing checks (use for explicit user actions like "Rate App" button)
 */
export async function requestAppReview(force = false): Promise<boolean> {
  try {
    // Don't prompt twice in same session unless forced
    if (_promptedThisSession && !force) {
      return false;
    }

    // Check if native review is available
    if (!InAppReview.isAvailable()) {
      return false;
    }

    // Check timing (unless forced)
    if (!force) {
      const lastPrompt = await AsyncStorage.getItem(REVIEW_PROMPT_KEY);
      if (lastPrompt) {
        const daysSince = (Date.now() - parseInt(lastPrompt, 10)) / (1000 * 60 * 60 * 24);
        if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) {
          return false;
        }
      }
    }

    // Request the review
    const result = await InAppReview.RequestInAppReview();
    
    // Track that we prompted
    _promptedThisSession = true;
    await AsyncStorage.setItem(REVIEW_PROMPT_KEY, Date.now().toString());

    return result;
  } catch {
    return false;
  }
}

/**
 * Check if review prompt is available (for UI purposes)
 */
export function isReviewAvailable(): boolean {
  return InAppReview.isAvailable();
}
