import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface SocialProofProps {
  type: 'REVIEWS' | 'COMPLETED_SHIFTS' | 'ACTIVE_USERS' | 'TRUST_BADGE' | 'RATING';
  data?: any;
}

/**
 * Social Proof Component
 * Displays trust indicators to increase conversion and engagement
 */
export const SocialProof: React.FC<SocialProofProps> = ({ type, data }) => {
  switch (type) {
    case 'REVIEWS':
      return <ReviewsProof {...data} />;
    case 'COMPLETED_SHIFTS':
      return <CompletedShiftsProof {...data} />;
    case 'ACTIVE_USERS':
      return <ActiveUsersProof {...data} />;
    case 'TRUST_BADGE':
      return <TrustBadge {...data} />;
    case 'RATING':
      return <RatingProof {...data} />;
    default:
      return null;
  }
};

/**
 * Reviews Social Proof
 */
const ReviewsProof: React.FC<{
  averageRating: number;
  totalReviews: number;
  recentReviews?: Array<{ name: string; rating: number; comment: string; date: string }>;
}> = ({ averageRating, totalReviews, recentReviews }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.round(averageRating) ? 'star' : 'star-outline'}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewCount}>
          Based on {totalReviews.toLocaleString()} reviews
        </Text>
      </View>

      {recentReviews && recentReviews.length > 0 && (
        <View style={styles.recentReviews}>
          {recentReviews.slice(0, 3).map((review, index) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.name}</Text>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= review.rating ? 'star' : 'star-outline'}
                      size={12}
                      color="#FFD700"
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment} numberOfLines={2}>
                {review.comment}
              </Text>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Completed Shifts Social Proof
 */
const CompletedShiftsProof: React.FC<{
  count: number;
  period?: string;
}> = ({ count, period = 'this month' }) => {
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientCard}
    >
      <Ionicons name="checkmark-circle" size={32} color="#fff" />
      <Text style={styles.gradientTitle}>{count.toLocaleString()}</Text>
      <Text style={styles.gradientSubtitle}>Shifts completed {period}</Text>
    </LinearGradient>
  );
};

/**
 * Active Users Social Proof
 */
const ActiveUsersProof: React.FC<{
  count: number;
  avatars?: string[];
}> = ({ count, avatars = [] }) => {
  return (
    <View style={styles.activeUsersContainer}>
      <View style={styles.avatarStack}>
        {avatars.slice(0, 4).map((avatar, index) => (
          <View
            key={index}
            style={[styles.avatar, { marginLeft: index > 0 ? -12 : 0, zIndex: 4 - index }]}
          >
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16} color="#666" />
              </View>
            )}
          </View>
        ))}
        {count > 4 && (
          <View style={[styles.avatar, styles.avatarMore, { marginLeft: -12, zIndex: 0 }]}>
            <Text style={styles.avatarMoreText}>+{count - 4}</Text>
          </View>
        )}
      </View>
      <Text style={styles.activeUsersText}>
        <Text style={styles.activeUsersCount}>{count.toLocaleString()}</Text> students active now
      </Text>
    </View>
  );
};

/**
 * Trust Badge
 */
const TrustBadge: React.FC<{
  type: 'VERIFIED' | 'TOP_RATED' | 'FAST_RESPONDER' | 'RELIABLE';
  label?: string;
}> = ({ type, label }) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'VERIFIED':
        return {
          icon: 'shield-checkmark',
          color: '#10b981',
          text: label || 'Verified Business',
        };
      case 'TOP_RATED':
        return {
          icon: 'star',
          color: '#f59e0b',
          text: label || 'Top Rated',
        };
      case 'FAST_RESPONDER':
        return {
          icon: 'flash',
          color: '#3b82f6',
          text: label || 'Fast Responder',
        };
      case 'RELIABLE':
        return {
          icon: 'ribbon',
          color: '#8b5cf6',
          text: label || 'Reliable Partner',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.trustBadge, { borderColor: config.color }]}>
      <Ionicons name={config.icon as any} size={16} color={config.color} />
      <Text style={[styles.trustBadgeText, { color: config.color }]}>{config.text}</Text>
    </View>
  );
};

/**
 * Rating Proof with Distribution
 */
const RatingProof: React.FC<{
  averageRating: number;
  totalRatings: number;
  distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}> = ({ averageRating, totalRatings, distribution }) => {
  const getPercentage = (count: number) => {
    return totalRatings > 0 ? (count / totalRatings) * 100 : 0;
  };

  return (
    <View style={styles.ratingProofContainer}>
      <View style={styles.ratingOverview}>
        <Text style={styles.ratingLarge}>{averageRating.toFixed(1)}</Text>
        <View style={styles.starsLarge}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= Math.round(averageRating) ? 'star' : 'star-outline'}
              size={20}
              color="#FFD700"
            />
          ))}
        </View>
        <Text style={styles.ratingTotal}>{totalRatings.toLocaleString()} ratings</Text>
      </View>

      <View style={styles.distributionContainer}>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating as keyof typeof distribution];
          const percentage = getPercentage(count);

          return (
            <View key={rating} style={styles.distributionRow}>
              <Text style={styles.distributionLabel}>{rating}</Text>
              <Ionicons name="star" size={12} color="#FFD700" />
              <View style={styles.distributionBar}>
                <View
                  style={[styles.distributionFill, { width: `${percentage}%` }]}
                />
              </View>
              <Text style={styles.distributionCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  recentReviews: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  gradientCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  gradientSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  activeUsersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMore: {
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  activeUsersText: {
    fontSize: 13,
    color: '#065f46',
  },
  activeUsersCount: {
    fontWeight: '700',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingProofContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  ratingOverview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  starsLarge: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 8,
  },
  ratingTotal: {
    fontSize: 14,
    color: '#6b7280',
  },
  distributionContainer: {
    gap: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    width: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  distributionCount: {
    fontSize: 12,
    color: '#6b7280',
    width: 32,
    textAlign: 'right',
  },
});

// Made with Bob
