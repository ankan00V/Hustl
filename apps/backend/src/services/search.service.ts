import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';

/**
 * Smart Search Service
 * Advanced listing discovery with filters, sorting, and relevance scoring
 */

export interface SearchFilters {
  query?: string;
  category?: string;
  city?: string;
  minRate?: number;
  maxRate?: number;
  minDuration?: number;
  maxDuration?: number;
  isUrgent?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  skills?: string[];
  businessId?: string;
  radius?: number; // km
  latitude?: number;
  longitude?: number;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'rate' | 'date' | 'distance' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  listings: any[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  facets: {
    categories: { name: string; count: number }[];
    cities: { name: string; count: number }[];
    rateRanges: { min: number; max: number; count: number }[];
  };
}

class SearchService {
  private readonly CACHE_PREFIX = 'search:';
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Search listings with filters
   */
  async searchListings(
    filters: SearchFilters,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Build cache key
    const cacheKey = this.buildCacheKey(filters, options);
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Build where clause
    const where: any = {
      status: 'OPEN',
    };

    // Text search
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { category: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (filters.category) {
      where.category = filters.category;
    }

    // City filter
    if (filters.city) {
      where.city = filters.city;
    }

    // Rate range
    if (filters.minRate !== undefined || filters.maxRate !== undefined) {
      where.rate = {};
      if (filters.minRate !== undefined) {
        where.rate.gte = filters.minRate;
      }
      if (filters.maxRate !== undefined) {
        where.rate.lte = filters.maxRate;
      }
    }

    // Duration range
    if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
      where.duration = {};
      if (filters.minDuration !== undefined) {
        where.duration.gte = filters.minDuration;
      }
      if (filters.maxDuration !== undefined) {
        where.duration.lte = filters.maxDuration;
      }
    }

    // Urgent filter
    if (filters.isUrgent !== undefined) {
      where.isUrgent = filters.isUrgent;
    }

    // Date range
    if (filters.dateFrom || filters.dateTo) {
      where.startTime = {};
      if (filters.dateFrom) {
        where.startTime.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.startTime.lte = filters.dateTo;
      }
    }

    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      where.requiredSkills = {
        hasSome: filters.skills,
      };
    }

    // Business filter
    if (filters.businessId) {
      where.businessId = filters.businessId;
    }

    // Build order by
    let orderBy: any = {};
    
    switch (options.sortBy) {
      case 'rate':
        orderBy = { rate: options.sortOrder || 'asc' };
        break;
      case 'date':
        orderBy = { startTime: options.sortOrder || 'asc' };
        break;
      case 'rating':
        orderBy = { business: { reputation: options.sortOrder || 'desc' } };
        break;
      case 'relevance':
      default:
        // Relevance sorting handled after fetch
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute query
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          business: {
            select: { userId: true,
              businessName: true,
              
              
            },
          },
          _count: {
            select: {
              matches: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    // Calculate relevance scores if needed
    let scoredListings = listings;
    if (options.sortBy === 'relevance' && filters.query) {
      scoredListings = this.scoreByRelevance(listings, filters.query);
    }

    // Apply distance filter if coordinates provided
    if (filters.latitude && filters.longitude && filters.radius) {
      scoredListings = this.filterByDistance(
        scoredListings,
        filters.latitude,
        filters.longitude,
        filters.radius
      );
    }

    // Get facets for filtering UI
    const facets = await this.getFacets(where);

    const result: SearchResult = {
      listings: scoredListings,
      total,
      page,
      limit,
      hasMore: skip + listings.length < total,
      facets,
    };

    // Cache result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

    return result;
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `${this.CACHE_PREFIX}autocomplete:${query.toLowerCase()}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Get matching titles and categories
    const [titles, categories] = await Promise.all([
      prisma.listing.findMany({
        where: {
          status: 'OPEN',
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: { title: true },
        take: limit,
        distinct: ['title'],
      }),
      prisma.listing.findMany({
        where: {
          status: 'OPEN',
          citySlug:  { contains: query, mode: 'insensitive' },
        },
        select: { citySlug: true },
        take: limit,
        distinct: ['citySlug'],
      }),
    ]);

    const suggestions = [
      ...titles.map((l) => l.title),
      ...categories.map((l) => l.citySlug),
    ]
      .filter((s, i, arr) => arr.indexOf(s) === i) // Unique
      .slice(0, limit);

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(suggestions));

    return suggestions;
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limit: number = 10): Promise<string[]> {
    const cacheKey = `${this.CACHE_PREFIX}popular`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Get most common categories
    const categories = await prisma.listing.groupBy({
      by: ['citySlug'],
      _count: { _all: true },
      where: { status: 'OPEN' },
      orderBy: { _count: { citySlug:  'desc' } },
      take: limit,
    });

    const popular = categories.map((c) => c.citySlug);

    // Cache for 1 day
    await redis.setex(cacheKey, 86400, JSON.stringify(popular));

    return popular;
  }

  /**
   * Track search query
   */
  async trackSearch(query: string, userId?: string): Promise<void> {
    if (!query) return;

    // Increment search count
    await redis.zincrby(`${this.CACHE_PREFIX}queries`, 1, query.toLowerCase());

    // Keep only top 1000
    await redis.zremrangebyrank(`${this.CACHE_PREFIX}queries`, 0, -1001);

    // Track user search history
    if (userId) {
      await redis.lpush(`${this.CACHE_PREFIX}history:${userId}`, query);
      await redis.ltrim(`${this.CACHE_PREFIX}history:${userId}`, 0, 49); // Keep last 50
    }
  }

  /**
   * Get user search history
   */
  async getSearchHistory(userId: string, limit: number = 10): Promise<string[]> {
    const history = await redis.lrange(`${this.CACHE_PREFIX}history:${userId}`, 0, limit - 1);
    return history;
  }

  /**
   * Clear user search history
   */
  async clearSearchHistory(userId: string): Promise<void> {
    await redis.del(`${this.CACHE_PREFIX}history:${userId}`);
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(limit: number = 10): Promise<{ query: string; score: number }[]> {
    const trending = await redis.zrevrange(
      `${this.CACHE_PREFIX}queries`,
      0,
      limit - 1,
      'WITHSCORES'
    );

    const results: { query: string; score: number }[] = [];
    for (let i = 0; i < trending.length; i += 2) {
      results.push({
        query: trending[i] || '',
        score: parseFloat(trending[i + 1] || '0'),
      });
    }

    return results;
  }

  /**
   * Score listings by relevance
   */
  private scoreByRelevance(listings: any[], query: string): any[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    return listings
      .map((listing) => {
        let score = 0;

        // Title match (highest weight)
        const titleLower = listing.title.toLowerCase();
        if (titleLower === queryLower) {
          score += 100;
        } else if (titleLower.includes(queryLower)) {
          score += 50;
        } else {
          // Word matches
          queryWords.forEach((word) => {
            if (titleLower.includes(word)) {
              score += 10;
            }
          });
        }

        // Category match
        const categoryLower = listing.category.toLowerCase();
        if (categoryLower === queryLower) {
          score += 30;
        } else if (categoryLower.includes(queryLower)) {
          score += 15;
        }

        // Description match
        if (listing.description) {
          const descLower = listing.description.toLowerCase();
          if (descLower.includes(queryLower)) {
            score += 5;
          }
        }

        // Boost urgent listings
        if (listing.isUrgent) {
          score += 20;
        }

        // Boost high-rated businesses
        if (listing.business?.reputation) {
          score += listing.business.reputation * 2;
        }

        return { ...listing, relevanceScore: score };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Filter listings by distance
   */
  private filterByDistance(
    listings: any[],
    userLat: number,
    userLon: number,
    maxRadius: number
  ): any[] {
    return listings
      .map((listing) => {
        if (!listing.latitude || !listing.longitude) {
          return { ...listing, distance: null };
        }

        const distance = this.calculateDistance(
          userLat,
          userLon,
          listing.latitude,
          listing.longitude
        );

        return { ...listing, distance };
      })
      .filter((listing) => listing.distance === null || listing.distance <= maxRadius)
      .sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get facets for filtering
   */
  private async getFacets(baseWhere: any): Promise<SearchResult['facets']> {
    const [categories, cities, listings] = await Promise.all([
      // Prisma groupBy doesn't support relation fields like BusinessProfile.category
      // Returning empty array for now
      Promise.resolve([] as any[]),
      prisma.listing.groupBy({
        by: ['citySlug'],
        _count: { _all: true },
        where: { ...baseWhere, citySlug:  { not: null } },
        orderBy: { _count: { citySlug:  'desc' } },
        take: 20,
      }),
      prisma.listing.findMany({
        where: baseWhere,
        select: { hourlyRate: true },
      }),
    ]);

    // Calculate rate ranges
    const rates = listings.map((l) => Number(l.hourlyRate)).sort((a, b) => a - b);
    const rateRanges = [
      { min: 0, max: 100, count: 0 },
      { min: 100, max: 200, count: 0 },
      { min: 200, max: 500, count: 0 },
      { min: 500, max: 1000, count: 0 },
      { min: 1000, max: Infinity, count: 0 },
    ];

    rates.forEach((rate) => {
      const range = rateRanges.find((r) => rate >= r.min && rate < r.max);
      if (range) range.count++;
    });

    return {
      categories: categories.map((c) => ({
        name: c.category || 'Unknown',
        count: c._count || 0,
      })),
      cities: cities.map((c) => ({
        name: c.citySlug,
        count: Number((c._count as any)._all || (c._count as any).citySlug || c._count || 0),
      })),
      rateRanges: rateRanges.filter((r) => r.count > 0),
    };
  }

  /**
   * Build cache key from filters and options
   */
  private buildCacheKey(filters: SearchFilters, options: SearchOptions): string {
    const parts = [
      this.CACHE_PREFIX,
      'results',
      filters.query || 'all',
      filters.category || 'all',
      filters.city || 'all',
      filters.minRate || 'any',
      filters.maxRate || 'any',
      filters.isUrgent ? 'urgent' : 'all',
      options.page || 1,
      options.limit || 20,
      options.sortBy || 'relevance',
      options.sortOrder || 'desc',
    ];
    return parts.join(':');
  }
}

export const searchService = new SearchService();

// Made with Bob
