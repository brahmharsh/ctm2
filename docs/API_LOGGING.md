# API Logging System

## Overview
Minimalistic logging system with automatic request/response tracking and optional detailed logging for debugging.

## Features

### 1. Automatic Request/Response Logging
Every API call is automatically logged with:
- HTTP method and URL
- IP address
- Response status
- Response time

### 2. Decorator Functions for Detailed Logging
Use when you need to add specific logs for debugging:

```javascript
import { apiLog, apiWarn, apiError } from "@/lib/api/logger";

// Log informational messages with data
apiLog('Player joined', { playerId, color, totalPlayers });

// Log warnings
apiWarn('Join failed', { playerId, error: result.error });

// Log errors with context
apiError('Join endpoint error', error, { playerId });
```

## Usage

### Setting up a new API route

```javascript
import { NextResponse } from "next/server";
import { withApiLogger, apiLog, apiWarn, apiError } from "@/lib/api/logger";

async function handleGET(request, context) {
  // Your logic here
  
  // Add detailed logs where needed
  apiLog('Operation completed', { someData });
  
  return NextResponse.json({ success: true });
}

async function handlePOST(request, context) {
  try {
    // Your logic here
    apiLog('User action', { userId, action });
    return NextResponse.json({ success: true });
  } catch (error) {
    apiError('Failed to process', error, { contextData });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Wrap handlers with middleware
export const GET = withApiLogger(handleGET);
export const POST = withApiLogger(handlePOST);
```

## Log Output Examples

### Automatic Logs (from middleware)
```
→ GET http://localhost:3000/api/game/state [192.168.1.1]
← 200 http://localhost:3000/api/game/state (45ms)
```

### Detailed Logs (from decorators)
```
[2025-10-27T10:30:45.123Z] Player joined {
  "playerId": "player_1",
  "color": "yellow",
  "totalPlayers": 2
}
```

### Warning Logs
```
[WARN] Join failed {
  "playerId": "player_5",
  "error": "Game is full"
}
```

### Error Logs
```
[ERROR] Join endpoint error
Context: { "playerId": "player_1" }
Error: Invalid JSON in request body
    at handler (route.js:25)
```

## API Reference

### `withApiLogger(handler, options?)`
Middleware wrapper for API routes
- **handler**: The async route handler function
- **options**: Optional configuration
  - `routeName`: Custom route name for logging
  - `logBody`: Whether to log request body (default: false)

### `apiLog(message, data?)`
Log informational messages with optional data object

### `apiWarn(message, data?)`
Log warnings with optional data object

### `apiError(message, error, context?)`
Log errors with stack trace and optional context

## Benefits

1. **Minimal overhead**: Automatic logging with no code duplication
2. **Easy debugging**: Add detailed logs only where needed using decorators
3. **Consistent format**: All logs follow the same structure
4. **Performance tracking**: Automatic response time measurement
5. **Clean code**: Separation of concerns between logging and business logic
