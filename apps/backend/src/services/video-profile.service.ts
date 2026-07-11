import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';
import { AppError } from '../utils/app-error.js';

/**
 * Video Profile Service
 * Handle video uploads and management for business profiles
 */

export interface VideoUploadOptions {
  maxDuration?: number; // seconds
  maxSize?: number; // bytes
  allowedFormats?: string[];
}

export interface VideoMetadata {
  id: string;
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  thumbnail: string;
  createdAt: Date;
}

class VideoProfileService {
  private readonly DEFAULT_OPTIONS: VideoUploadOptions = {
    maxDuration: 60, // 60 seconds
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedFormats: ['mp4', 'mov', 'avi', 'webm'],
  };

  private readonly CACHE_PREFIX = 'video:';
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Upload video to Cloudinary
   */
  async uploadVideo(
    businessId: string,
    videoBuffer: Buffer,
    options: VideoUploadOptions = {}
  ): Promise<VideoMetadata> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // Validate business exists
    const business = await prisma.user.findUnique({
      where: { id: businessId, role: 'BUSINESS' },
    });

    if (!business) {
      throw AppError.notFound('Business not found');
    }

    // Validate file size
    if (videoBuffer.length > opts.maxSize!) {
      throw AppError.badRequest(
        `Video size exceeds maximum of ${opts.maxSize! / (1024 * 1024)}MB`
      );
    }

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: `hustl/business-videos/${businessId}`,
          allowed_formats: opts.allowedFormats,
          eager: [
            {
              width: 1280,
              height: 720,
              crop: 'limit',
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
          eager_async: true,
          transformation: [
            {
              duration: opts.maxDuration,
              start_offset: 0,
            },
          ],
        },
        async (error, result) => {
          if (error) {
            return reject(AppError.internal(`Video upload failed: ${error.message}`));
          }

          if (!result) {
            return reject(AppError.internal('Video upload failed'));
          }

          // Validate duration
          if (result.duration && result.duration > opts.maxDuration!) {
            // Delete uploaded video
            await cloudinary.uploader.destroy(result.public_id, {
              resource_type: 'video',
            });
            return reject(
              AppError.badRequest(`Video duration exceeds maximum of ${opts.maxDuration} seconds`)
            );
          }

          // Generate thumbnail
          const thumbnail = cloudinary.url(result.public_id, {
            resource_type: 'video',
            format: 'jpg',
            transformation: [
              { width: 640, height: 360, crop: 'fill' },
              { quality: 'auto' },
            ],
          });

          const metadata: VideoMetadata = {
            id: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            duration: result.duration || 0,
            width: result.width,
            height: result.height,
            size: result.bytes,
            thumbnail,
            createdAt: new Date(),
          };

          // Save to database
          await prisma.user.update({
            where: { id: businessId },
            data: {
              videoProfileUrl: metadata.secureUrl,
              videoProfilePublicId: metadata.publicId,
            },
          });

          // Cache metadata
          await redis.setex(
            `${this.CACHE_PREFIX}${businessId}`,
            this.CACHE_TTL,
            JSON.stringify(metadata)
          );

          resolve(metadata);
        }
      );

      uploadStream.end(videoBuffer);
    });
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(businessId: string): Promise<VideoMetadata | null> {
    // Check cache
    const cached = await redis.get(`${this.CACHE_PREFIX}${businessId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const business = await prisma.user.findUnique({
      where: { id: businessId },
      select: {
        videoProfileUrl: true,
        videoProfilePublicId: true,
      },
    });

    if (!business?.videoProfileUrl || !business?.videoProfilePublicId) {
      return null;
    }

    // Get metadata from Cloudinary
    try {
      const result = await cloudinary.api.resource(business.videoProfilePublicId, {
        resource_type: 'video',
      });

      const thumbnail = cloudinary.url(result.public_id, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 640, height: 360, crop: 'fill' },
          { quality: 'auto' },
        ],
      });

      const metadata: VideoMetadata = {
        id: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        duration: result.duration || 0,
        width: result.width,
        height: result.height,
        size: result.bytes,
        thumbnail,
        createdAt: new Date(result.created_at),
      };

      // Cache metadata
      await redis.setex(
        `${this.CACHE_PREFIX}${businessId}`,
        this.CACHE_TTL,
        JSON.stringify(metadata)
      );

      return metadata;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete video
   */
  async deleteVideo(businessId: string): Promise<void> {
    const business = await prisma.user.findUnique({
      where: { id: businessId },
      select: { videoProfilePublicId: true },
    });

    if (!business?.videoProfilePublicId) {
      throw AppError.notFound('No video found');
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(business.videoProfilePublicId, {
      resource_type: 'video',
    });

    // Update database
    await prisma.user.update({
      where: { id: businessId },
      data: {
        videoProfileUrl: null,
        videoProfilePublicId: null,
      },
    });

    // Clear cache
    await redis.del(`${this.CACHE_PREFIX}${businessId}`);
  }

  /**
   * Get video analytics
   */
  async getVideoAnalytics(businessId: string): Promise<{
    views: number;
    uniqueViews: number;
    averageWatchTime: number;
    completionRate: number;
  }> {
    const viewsKey = `${this.CACHE_PREFIX}views:${businessId}`;
    const uniqueViewsKey = `${this.CACHE_PREFIX}unique-views:${businessId}`;
    const watchTimeKey = `${this.CACHE_PREFIX}watch-time:${businessId}`;

    const [views, uniqueViews, watchTimes] = await Promise.all([
      redis.get(viewsKey),
      redis.scard(uniqueViewsKey),
      redis.lrange(watchTimeKey, 0, -1),
    ]);

    const totalViews = parseInt(views || '0');
    const totalWatchTime = watchTimes.reduce((sum, time) => sum + parseFloat(time), 0);
    const averageWatchTime = watchTimes.length > 0 ? totalWatchTime / watchTimes.length : 0;

    // Get video duration
    const metadata = await this.getVideoMetadata(businessId);
    const duration = metadata?.duration || 1;

    const completionRate = duration > 0 ? (averageWatchTime / duration) * 100 : 0;

    return {
      views: totalViews,
      uniqueViews,
      averageWatchTime,
      completionRate: Math.min(completionRate, 100),
    };
  }

  /**
   * Track video view
   */
  async trackVideoView(businessId: string, viewerId: string, watchTime: number): Promise<void> {
    const viewsKey = `${this.CACHE_PREFIX}views:${businessId}`;
    const uniqueViewsKey = `${this.CACHE_PREFIX}unique-views:${businessId}`;
    const watchTimeKey = `${this.CACHE_PREFIX}watch-time:${businessId}`;

    // Increment total views
    await redis.incr(viewsKey);

    // Add to unique viewers set
    await redis.sadd(uniqueViewsKey, viewerId);

    // Store watch time
    await redis.lpush(watchTimeKey, watchTime.toString());
    await redis.ltrim(watchTimeKey, 0, 999); // Keep last 1000 watch times

    // Set expiry (30 days)
    await redis.expire(viewsKey, 30 * 24 * 60 * 60);
    await redis.expire(uniqueViewsKey, 30 * 24 * 60 * 60);
    await redis.expire(watchTimeKey, 30 * 24 * 60 * 60);
  }

  /**
   * Get trending video profiles
   */
  async getTrendingVideos(limit: number = 10): Promise<
    Array<{
      businessId: string;
      businessName: string;
      videoUrl: string;
      thumbnail: string;
      views: number;
    }>
  > {
    // Get all businesses with videos
    const businesses = await prisma.user.findMany({
      where: {
        role: 'BUSINESS',
        videoProfileUrl: { not: null },
      },
      select: {
        id: true,
        name: true,
        videoProfileUrl: true,
        videoProfilePublicId: true,
      },
      take: 100,
    });

    // Get view counts
    const videosWithViews = await Promise.all(
      businesses.map(async (business: any) => {
        const viewsKey = `${this.CACHE_PREFIX}views:${business.id}`;
        const views = parseInt((await redis.get(viewsKey)) || '0');

        const metadata = await this.getVideoMetadata(business.id);

        return {
          businessId: business.id,
          businessName: business.name,
          videoUrl: business.videoProfileUrl!,
          thumbnail: metadata?.thumbnail || '',
          views,
        };
      })
    );

    // Sort by views and return top N
    return videosWithViews.sort((a: any, b: any) => b.views - a.views).slice(0, limit);
  }

  /**
   * Generate video thumbnail at specific timestamp
   */
  async generateThumbnail(
    businessId: string,
    timestamp: number
  ): Promise<string> {
    const business = await prisma.user.findUnique({
      where: { id: businessId },
      select: { videoProfilePublicId: true },
    });

    if (!business?.videoProfilePublicId) {
      throw AppError.notFound('No video found');
    }

    return cloudinary.url(business.videoProfilePublicId, {
      resource_type: 'video',
      format: 'jpg',
      start_offset: timestamp,
      transformation: [
        { width: 640, height: 360, crop: 'fill' },
        { quality: 'auto' },
      ],
    });
  }

  /**
   * Get video streaming URL with adaptive bitrate
   */
  async getStreamingUrl(businessId: string): Promise<{
    hls: string;
    dash: string;
    mp4: string;
  }> {
    const business = await prisma.user.findUnique({
      where: { id: businessId },
      select: { videoProfilePublicId: true },
    });

    if (!business?.videoProfilePublicId) {
      throw AppError.notFound('No video found');
    }

    const publicId = business.videoProfilePublicId;

    return {
      hls: cloudinary.url(publicId, {
        resource_type: 'video',
        format: 'm3u8',
        streaming_profile: 'hd',
      }),
      dash: cloudinary.url(publicId, {
        resource_type: 'video',
        format: 'mpd',
        streaming_profile: 'hd',
      }),
      mp4: cloudinary.url(publicId, {
        resource_type: 'video',
        format: 'mp4',
        quality: 'auto',
      }),
    };
  }
}

export const videoProfileService = new VideoProfileService();

// Made with Bob
