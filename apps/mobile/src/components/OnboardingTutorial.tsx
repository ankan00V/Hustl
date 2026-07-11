import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
// import { BlurView } from 'expo-blur'; // Already imported in other components
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  icon?: string;
  action?: 'TAP' | 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'SCROLL' | 'NONE';
  position?: 'TOP' | 'BOTTOM' | 'CENTER';
}

interface OnboardingTutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip?: () => void;
  visible: boolean;
}

/**
 * Interactive Onboarding Tutorial
 * Guides users through app features with contextual tooltips and animations
 */
export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  steps,
  onComplete,
  onSkip,
  visible,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(visible);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      animateIn();
      startPulse();
    } else {
      animateOut();
    }
  }, [visible]);

  useEffect(() => {
    if (isVisible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentStep]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (currentStep < steps.length - 1) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateOut();
    setTimeout(() => {
      onSkip?.();
    }, 200);
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    animateOut();
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <View style={[StyleSheet.absoluteFill, styles.backdrop]} />

        {/* Spotlight on target element */}
        {step?.targetElement && (
          <Animated.View
            style={[
              styles.spotlight,
              {
                left: (step?.targetElement?.x || 0) - 8,
                top: (step?.targetElement?.y || 0) - 8,
                width: (step?.targetElement?.width || 0) + 16,
                height: (step?.targetElement?.height || 0) + 16,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}

        {/* Tutorial content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
            step?.position === 'TOP' && styles.contentTop,
            step?.position === 'BOTTOM' && styles.contentBottom,
            step?.position === 'CENTER' && styles.contentCenter,
          ]}
        >
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentStep + 1} of {steps.length}
            </Text>
          </View>

          {/* Icon */}
          {step?.icon && (
            <View style={styles.iconContainer}>
              <Ionicons name={step.icon as any} size={48} color="#667eea" />
            </View>
          )}

          {/* Title and description */}
          <Text style={styles.title}>{step?.title}</Text>
          <Text style={styles.description}>{step?.description}</Text>

          {/* Action hint */}
          {step?.action && step.action !== 'NONE' && (
            <View style={styles.actionHint}>
              {step.action === 'TAP' && (
                <>
                  <Ionicons name="hand-left" size={24} color="#667eea" />
                  <Text style={styles.actionText}>Tap to continue</Text>
                </>
              )}
              {step.action === 'SWIPE_LEFT' && (
                <>
                  <Ionicons name="arrow-back" size={24} color="#667eea" />
                  <Text style={styles.actionText}>Swipe left</Text>
                </>
              )}
              {step.action === 'SWIPE_RIGHT' && (
                <>
                  <Ionicons name="arrow-forward" size={24} color="#667eea" />
                  <Text style={styles.actionText}>Swipe right</Text>
                </>
              )}
              {step.action === 'SCROLL' && (
                <>
                  <Ionicons name="arrow-down" size={24} color="#667eea" />
                  <Text style={styles.actionText}>Scroll to explore</Text>
                </>
              )}
            </View>
          )}

          {/* Navigation buttons */}
          <View style={styles.navigation}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handlePrevious}
              >
                <Ionicons name="arrow-back" size={20} color="#667eea" />
                <Text style={styles.buttonSecondaryText}>Back</Text>
              </TouchableOpacity>
            )}

            <View style={styles.navigationRight}>
              {currentStep < steps.length - 1 && onSkip && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonText]}
                  onPress={handleSkip}
                >
                  <Text style={styles.buttonTextLabel}>Skip</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleNext}
              >
                <Text style={styles.buttonPrimaryText}>
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
};

/**
 * Pre-built tutorial sequences
 */
export const TUTORIAL_SEQUENCES = {
  STUDENT_DECK: [
    {
      id: 'welcome',
      title: 'Welcome to Hustl! 👋',
      description: 'Find flexible gigs that fit your schedule and skills. Let\'s show you around!',
      icon: 'rocket',
      action: 'NONE' as const,
      position: 'CENTER' as const,
    },
    {
      id: 'swipe_right',
      title: 'Swipe Right to Apply',
      description: 'When you see a gig you like, swipe right to apply instantly.',
      icon: 'arrow-forward-circle',
      action: 'SWIPE_RIGHT' as const,
      position: 'BOTTOM' as const,
    },
    {
      id: 'swipe_left',
      title: 'Swipe Left to Skip',
      description: 'Not interested? Swipe left to see the next opportunity.',
      icon: 'arrow-back-circle',
      action: 'SWIPE_LEFT' as const,
      position: 'BOTTOM' as const,
    },
    {
      id: 'match',
      title: 'Get Matched!',
      description: 'When a business accepts your application, you\'ll get a match notification.',
      icon: 'heart',
      action: 'NONE' as const,
      position: 'CENTER' as const,
    },
    {
      id: 'earnings',
      title: 'Track Your Earnings',
      description: 'All your earnings are tracked in your wallet. Get paid after completing shifts!',
      icon: 'wallet',
      action: 'NONE' as const,
      position: 'CENTER' as const,
    },
  ],

  BUSINESS_POST: [
    {
      id: 'welcome',
      title: 'Post Your First Gig',
      description: 'Find talented students for your short-term needs in minutes.',
      icon: 'briefcase',
      action: 'NONE' as const,
      position: 'CENTER' as const,
    },
    {
      id: 'details',
      title: 'Add Gig Details',
      description: 'Describe what you need, required skills, and when you need help.',
      icon: 'create',
      action: 'SCROLL' as const,
      position: 'TOP' as const,
    },
    {
      id: 'pricing',
      title: 'Set Your Rate',
      description: 'We\'ll suggest competitive rates based on market data and your requirements.',
      icon: 'cash',
      action: 'NONE' as const,
      position: 'CENTER' as const,
    },
    {
      id: 'urgent',
      title: 'Need Help ASAP?',
      description: 'Mark your gig as urgent to get instant applications from top-rated students.',
      icon: 'flash',
      action: 'TAP' as const,
      position: 'CENTER' as const,
    },
    {
      id: 'matches',
      title: 'Review Applications',
      description: 'Students will apply to your gig. Review their profiles and accept the best fit!',
      icon: 'people',
      action: 'NONE' as const,
      position: 'CENTER' as const,
    },
  ],

  WALLET: [
    {
      id: 'wallet_intro',
      title: 'Your Hustl Wallet',
      description: 'All your earnings are securely stored here.',
      icon: 'wallet',
      action: 'NONE' as const,
      position: 'TOP' as const,
    },
    {
      id: 'balance',
      title: 'Available Balance',
      description: 'This is the amount you can withdraw to your bank account anytime.',
      icon: 'cash',
      action: 'NONE' as const,
      position: 'TOP' as const,
    },
    {
      id: 'pending',
      title: 'Pending Balance',
      description: 'Earnings from ongoing shifts. Released after shift completion.',
      icon: 'time',
      action: 'NONE' as const,
      position: 'CENTER' as const,
    },
    {
      id: 'withdraw',
      title: 'Withdraw Anytime',
      description: 'Transfer your earnings to your UPI ID instantly. Minimum ₹100.',
      icon: 'arrow-down-circle',
      action: 'TAP' as const,
      position: 'BOTTOM' as const,
    },
  ],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  spotlight: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#667eea',
    backgroundColor: 'transparent',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  contentTop: {
    position: 'absolute',
    top: 100,
  },
  contentBottom: {
    position: 'absolute',
    bottom: 100,
  },
  contentCenter: {
    // Default center position
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    marginBottom: 20,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  navigationRight: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonPrimary: {
    backgroundColor: '#667eea',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonSecondary: {
    backgroundColor: '#f0f4ff',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  buttonTextLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#667eea',
    width: 24,
  },
});

// Made with Bob
