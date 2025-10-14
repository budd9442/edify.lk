export function logInfo(label: string, message: string, meta?: Record<string, unknown>) {
  console.log(format('INFO', label, message), meta || '');
}

export function logWarn(label: string, message: string, meta?: Record<string, unknown>) {
  console.warn(format('WARN', label, message), meta || '');
}

export function logError(label: string, message: string, meta?: Record<string, unknown>) {
  console.error(format('ERROR', label, message), meta || '');
}

function format(level: string, label: string, message: string): string {
  const ts = new Date().toISOString();
  return `[${ts}] [${level}] ${label}: ${message}`;
}


