// /services/api.js
// Client-side API wrapper hitting Next.js route handlers (shared port)
// KISS: small fetch helpers; could be extended with abort, retry, etc.

const jsonHeaders = { "Content-Type": "application/json" };

async function handleResponse(res) {
  if (!res.ok) {
    // Attempt to parse error body
    try {
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: `HTTP ${res.status}` };
    }
  }
  return res.json();
}

export const api = {
  getGameState: async () => {
    const res = await fetch("/api/game/state", { cache: "no-store" });
    return handleResponse(res);
  },
  getCounter: async () => {
    const res = await fetch("/api/game/counter", { cache: "no-store" });
    return handleResponse(res);
  },
  incrementCounter: async () => {
    const res = await fetch("/api/game/counter", { method: "POST" });
    return handleResponse(res);
  },
  resetCounter: async () => {
    const res = await fetch("/api/game/counter", { method: "DELETE" });
    return handleResponse(res);
  },
  joinGame: async (playerId) => {
    const res = await fetch("/api/game/join", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ playerId }),
    });
    return handleResponse(res);
  },
  leaveGame: async (playerId) => {
    const res = await fetch("/api/game/leave", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ playerId }),
    });
    return handleResponse(res);
  },
  rollDice: async (playerId) => {
    const res = await fetch("/api/game/roll", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ playerId }),
    });
    return handleResponse(res);
  },
  resetGame: async () => {
    const res = await fetch("/api/game/reset", { method: "POST" });
    return handleResponse(res);
  },
};
