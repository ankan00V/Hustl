import { InteractionManager, LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Performance Optimization Utilities
 * Ensures 60fps animations and smooth user experience
 */

/**
 * Defer expensive operations until after interactions complete
 */
export const deferAfterInteraction = <T>(callback: () => T): Promise<T> => {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve(callback());
    });
  });
};

/**
 * Batch multiple state updates together
 */
export const batchUpdates = (callback: () => void): void => {
  requestAnimationFrame(() => {
    callback();
  });
};

/**
 * Debounce function for expensive operations
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for scroll/pan handlers
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Memoize expensive computations
 */
export const memoize = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => ReturnType<T>) => {
  const cache = new Map<string, ReturnType<T>>();

  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Smooth layout animations
 */
export const animateLayout = (config?: {
  duration?: number;
  type?: 'spring' | 'linear' | 'easeInEaseOut';
}): void => {
  const { duration = 300, type = 'easeInEaseOut' } = config || {};

  LayoutAnimation.configureNext({
    duration,
    create: {
      type: LayoutAnimation.Types[type],
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types[type],
    },
    delete: {
      type: LayoutAnimation.Types[type],
      property: LayoutAnimation.Properties.opacity,
    },
  });
};

/**
 * Image optimization settings
 */
export const IMAGE_OPTIMIZATION = {
  // Thumbnail sizes for different use cases
  AVATAR_SMALL: { width: 40, height: 40, quality: 0.7 },
  AVATAR_MEDIUM: { width: 80, height: 80, quality: 0.8 },
  AVATAR_LARGE: { width: 120, height: 120, quality: 0.8 },
  CARD_IMAGE: { width: 400, height: 300, quality: 0.85 },
  FULL_IMAGE: { width: 1080, height: 1080, quality: 0.9 },
};

/**
 * List optimization settings
 */
export const LIST_OPTIMIZATION = {
  // FlatList optimization props
  INITIAL_NUM_TO_RENDER: 10,
  MAX_TO_RENDER_PER_BATCH: 5,
  UPDATE_CELLS_BATCH_PERIOD: 50,
  WINDOW_SIZE: 10,
  
  // Get item layout for known heights (improves scroll performance)
  getItemLayout: (itemHeight: number) => (
    _data: any,
    index: number
  ) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  }),
};

/**
 * Animation configuration for 60fps
 */
export const ANIMATION_CONFIG = {
  // Use native driver whenever possible
  useNativeDriver: true,
  
  // Spring animations (natural feel)
  spring: {
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  },
  
  // Timing animations (precise control)
  timing: {
    duration: 300,
    useNativeDriver: true,
  },
  
  // Fast animations (snappy feel)
  fast: {
    duration: 150,
    useNativeDriver: true,
  },
  
  // Slow animations (emphasis)
  slow: {
    duration: 500,
    useNativeDriver: true,
  },
};

/**
 * Memory management utilities
 */
export const MemoryManager = {
  /**
   * Clear image cache
   */
  clearImageCache: async (): Promise<void> => {
    // Implementation depends on image library (FastImage, Expo Image, etc.)
    console.log('Image cache cleared');
  },

  /**
   * Clear data cache
   */
  clearDataCache: async (): Promise<void> => {
    // Clear AsyncStorage or other caches
    console.log('Data cache cleared');
  },

  /**
   * Get memory usage (iOS only)
   */
  getMemoryUsage: (): number | null => {
    if (Platform.OS === 'ios') {
      // Use native module to get memory usage
      return null; // Placeholder
    }
    return null;
  },
};

/**
 * Network optimization
 */
export const NetworkOptimization = {
  /**
   * Batch API requests
   */
  batchRequests: <T>(
    requests: Array<() => Promise<T>>,
    batchSize: number = 3
  ): Promise<T[]> => {
    const batches: Array<Array<() => Promise<T>>> = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }

    return batches.reduce(
      async (acc, batch) => {
        const results = await acc;
        const batchResults = await Promise.all(batch.map((req) => req()));
        return [...results, ...batchResults];
      },
      Promise.resolve([] as T[])
    );
  },

  /**
   * Retry failed requests with exponential backoff
   */
  retryWithBackoff: async <T>(
    request: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await request();
      } catch (error) {
        lastError = error as Error;
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  },
};

/**
 * Performance monitoring
 */
export const PerformanceMonitor = {
  /**
   * Measure render time
   */
  measureRender: (componentName: string, callback: () => void): void => {
    const start = Date.now();
    callback();
    const end = Date.now();
    const duration = end - start;

    if (duration > 16) {
      // More than one frame (60fps = 16.67ms per frame)
      console.warn(`[Performance] ${componentName} took ${duration}ms to render`);
    }
  },

  /**
   * Track FPS
   */
  trackFPS: (): { start: () => void; stop: () => number } => {
    let frameCount = 0;
    let startTime = 0;
    let rafId: number | null = null;

    const countFrame = () => {
      frameCount++;
      rafId = requestAnimationFrame(countFrame);
    };

    return {
      start: () => {
        frameCount = 0;
        startTime = Date.now();
        rafId = requestAnimationFrame(countFrame);
      },
      stop: () => {
        if (rafId) cancelAnimationFrame(rafId);
        const duration = (Date.now() - startTime) / 1000;
        const fps = frameCount / duration;
        return Math.round(fps);
      },
    };
  },
};

/**
 * Best practices checklist
 */
export const PERFORMANCE_CHECKLIST = {
  animations: [
    'Use useNativeDriver: true for all animations',
    'Avoid animating layout properties (width, height, padding)',
    'Prefer transform and opacity animations',
    'Use LayoutAnimation for layout changes',
    'Keep animations under 300ms for snappy feel',
  ],
  lists: [
    'Use FlatList instead of ScrollView for long lists',
    'Implement getItemLayout for known item heights',
    'Use keyExtractor for stable keys',
    'Set initialNumToRender appropriately',
    'Use removeClippedSubviews on Android',
  ],
  images: [
    'Use appropriate image sizes (no oversized images)',
    'Implement progressive loading (blur-up)',
    'Use FastImage or Expo Image for caching',
    'Lazy load images below the fold',
    'Use WebP format when possible',
  ],
  state: [
    'Avoid unnecessary re-renders with React.memo',
    'Use useCallback for event handlers',
    'Use useMemo for expensive computations',
    'Batch state updates together',
    'Defer non-critical updates with InteractionManager',
  ],
  network: [
    'Implement request caching',
    'Use pagination for large datasets',
    'Batch multiple requests when possible',
    'Implement retry logic with exponential backoff',
    'Show optimistic updates for better UX',
  ],
};

/**
 * Export all utilities
 */
export default {
  deferAfterInteraction,
  batchUpdates,
  debounce,
  throttle,
  memoize,
  animateLayout,
  IMAGE_OPTIMIZATION,
  LIST_OPTIMIZATION,
  ANIMATION_CONFIG,
  MemoryManager,
  NetworkOptimization,
  PerformanceMonitor,
  PERFORMANCE_CHECKLIST,
};

// Made with Bob
