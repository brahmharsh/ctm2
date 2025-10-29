"use client";

import { useEffect, useState } from "react";

export default function WaitingRoom({
  roomId,
  players,
  requiredPlayers,
  isHost,
  onLeave,
}) {
  const [copied, setCopied] = useState(false);
  const [dots, setDots] = useState("");

  // Animated dots for waiting state
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playerSlots = Array.from({ length: requiredPlayers }, (_, i) => {
    const player = players[i];
    return {
      filled: !!player,
      player: player || null,
      index: i,
    };
  });

  const progress = (players.length / requiredPlayers) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      <div className="w-full max-w-2xl px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-4">
            <span className="text-4xl">⏳</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Waiting for Players{dots}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {players.length} of {requiredPlayers} players joined
          </p>
        </div>

        {/* Room Code Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Room Code
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="px-6 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl">
                <p className="text-3xl font-bold text-gray-800 dark:text-white tracking-wider font-mono">
                  {roomId}
                </p>
              </div>
              <button
                onClick={copyRoomCode}
                className="p-3 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-xl transition-colors"
                title="Copy room code"
              >
                {copied ? (
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                Copied to clipboard!
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Player Slots */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Players
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {playerSlots.map((slot) => (
              <div
                key={slot.index}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  slot.filled
                    ? "border-indigo-500 dark:border-purple-500 bg-indigo-50 dark:bg-indigo-900/30"
                    : "border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      slot.filled
                        ? "bg-indigo-200 dark:bg-indigo-800"
                        : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  >
                    {slot.filled ? (
                      <span className="text-2xl">
                        {slot.index === 0 ? "👑" : "🎮"}
                      </span>
                    ) : (
                      <span className="text-2xl text-gray-400 dark:text-gray-500">
                        👤
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    {slot.filled ? (
                      <>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {slot.player.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {slot.index === 0 ? "Host" : "Player"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-400 dark:text-gray-500 font-medium">
                          Waiting...
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Empty slot
                        </p>
                      </>
                    )}
                  </div>
                  {slot.filled && (
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white mb-1">
                Share the room code
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Send the room code <strong>{roomId}</strong> to your friends.
                The game will start automatically when all players join!
              </p>
            </div>
          </div>
        </div>

        {/* Leave Button */}
        <button
          onClick={onLeave}
          className="w-full py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
