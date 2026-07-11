import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Accessibility Utilities for WCAG 2.1 AA Compliance
 * Ensures app is usable by people with disabilities
 */

/**
 * Color contrast ratios for WCAG 2.1 AA
 */
export const CONTRAST_RATIOS = {
  NORMAL_TEXT: 4.5, // 4.5:1 for normal text
  LARGE_TEXT: 3, // 3:1 for large text (18pt+ or 14pt+ bold)
  UI_COMPONENTS: 3, // 3:1 for UI components and graphics
};

/**
 * Minimum touch target sizes (44x44 points)
 */
export const TOUCH_TARGET = {
  MIN_WIDTH: 44,
  MIN_HEIGHT: 44,
  RECOMMENDED_WIDTH: 48,
  RECOMMENDED_HEIGHT: 48,
};

/**
 * Calculate relative luminance of a color
 */
const getRelativeLuminance = (r: number, g: number, b: number): number => {
  const values = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const [rs = 0, gs = 0, bs = 0] = values;
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  // Parse hex colors
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);

  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);

  const l1 = getRelativeLuminance(r1, g1, b1);
  const l2 = getRelativeLuminance(r2, g2, b2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if color combination meets WCAG AA standards
 */
export const meetsWCAG_AA = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const required = isLargeText ? CONTRAST_RATIOS.LARGE_TEXT : CONTRAST_RATIOS.NORMAL_TEXT;
  return ratio >= required;
};

/**
 * Accessibility labels for common actions
 */
export const A11Y_LABELS = {
  // Navigation
  BACK: 'Go back',
  CLOSE: 'Close',
  MENU: 'Open menu',
  SEARCH: 'Search',
  FILTER: 'Filter results',
  SORT: 'Sort options',

  // Actions
  SUBMIT: 'Submit form',
  SAVE: 'Save changes',
  DELETE: 'Delete item',
  EDIT: 'Edit item',
  SHARE: 'Share',
  LIKE: 'Like',
  UNLIKE: 'Unlike',

  // Swipe actions
  SWIPE_RIGHT: 'Swipe right to apply',
  SWIPE_LEFT: 'Swipe left to skip',
  
  // Status
  LOADING: 'Loading content',
  ERROR: 'Error occurred',
  SUCCESS: 'Action successful',
  
  // Forms
  REQUIRED_FIELD: 'Required field',
  OPTIONAL_FIELD: 'Optional field',
  INVALID_INPUT: 'Invalid input',
};

/**
 * Accessibility hints for complex interactions
 */
export const A11Y_HINTS = {
  SWIPE_CARD: 'Swipe right to apply, swipe left to skip, or tap for details',
  DOUBLE_TAP: 'Double tap to activate',
  LONG_PRESS: 'Long press for more options',
  DRAG_DROP: 'Drag to reorder items',
  PINCH_ZOOM: 'Pinch to zoom',
};

/**
 * Screen reader announcements
 */
export class ScreenReaderAnnouncer {
  /**
   * Announce a message to screen readers
   */
  static announce(message: string, delay: number = 0): void {
    setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(message);
    }, delay);
  }

  /**
   * Announce success message
   */
  static announceSuccess(message: string): void {
    this.announce(`Success: ${message}`);
  }

  /**
   * Announce error message
   */
  static announceError(message: string): void {
    this.announce(`Error: ${message}`);
  }

  /**
   * Announce loading state
   */
  static announceLoading(message: string = 'Loading'): void {
    this.announce(message);
  }

  /**
   * Announce page change
   */
  static announcePage(pageName: string): void {
    this.announce(`Navigated to ${pageName}`, 500);
  }
}

/**
 * Check if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  return await AccessibilityInfo.isScreenReaderEnabled();
};

/**
 * Check if reduce motion is enabled
 */
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return await AccessibilityInfo.isReduceMotionEnabled();
  }
  return false;
};

/**
 * Accessible button props generator
 */
export const getAccessibleButtonProps = (label: string, hint?: string) => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: 'button' as const,
  accessibilityState: { disabled: false },
});

/**
 * Accessible text input props generator
 */
export const getAccessibleInputProps = (
  label: string,
  isRequired: boolean = false,
  error?: string
) => ({
  accessible: true,
  accessibilityLabel: `${label}${isRequired ? ', required' : ''}`,
  accessibilityHint: error || undefined,
  accessibilityRole: 'text' as const,
  accessibilityState: { disabled: false },
});

/**
 * Accessible image props generator
 */
export const getAccessibleImageProps = (description: string) => ({
  accessible: true,
  accessibilityLabel: description,
  accessibilityRole: 'image' as const,
});

/**
 * Accessible link props generator
 */
export const getAccessibleLinkProps = (label: string, destination?: string) => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: destination ? `Opens ${destination}` : undefined,
  accessibilityRole: 'link' as const,
});

/**
 * Accessible header props generator
 */
export const getAccessibleHeaderProps = (level: 1 | 2 | 3 | 4 | 5 | 6, text: string) => ({
  accessible: true,
  accessibilityLabel: text,
  accessibilityRole: 'header' as const,
  accessibilityLevel: level,
});

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusedElement: any = null;

  /**
   * Set focus to an element
   */
  static setFocus(ref: any): void {
    if (ref && ref.current) {
      this.focusedElement = ref.current;
      AccessibilityInfo.setAccessibilityFocus(ref.current);
    }
  }

  /**
   * Get currently focused element
   */
  static getFocusedElement(): any {
    return this.focusedElement;
  }

  /**
   * Clear focus
   */
  static clearFocus(): void {
    this.focusedElement = null;
  }
}

/**
 * Keyboard navigation utilities
 */
export const KEYBOARD_SHORTCUTS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: 'Space',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
};

/**
 * Semantic HTML roles for React Native
 */
export const ACCESSIBILITY_ROLES = {
  BUTTON: 'button' as const,
  LINK: 'link' as const,
  SEARCH: 'search' as const,
  IMAGE: 'image' as const,
  TEXT: 'text' as const,
  HEADER: 'header' as const,
  SUMMARY: 'summary' as const,
  ADJUSTABLE: 'adjustable' as const,
  IMAGEBUTTON: 'imagebutton' as const,
  KEYBOARDKEY: 'keyboardkey' as const,
  NONE: 'none' as const,
  CHECKBOX: 'checkbox' as const,
  RADIO: 'radio' as const,
  SWITCH: 'switch' as const,
  TAB: 'tab' as const,
  MENU: 'menu' as const,
  MENUBAR: 'menubar' as const,
  MENUITEM: 'menuitem' as const,
  PROGRESSBAR: 'progressbar' as const,
  TIMER: 'timer' as const,
  TOOLBAR: 'toolbar' as const,
};

/**
 * Accessibility testing checklist
 */
export const ACCESSIBILITY_CHECKLIST = {
  visual: [
    'All text has sufficient contrast (4.5:1 for normal, 3:1 for large)',
    'UI components have 3:1 contrast ratio',
    'Focus indicators are clearly visible',
    'Color is not the only means of conveying information',
    'Text can be resized up to 200% without loss of functionality',
  ],
  interactive: [
    'All interactive elements have minimum 44x44 touch targets',
    'All buttons have descriptive labels',
    'All form inputs have labels',
    'Error messages are clear and helpful',
    'Success/failure feedback is provided',
  ],
  navigation: [
    'Logical tab order throughout the app',
    'Skip navigation links provided',
    'Breadcrumbs or clear navigation structure',
    'Back button always available',
    'Current location is clearly indicated',
  ],
  content: [
    'All images have alt text',
    'Videos have captions',
    'Audio has transcripts',
    'Complex images have long descriptions',
    'Abbreviations are explained on first use',
  ],
  screenReader: [
    'All content is accessible to screen readers',
    'Proper heading hierarchy (h1, h2, h3)',
    'Lists are marked up as lists',
    'Tables have proper headers',
    'Dynamic content changes are announced',
  ],
  motion: [
    'Animations can be disabled',
    'No content flashes more than 3 times per second',
    'Auto-playing content can be paused',
    'Timeouts can be extended',
    'Reduce motion preference is respected',
  ],
};

/**
 * Export all utilities
 */
export default {
  CONTRAST_RATIOS,
  TOUCH_TARGET,
  getContrastRatio,
  meetsWCAG_AA,
  A11Y_LABELS,
  A11Y_HINTS,
  ScreenReaderAnnouncer,
  isScreenReaderEnabled,
  isReduceMotionEnabled,
  getAccessibleButtonProps,
  getAccessibleInputProps,
  getAccessibleImageProps,
  getAccessibleLinkProps,
  getAccessibleHeaderProps,
  FocusManager,
  KEYBOARD_SHORTCUTS,
  ACCESSIBILITY_ROLES,
  ACCESSIBILITY_CHECKLIST,
};

// Made with Bob
