// Simple API logger utility following KISS principle

const formatLog = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data,
  };
  
  return logEntry;
};

export const logger = {
  info: (message, data) => {
    console.log(JSON.stringify(formatLog('INFO', message, data)));
  },
  
  warn: (message, data) => {
    console.warn(JSON.stringify(formatLog('WARN', message, data)));
  },
  
  error: (message, data) => {
    console.error(JSON.stringify(formatLog('ERROR', message, data)));
  },
  
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify(formatLog('DEBUG', message, data)));
    }
  },
};
