import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18n } from 'i18n-js';

/**
 * Internationalization (i18n) Service
 * Multi-language support for English and Hindi
 */

// Translation strings
const translations = {
  en: {
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      skip: 'Skip',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      apply: 'Apply',
      reset: 'Reset',
      viewAll: 'View All',
      seeMore: 'See More',
      seeLess: 'See Less',
      retry: 'Retry',
      refresh: 'Refresh',
    },

    // Authentication
    auth: {
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      phone: 'Phone Number',
      otp: 'OTP',
      enterOtp: 'Enter OTP',
      verifyOtp: 'Verify OTP',
      resendOtp: 'Resend OTP',
      welcomeBack: 'Welcome Back!',
      getStarted: 'Get Started',
      selectRole: 'Select Your Role',
      student: 'Student',
      business: 'Business',
      continueAs: 'Continue as {{role}}',
    },

    // Onboarding
    onboarding: {
      welcome: 'Welcome to Hustl',
      studentTitle: 'Find Gigs That Fit Your Schedule',
      studentDesc: 'Earn money while studying with flexible part-time opportunities',
      businessTitle: 'Hire Talented Students',
      businessDesc: 'Connect with skilled students for your business needs',
      name: 'Full Name',
      college: 'College/University',
      city: 'City',
      skills: 'Skills',
      addSkill: 'Add Skill',
      bio: 'Bio',
      businessName: 'Business Name',
      category: 'Category',
      description: 'Description',
      completeProfile: 'Complete Your Profile',
    },

    // Deck (Student)
    deck: {
      title: 'Find Gigs',
      noListings: 'No more listings available',
      swipeRight: 'Swipe right to apply',
      swipeLeft: 'Swipe left to skip',
      itsAMatch: "It's a Match!",
      matchMessage: 'You matched with {{business}}',
      viewDetails: 'View Details',
      hourlyRate: '₹{{rate}}/hr',
      duration: '{{hours}} hours',
      urgent: 'URGENT',
      boosted: 'BOOSTED',
      requiredSkills: 'Required Skills',
      startTime: 'Start Time',
      location: 'Location',
    },

    // Matches
    matches: {
      title: 'My Matches',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      noMatches: 'No matches yet',
      startApplying: 'Start applying to gigs',
      viewChat: 'View Chat',
      checkIn: 'Check In',
      checkOut: 'Check Out',
      leaveReview: 'Leave Review',
      status: {
        pending: 'Pending',
        accepted: 'Accepted',
        rejected: 'Rejected',
        inProgress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
    },

    // Chat
    chat: {
      title: 'Messages',
      typeMessage: 'Type a message...',
      send: 'Send',
      noMessages: 'No messages yet',
      startConversation: 'Start a conversation',
      online: 'Online',
      offline: 'Offline',
      typing: 'typing...',
    },

    // Profile
    profile: {
      title: 'Profile',
      editProfile: 'Edit Profile',
      reputation: 'Reputation',
      completedShifts: 'Completed Shifts',
      earnings: 'Total Earnings',
      reviews: 'Reviews',
      badges: 'Badges',
      achievements: 'Achievements',
      settings: 'Settings',
      help: 'Help & Support',
      about: 'About',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      version: 'Version',
    },

    // Wallet
    wallet: {
      title: 'Wallet',
      balance: 'Balance',
      earnings: 'Earnings',
      withdraw: 'Withdraw',
      addMoney: 'Add Money',
      transactions: 'Transactions',
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      noTransactions: 'No transactions yet',
      withdrawAmount: 'Withdraw Amount',
      minimumWithdrawal: 'Minimum withdrawal: ₹{{amount}}',
      processingTime: 'Processing time: 1-3 business days',
    },

    // Business
    business: {
      postGig: 'Post a Gig',
      myListings: 'My Listings',
      analytics: 'Analytics',
      title: 'Gig Title',
      description: 'Description',
      category: 'Category',
      hourlyRate: 'Hourly Rate',
      duration: 'Duration (hours)',
      startTime: 'Start Time',
      endTime: 'End Time',
      requiredSkills: 'Required Skills',
      location: 'Location',
      makeUrgent: 'Make Urgent',
      boostListing: 'Boost Listing',
      publish: 'Publish',
      draft: 'Save as Draft',
    },

    // Notifications
    notifications: {
      title: 'Notifications',
      markAllRead: 'Mark All as Read',
      noNotifications: 'No notifications',
      newMatch: 'New Match!',
      matchAccepted: 'Match Accepted',
      matchRejected: 'Match Rejected',
      shiftStarting: 'Shift Starting Soon',
      shiftCompleted: 'Shift Completed',
      paymentReceived: 'Payment Received',
      newMessage: 'New Message',
      reviewReceived: 'New Review',
      achievementUnlocked: 'Achievement Unlocked!',
    },

    // Reviews
    reviews: {
      title: 'Reviews',
      writeReview: 'Write a Review',
      rating: 'Rating',
      comment: 'Comment',
      submit: 'Submit Review',
      helpful: 'Helpful',
      notHelpful: 'Not Helpful',
      reportReview: 'Report Review',
      noReviews: 'No reviews yet',
    },

    // Errors
    errors: {
      generic: 'Something went wrong',
      network: 'Network error. Please check your connection',
      unauthorized: 'Unauthorized. Please login again',
      notFound: 'Not found',
      validation: 'Please check your input',
      serverError: 'Server error. Please try again later',
    },

    // Success Messages
    success: {
      profileUpdated: 'Profile updated successfully',
      gigPosted: 'Gig posted successfully',
      applicationSent: 'Application sent successfully',
      reviewSubmitted: 'Review submitted successfully',
      withdrawalRequested: 'Withdrawal requested successfully',
      settingsSaved: 'Settings saved successfully',
    },
  },

  hi: {
    // Common
    common: {
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      save: 'सहेजें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      back: 'वापस',
      next: 'अगला',
      done: 'पूर्ण',
      skip: 'छोड़ें',
      search: 'खोजें',
      filter: 'फ़िल्टर',
      sort: 'क्रमबद्ध करें',
      apply: 'लागू करें',
      reset: 'रीसेट करें',
      viewAll: 'सभी देखें',
      seeMore: 'और देखें',
      seeLess: 'कम देखें',
      retry: 'पुनः प्रयास करें',
      refresh: 'रीफ्रेश करें',
    },

    // Authentication
    auth: {
      login: 'लॉगिन',
      signup: 'साइन अप',
      logout: 'लॉगआउट',
      phone: 'फ़ोन नंबर',
      otp: 'OTP',
      enterOtp: 'OTP दर्ज करें',
      verifyOtp: 'OTP सत्यापित करें',
      resendOtp: 'OTP पुनः भेजें',
      welcomeBack: 'वापसी पर स्वागत है!',
      getStarted: 'शुरू करें',
      selectRole: 'अपनी भूमिका चुनें',
      student: 'छात्र',
      business: 'व्यवसाय',
      continueAs: '{{role}} के रूप में जारी रखें',
    },

    // Onboarding
    onboarding: {
      welcome: 'Hustl में आपका स्वागत है',
      studentTitle: 'अपने शेड्यूल के अनुसार गिग्स खोजें',
      studentDesc: 'लचीले पार्ट-टाइम अवसरों के साथ पढ़ाई करते हुए पैसे कमाएं',
      businessTitle: 'प्रतिभाशाली छात्रों को नियुक्त करें',
      businessDesc: 'अपनी व्यावसायिक आवश्यकताओं के लिए कुशल छात्रों से जुड़ें',
      name: 'पूरा नाम',
      college: 'कॉलेज/विश्वविद्यालय',
      city: 'शहर',
      skills: 'कौशल',
      addSkill: 'कौशल जोड़ें',
      bio: 'बायो',
      businessName: 'व्यवसाय का नाम',
      category: 'श्रेणी',
      description: 'विवरण',
      completeProfile: 'अपनी प्रोफ़ाइल पूरी करें',
    },

    // Deck (Student)
    deck: {
      title: 'गिग्स खोजें',
      noListings: 'कोई और लिस्टिंग उपलब्ध नहीं',
      swipeRight: 'आवेदन करने के लिए दाएं स्वाइप करें',
      swipeLeft: 'छोड़ने के लिए बाएं स्वाइप करें',
      itsAMatch: 'यह एक मैच है!',
      matchMessage: 'आप {{business}} के साथ मैच हुए',
      viewDetails: 'विवरण देखें',
      hourlyRate: '₹{{rate}}/घंटा',
      duration: '{{hours}} घंटे',
      urgent: 'तत्काल',
      boosted: 'बूस्टेड',
      requiredSkills: 'आवश्यक कौशल',
      startTime: 'शुरुआत का समय',
      location: 'स्थान',
    },

    // Matches
    matches: {
      title: 'मेरे मैच',
      active: 'सक्रिय',
      completed: 'पूर्ण',
      cancelled: 'रद्द',
      noMatches: 'अभी तक कोई मैच नहीं',
      startApplying: 'गिग्स के लिए आवेदन करना शुरू करें',
      viewChat: 'चैट देखें',
      checkIn: 'चेक इन',
      checkOut: 'चेक आउट',
      leaveReview: 'समीक्षा छोड़ें',
      status: {
        pending: 'लंबित',
        accepted: 'स्वीकृत',
        rejected: 'अस्वीकृत',
        inProgress: 'प्रगति में',
        completed: 'पूर्ण',
        cancelled: 'रद्द',
      },
    },

    // Chat
    chat: {
      title: 'संदेश',
      typeMessage: 'एक संदेश टाइप करें...',
      send: 'भेजें',
      noMessages: 'अभी तक कोई संदेश नहीं',
      startConversation: 'बातचीत शुरू करें',
      online: 'ऑनलाइन',
      offline: 'ऑफ़लाइन',
      typing: 'टाइप कर रहे हैं...',
    },

    // Profile
    profile: {
      title: 'प्रोफ़ाइल',
      editProfile: 'प्रोफ़ाइल संपादित करें',
      reputation: 'प्रतिष्ठा',
      completedShifts: 'पूर्ण शिफ्ट',
      earnings: 'कुल कमाई',
      reviews: 'समीक्षाएं',
      badges: 'बैज',
      achievements: 'उपलब्धियां',
      settings: 'सेटिंग्स',
      help: 'सहायता और समर्थन',
      about: 'के बारे में',
      termsOfService: 'सेवा की शर्तें',
      privacyPolicy: 'गोपनीयता नीति',
      version: 'संस्करण',
    },

    // Wallet
    wallet: {
      title: 'वॉलेट',
      balance: 'शेष राशि',
      earnings: 'कमाई',
      withdraw: 'निकालें',
      addMoney: 'पैसे जोड़ें',
      transactions: 'लेन-देन',
      pending: 'लंबित',
      completed: 'पूर्ण',
      failed: 'विफल',
      noTransactions: 'अभी तक कोई लेन-देन नहीं',
      withdrawAmount: 'निकासी राशि',
      minimumWithdrawal: 'न्यूनतम निकासी: ₹{{amount}}',
      processingTime: 'प्रसंस्करण समय: 1-3 व्यावसायिक दिन',
    },

    // Business
    business: {
      postGig: 'गिग पोस्ट करें',
      myListings: 'मेरी लिस्टिंग',
      analytics: 'विश्लेषण',
      title: 'गिग शीर्षक',
      description: 'विवरण',
      category: 'श्रेणी',
      hourlyRate: 'प्रति घंटा दर',
      duration: 'अवधि (घंटे)',
      startTime: 'शुरुआत का समय',
      endTime: 'समाप्ति का समय',
      requiredSkills: 'आवश्यक कौशल',
      location: 'स्थान',
      makeUrgent: 'तत्काल बनाएं',
      boostListing: 'लिस्टिंग बूस्ट करें',
      publish: 'प्रकाशित करें',
      draft: 'ड्राफ्ट के रूप में सहेजें',
    },

    // Notifications
    notifications: {
      title: 'सूचनाएं',
      markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
      noNotifications: 'कोई सूचना नहीं',
      newMatch: 'नया मैच!',
      matchAccepted: 'मैच स्वीकृत',
      matchRejected: 'मैच अस्वीकृत',
      shiftStarting: 'शिफ्ट जल्द शुरू हो रही है',
      shiftCompleted: 'शिफ्ट पूर्ण',
      paymentReceived: 'भुगतान प्राप्त हुआ',
      newMessage: 'नया संदेश',
      reviewReceived: 'नई समीक्षा',
      achievementUnlocked: 'उपलब्धि अनलॉक!',
    },

    // Reviews
    reviews: {
      title: 'समीक्षाएं',
      writeReview: 'समीक्षा लिखें',
      rating: 'रेटिंग',
      comment: 'टिप्पणी',
      submit: 'समीक्षा सबमिट करें',
      helpful: 'सहायक',
      notHelpful: 'सहायक नहीं',
      reportReview: 'समीक्षा रिपोर्ट करें',
      noReviews: 'अभी तक कोई समीक्षा नहीं',
    },

    // Errors
    errors: {
      generic: 'कुछ गलत हो गया',
      network: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें',
      unauthorized: 'अनधिकृत। कृपया फिर से लॉगिन करें',
      notFound: 'नहीं मिला',
      validation: 'कृपया अपना इनपुट जांचें',
      serverError: 'सर्वर त्रुटि। कृपया बाद में पुनः प्रयास करें',
    },

    // Success Messages
    success: {
      profileUpdated: 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई',
      gigPosted: 'गिग सफलतापूर्वक पोस्ट की गई',
      applicationSent: 'आवेदन सफलतापूर्वक भेजा गया',
      reviewSubmitted: 'समीक्षा सफलतापूर्वक सबमिट की गई',
      withdrawalRequested: 'निकासी सफलतापूर्वक अनुरोधित',
      settingsSaved: 'सेटिंग्स सफलतापूर्वक सहेजी गईं',
    },
  },
};

// Initialize i18n
const i18n = new I18n(translations);

// Set default locale
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

/**
 * i18n Service
 */
class I18nService {
  private i18n: I18n;
  private currentLocale: string = 'en';
  private readonly STORAGE_KEY = '@hustl:locale';

  constructor() {
    this.i18n = i18n;
    this.loadSavedLocale();
  }

  /**
   * Load saved locale from storage
   */
  private async loadSavedLocale(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'hi')) {
        this.currentLocale = saved;
        this.i18n.locale = saved;
      }
    } catch (error) {
      console.error('Failed to load saved locale:', error);
    }
  }

  /**
   * Get translation for key
   */
  t(key: string, options?: Record<string, any>): string {
    return this.i18n.t(key, options);
  }

  /**
   * Get current locale
   */
  getLocale(): string {
    return this.currentLocale;
  }

  /**
   * Set locale
   */
  async setLocale(locale: 'en' | 'hi'): Promise<void> {
    this.currentLocale = locale;
    this.i18n.locale = locale;
    
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, locale);
    } catch (error) {
      console.error('Failed to save locale:', error);
    }
  }

  /**
   * Get available locales
   */
  getAvailableLocales(): Array<{ code: string; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    ];
  }

  /**
   * Check if locale is RTL
   */
  isRTL(): boolean {
    // Hindi is LTR, but this method is useful for future RTL languages
    return false;
  }

  /**
   * Format number with locale
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const locale = this.currentLocale === 'hi' ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(locale, options).format(value);
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return this.formatNumber(value, {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  /**
   * Format date with locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const locale = this.currentLocale === 'hi' ? 'hi-IN' : 'en-IN';
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return this.t('common.justNow');
    } else if (diffMins < 60) {
      return this.t('common.minutesAgo', { count: diffMins });
    } else if (diffHours < 24) {
      return this.t('common.hoursAgo', { count: diffHours });
    } else if (diffDays < 7) {
      return this.t('common.daysAgo', { count: diffDays });
    } else {
      return this.formatDate(date, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }
}

// Export singleton instance
export const i18nService = new I18nService();

// Export hook for React components
export const useTranslation = () => {
  return {
    t: (key: string, options?: Record<string, any>) => i18nService.t(key, options),
    locale: i18nService.getLocale(),
    setLocale: (locale: 'en' | 'hi') => i18nService.setLocale(locale),
    availableLocales: i18nService.getAvailableLocales(),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      i18nService.formatNumber(value, options),
    formatCurrency: (value: number) => i18nService.formatCurrency(value),
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      i18nService.formatDate(date, options),
    formatRelativeTime: (date: Date) => i18nService.formatRelativeTime(date),
  };
};

export default i18nService;

// Made with Bob
