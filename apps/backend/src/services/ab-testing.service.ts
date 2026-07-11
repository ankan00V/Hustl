import { prisma } from '../config/prisma.js';
import { redis } from '../config/redis.js';
import { AppError } from '../utils/app-error.js';

/**
 * A/B Testing Service
 * Feature flags and experimentation framework
 */

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  startDate?: Date;
  endDate?: Date;
  targetAudience?: TargetAudience;
  metrics: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Variant {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100, sum of all variants should be 100
  config: Record<string, any>;
}

export interface TargetAudience {
  roles?: ('STUDENT' | 'BUSINESS')[];
  cities?: string[];
  minReputation?: number;
  maxReputation?: number;
  percentage?: number; // 0-100, percentage of users to include
}

export interface Assignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: Date;
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  metric: string;
  value: number;
  count: number;
  timestamp: Date;
}

class ABTestingService {
  private readonly CACHE_PREFIX = 'ab:';
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Create a new experiment
   */
  async createExperiment(data: {
    name: string;
    description: string;
    variants: Omit<Variant, 'id'>[];
    targetAudience?: TargetAudience;
    metrics: string[];
  }): Promise<Experiment> {
    // Validate variant weights sum to 100
    const totalWeight = data.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw AppError.badRequest('Variant weights must sum to 100');
    }

    // Create experiment in database (using JSON storage)
    const experiment: Experiment = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description,
      variants: data.variants.map((v, i) => ({
        ...v,
        id: `var_${i}_${Math.random().toString(36).substr(2, 9)}`,
      })),
      status: 'DRAFT',
      targetAudience: data.targetAudience,
      metrics: data.metrics,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in Redis
    await redis.set(
      `${this.CACHE_PREFIX}experiment:${experiment.id}`,
      JSON.stringify(experiment)
    );

    return experiment;
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentId: string): Promise<Experiment> {
    const experiment = await this.getExperiment(experimentId);
    
    if (!experiment) {
      throw AppError.notFound('Experiment not found');
    }

    if (experiment.status !== 'DRAFT' && experiment.status !== 'PAUSED') {
      throw AppError.badRequest('Can only start draft or paused experiments');
    }

    experiment.status = 'RUNNING';
    experiment.startDate = new Date();
    experiment.updatedAt = new Date();

    await redis.set(
      `${this.CACHE_PREFIX}experiment:${experimentId}`,
      JSON.stringify(experiment)
    );

    return experiment;
  }

  /**
   * Pause an experiment
   */
  async pauseExperiment(experimentId: string): Promise<Experiment> {
    const experiment = await this.getExperiment(experimentId);
    
    if (!experiment) {
      throw AppError.notFound('Experiment not found');
    }

    experiment.status = 'PAUSED';
    experiment.updatedAt = new Date();

    await redis.set(
      `${this.CACHE_PREFIX}experiment:${experimentId}`,
      JSON.stringify(experiment)
    );

    return experiment;
  }

  /**
   * Complete an experiment
   */
  async completeExperiment(experimentId: string): Promise<Experiment> {
    const experiment = await this.getExperiment(experimentId);
    
    if (!experiment) {
      throw AppError.notFound('Experiment not found');
    }

    experiment.status = 'COMPLETED';
    experiment.endDate = new Date();
    experiment.updatedAt = new Date();

    await redis.set(
      `${this.CACHE_PREFIX}experiment:${experimentId}`,
      JSON.stringify(experiment)
    );

    return experiment;
  }

  /**
   * Get experiment by ID
   */
  async getExperiment(experimentId: string): Promise<Experiment | null> {
    const cached = await redis.get(`${this.CACHE_PREFIX}experiment:${experimentId}`);
    
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * List all experiments
   */
  async listExperiments(status?: Experiment['status']): Promise<Experiment[]> {
    const keys = await redis.keys(`${this.CACHE_PREFIX}experiment:*`);
    const experiments: Experiment[] = [];

    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        const exp = JSON.parse(data);
        if (!status || exp.status === status) {
          experiments.push(exp);
        }
      }
    }

    return experiments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Assign user to experiment variant
   */
  async assignVariant(userId: string, experimentId: string): Promise<Variant | null> {
    // Check if already assigned
    const existingAssignment = await this.getAssignment(userId, experimentId);
    if (existingAssignment) {
      const experiment = await this.getExperiment(experimentId);
      return experiment?.variants.find((v) => v.id === existingAssignment.variantId) || null;
    }

    const experiment = await this.getExperiment(experimentId);
    
    if (!experiment || experiment.status !== 'RUNNING') {
      return null;
    }

    // Check if user matches target audience
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, reputationScore: true },
    });

    if (!user) {
      return null;
    }

    if (!this.matchesTargetAudience({ role: user.role, city: null, reputation: user.reputationScore }, experiment.targetAudience)) {
      return null;
    }

    // Assign variant based on weights
    const variant = this.selectVariant(experiment.variants, userId);
    if (!variant) throw new Error('No variant found');
    if (!variant) return null;

    // Store assignment
    const assignment: Assignment = {
      userId,
      experimentId,
      variantId: variant.id,
      assignedAt: new Date(),
    };

    await redis.set(
      `${this.CACHE_PREFIX}assignment:${userId}:${experimentId}`,
      JSON.stringify(assignment),
      'EX',
      30 * 24 * 60 * 60 // 30 days
    );

    return variant;
  }

  /**
   * Get user's assignment for an experiment
   */
  async getAssignment(userId: string, experimentId: string): Promise<Assignment | null> {
    const cached = await redis.get(`${this.CACHE_PREFIX}assignment:${userId}:${experimentId}`);
    
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * Get variant config for user
   */
  async getVariantConfig(userId: string, experimentId: string): Promise<Record<string, any> | null> {
    const variant = await this.assignVariant(userId, experimentId);
    return variant?.config || null;
  }

  /**
   * Check if feature is enabled for user
   */
  async isFeatureEnabled(userId: string, featureName: string): Promise<boolean> {
    // Get all running experiments
    const experiments = await this.listExperiments('RUNNING');
    
    for (const experiment of experiments) {
      if (experiment.name === featureName) {
        const variant = await this.assignVariant(userId, experiment.id);
        if (variant && variant.config.enabled === true) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Track experiment metric
   */
  async trackMetric(
    userId: string,
    experimentId: string,
    metric: string,
    value: number
  ): Promise<void> {
    const assignment = await this.getAssignment(userId, experimentId);
    
    if (!assignment) {
      return;
    }

    const result: ExperimentResult = {
      experimentId,
      variantId: assignment.variantId,
      metric,
      value,
      count: 1,
      timestamp: new Date(),
    };

    // Store in Redis sorted set for aggregation
    const key = `${this.CACHE_PREFIX}results:${experimentId}:${assignment.variantId}:${metric}`;
    await redis.zadd(key, Date.now(), JSON.stringify(result));
    
    // Keep only last 10000 results
    await redis.zremrangebyrank(key, 0, -10001);
  }

  /**
   * Get experiment results
   */
  async getResults(experimentId: string): Promise<{
    variants: {
      variantId: string;
      variantName: string;
      metrics: {
        [metric: string]: {
          mean: number;
          count: number;
          sum: number;
        };
      };
    }[];
  }> {
    const experiment = await this.getExperiment(experimentId);
    
    if (!experiment) {
      throw AppError.notFound('Experiment not found');
    }

    const results = [];

    for (const variant of experiment.variants) {
      const variantMetrics: any = {};

      for (const metric of experiment.metrics) {
        const key = `${this.CACHE_PREFIX}results:${experimentId}:${variant.id}:${metric}`;
        const data = await redis.zrange(key, 0, -1);

        let sum = 0;
        let count = 0;

        for (const item of data) {
          const result: ExperimentResult = JSON.parse(item);
          sum += result.value;
          count += result.count;
        }

        variantMetrics[metric] = {
          mean: count > 0 ? sum / count : 0,
          count,
          sum,
        };
      }

      results.push({
        variantId: variant.id,
        variantName: variant.name,
        metrics: variantMetrics,
      });
    }

    return { variants: results };
  }

  /**
   * Select variant based on weights and user ID (deterministic)
   */
  private selectVariant(variants: Variant[], userId: string): Variant {
    // Use user ID hash for deterministic assignment
    const hash = this.hashString(userId);
    const random = hash % 100;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (random < cumulative) {
        return variant;
      }
    }

    // Fallback to first variant
    const v = variants[0];
    if (!v) throw new Error('No variants');
    return v;
  }

  /**
   * Check if user matches target audience
   */
  private matchesTargetAudience(
    user: { role: string; city: string | null; reputation: number | null },
    targetAudience?: TargetAudience
  ): boolean {
    if (!targetAudience) {
      return true;
    }

    // Check role
    if (targetAudience.roles && !targetAudience.roles.includes(user.role as any)) {
      return false;
    }

    // Check city
    if (targetAudience.cities && user.city && !targetAudience.cities.includes(user.city)) {
      return false;
    }

    // Check reputation
    if (targetAudience.minReputation && (user.reputation || 0) < targetAudience.minReputation) {
      return false;
    }

    if (targetAudience.maxReputation && (user.reputation || 0) > targetAudience.maxReputation) {
      return false;
    }

    // Check percentage (random sampling)
    if (targetAudience.percentage) {
      const hash = this.hashString(user.role + (user.city || ''));
      const random = hash % 100;
      if (random >= targetAudience.percentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const abTestingService = new ABTestingService();

// Made with Bob
