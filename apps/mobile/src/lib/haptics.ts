import * as Haptics from "expo-haptics";

/**
 * Enhanced Haptic Feedback Patterns
 * Provides premium haptic feedback for various user interactions
 */

export const hapticPatterns = {
  /**
   * Light tap - for button presses, selections
   */
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Medium impact - for swipes, toggles
   */
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy impact - for important actions, confirmations
   */
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Success pattern - double light tap
   */
  success: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
  },

  /**
   * Error pattern - heavy + light
   */
  error: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 150);
  },

  /**
   * Warning pattern - medium + medium
   */
  warning: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
  },

  /**
   * Match celebration - triple tap with increasing intensity
   */
  celebration: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);
  },

  /**
   * Swipe right (apply) - smooth medium impact
   */
  swipeRight: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Swipe left (skip) - light impact
   */
  swipeLeft: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Selection feedback - light tap
   */
  selection: () => {
    Haptics.selectionAsync();
  },

  /**
   * Notification feedback - system notification
   */
  notification: (type: "success" | "warning" | "error" = "success") => {
    const feedbackType = {
      success: Haptics.NotificationFeedbackType.Success,
      warning: Haptics.NotificationFeedbackType.Warning,
      error: Haptics.NotificationFeedbackType.Error,
    }[type];

    Haptics.notificationAsync(feedbackType);
  },

  /**
   * Pull to refresh - light selection
   */
  pullToRefresh: () => {
    Haptics.selectionAsync();
  },

  /**
   * Card snap - medium impact
   */
  cardSnap: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Urgent badge - double heavy for urgent listings
   */
  urgent: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 80);
  },

  /**
   * Boost activation - triple tap pattern
   */
  boost: async () => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, i * 80);
    }
  },

  /**
   * Level up / achievement - celebration pattern
   */
  achievement: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 200);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 300);
  },

  /**
   * Payment success - smooth success pattern
   */
  paymentSuccess: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 150);
  },

  /**
   * Check-in success - double medium
   */
  checkIn: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 120);
  },
};

/**
 * Haptic feedback for specific app actions
 */
export const appHaptics = {
  // Deck interactions
  deckSwipeRight: () => hapticPatterns.swipeRight(),
  deckSwipeLeft: () => hapticPatterns.swipeLeft(),
  deckMatch: () => hapticPatterns.celebration(),
  deckCardSnap: () => hapticPatterns.cardSnap(),

  // UI interactions
  buttonPress: () => hapticPatterns.light(),
  toggleSwitch: () => hapticPatterns.medium(),
  tabSwitch: () => hapticPatterns.selection(),
  modalOpen: () => hapticPatterns.light(),
  modalClose: () => hapticPatterns.light(),

  // Feedback
  success: () => hapticPatterns.notification("success"),
  error: () => hapticPatterns.notification("error"),
  warning: () => hapticPatterns.notification("warning"),

  // Special actions
  urgentListing: () => hapticPatterns.urgent(),
  boostActivated: () => hapticPatterns.boost(),
  achievementUnlocked: () => hapticPatterns.achievement(),
  paymentComplete: () => hapticPatterns.paymentSuccess(),
  checkInSuccess: () => hapticPatterns.checkIn(),

  // Pull to refresh
  refreshStart: () => hapticPatterns.pullToRefresh(),
  refreshComplete: () => hapticPatterns.success(),
};

// Made with Bob
