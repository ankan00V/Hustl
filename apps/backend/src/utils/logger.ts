/**
 * Structured logger for the application
 * Provides consistent logging across all services
 *
 * TODO: Replace with Winston or Pino for production
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  [key: string]: any;
}

function formatLog(level: LogLevel, message: string, meta: Record<string, any> = {}): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'hustl-backend',
    ...meta,
  };
}

function log(level: LogLevel, message: string, meta: Record<string, any> = {}) {
  const entry = formatLog(level, message, meta);
  const output = JSON.stringify(entry);
  
  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'debug':
      console.debug(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, any>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, any>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, any>) => log('error', message, meta),
  debug: (message: string, meta?: Record<string, any>) => log('debug', message, meta),
  log: (level: LogLevel, message: string, meta?: Record<string, any>) => log(level, message, meta),
};

/**
 * Log financial transaction
 */
export function logFinancialTransaction(
  operation: string,
  data: {
    userId: string;
    amount: number;
    matchId?: string;
    status: string;
    [key: string]: any;
  }
) {
  logger.info('Financial transaction', {
    operation,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  data: {
    userId?: string;
    ip?: string;
    action: string;
    result: 'success' | 'failure';
    [key: string]: any;
  }
) {
  logger.warn('Security event', {
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  path: string,
  data: {
    userId?: string;
    statusCode: number;
    duration: number;
    [key: string]: any;
  }
) {
  logger.info('API request', {
    method,
    path,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log worker job
 */
export function logWorkerJob(
  jobName: string,
  data: {
    jobId: string;
    status: 'started' | 'completed' | 'failed';
    duration?: number;
    error?: string;
    [key: string]: any;
  }
) {
  const level = data.status === 'failed' ? 'error' : 'info';
  logger.log(level, 'Worker job', {
    jobName,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// Made with Bob
