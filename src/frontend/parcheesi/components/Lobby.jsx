'use client';

import { useState } from 'react';

export default function Lobby({ onCreateRoom, onJoinRoom }) {
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [playerCount, setPlayerCount] = useState(2);
  const [roomId, setRoomId] = useState('');

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
        <div className="w-full max-w-md px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-2">
              🎲 Parcheesi 🎲
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Classic board game reimagined
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="space-y-4">
            {/* Create Room Card */}
            <button
              onClick={() => setMode('create')}
              className="w-full p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-indigo-500 dark:hover:border-purple-500 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                    <span className="text-2xl">🎮</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Create Room
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start a new game
                    </p>
                  </div>
                </div>
                <svg
                  className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-purple-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>

            {/* Join Room Card */}
            <button
              onClick={() => setMode('join')}
              className="w-full p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-purple-500 dark:hover:border-indigo-500 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                    <span className="text-2xl">🚪</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Join Room
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enter room code
                    </p>
                  </div>
                </div>
                <svg
                  className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-indigo-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Play with 2-4 players online
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
        <div className="w-full max-w-md px-6">
          {/* Back Button */}
          <button
            onClick={() => setMode(null)}
            className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          {/* Create Room Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎮</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Create Room
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Choose number of players to start
              </p>
            </div>

            {/* Player Count Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Number of Players
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPlayerCount(count)}
                    className={`py-4 rounded-xl font-semibold transition-all duration-200 ${
                      playerCount === count
                        ? 'bg-indigo-600 dark:bg-purple-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={() => onCreateRoom(playerCount)}
              className="w-full py-4 bg-indigo-600 dark:bg-purple-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 dark:hover:bg-purple-700 transition-all duration-200 transform hover:scale-[1.02]"
            >
              Create Room
            </button>

            {/* Info */}
            <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <p className="text-sm text-indigo-900 dark:text-indigo-200">
                <span className="font-semibold">💡 Tip:</span> Share the room
                code with your friends once created!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
        <div className="w-full max-w-md px-6">
          {/* Back Button */}
          <button
            onClick={() => setMode(null)}
            className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          {/* Join Room Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚪</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Join Room
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Enter the room code to join
              </p>
            </div>

            {/* Room ID Input */}
            <div className="mb-6">
              <label
                htmlFor="roomId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Room Code
              </label>
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:border-purple-500 dark:focus:border-indigo-500 focus:outline-none text-center text-lg font-semibold tracking-wider uppercase"
                maxLength={10}
              />
            </div>

            {/* Join Button */}
            <button
              onClick={() => roomId && onJoinRoom(roomId)}
              disabled={!roomId}
              className={`w-full py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 transform ${
                roomId
                  ? 'bg-purple-600 dark:bg-indigo-600 text-white hover:bg-purple-700 dark:hover:bg-indigo-700 hover:scale-[1.02]'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Join Room
            </button>

            {/* Info */}
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <p className="text-sm text-purple-900 dark:text-purple-200">
                <span className="font-semibold">💡 Tip:</span> Ask your friend
                for the room code they created!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
