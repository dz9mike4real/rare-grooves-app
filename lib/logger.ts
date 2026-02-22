type ErrorLevel = 'info' | 'warn' | 'error';

interface ErrorLogEntry {
  message: string;
  level: ErrorLevel;
  context?: string;
  timestamp: number;
}

const errorLog: ErrorLogEntry[] = [];
const isDev = process.env.NODE_ENV !== 'production';

export function logError(message: string, context?: string, error?: unknown): void {
  const entry: ErrorLogEntry = {
    message: error ? `${message}: ${error}` : message,
    level: 'error',
    context,
    timestamp: Date.now()
  };
  errorLog.push(entry);
  console.error(`[Error]${context ? ` [${context}]` : ''}:`, message, error);
}

export function logWarn(message: string, context?: string): void {
  if (!isDev) return;
  const entry: ErrorLogEntry = {
    message,
    level: 'warn',
    context,
    timestamp: Date.now()
  };
  errorLog.push(entry);
  console.warn(`[Warn]${context ? ` [${context}]` : ''}:`, message);
}

export function logInfo(message: string, context?: string): void {
  if (!isDev) return;
  console.log(`[Info]${context ? ` [${context}]` : ''}:`, message);
}

export function getErrorLogs(): ErrorLogEntry[] {
  return [...errorLog];
}

export function clearErrorLogs(): void {
  errorLog.length = 0;
}

export function createErrorHandler(context: string) {
  return (error: unknown, message?: string) => {
    logError(message || 'An error occurred', context, error);
  };
}
