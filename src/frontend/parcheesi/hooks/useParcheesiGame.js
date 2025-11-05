// Socket + game state (simplified KISS)
'use client';
import { useState, useEffect, useRef } from 'react';
import { START_CELLS } from '../config/constants.js';
import {
  initSocket,
  joinGame as wsJoinGame,
  startGame as wsStartGame,
  rollDice as wsRollDice,
  moveToken as wsMoveToken,
  onRoomUpdate,
  onGameStarted,
  onStateUpdate,
  onTurnEnd,
  onRollResult,
  onMoveResult,
  requestGameState,
} from '../services/websocketClient.js';

export function useParcheesiGame() {
  const [phase, setPhase] = useState('lobby');
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [requiredPlayers, setRequiredPlayers] = useState(2);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [pieceColor, setPieceColor] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [diceValues, setDiceValues] = useState(null);
  const [usedDice, setUsedDice] = useState([false, false]);
  const [selectedToken, setSelectedToken] = useState(null);
  const diceRef = useRef([]);

  useEffect(() => {
    initSocket();
    let unsubRoom = () => {};
    let unsubState = () => {};
    let unsubStarted = () => {};
    let unsubTurn = () => {};
    let unsubRoll = () => {};
    let unsubMove = () => {};

    unsubRoom = onRoomUpdate((data) => {
      setPlayers(data.players.map((id) => ({ id })));
    });

    unsubStarted = onGameStarted(() => setPhase('playing'));

    unsubState = onStateUpdate((data) => {
      const gs = data.gameState;
      if (!gs) return;

      setGameState(gs);
      setPlayers(gs.players);

      if (gs.currentPlayerIndex != null) {
        setCurrentPlayer(gs.players[gs.currentPlayerIndex]);
      }

      const me = gs.players.find((p) => p.id === playerId);
      if (me?.color) setPieceColor(me.color);

      // Update dice state from game state
      if (gs.pendingDice) {
        setDiceValues(gs.pendingDice);
        setUsedDice(gs.usedDice || [false, false]);
      } else {
        setDiceValues(null);
        setUsedDice([false, false]);
      }
    });

    unsubTurn = onTurnEnd((data) => {
      if (data?.nextPlayer) {
        setCurrentPlayer(
          (prev) => players.find((p) => p.id === data.nextPlayer) || prev
        );
      }
      // Clear dice on turn end
      setDiceValues(null);
      setUsedDice([false, false]);
      setSelectedToken(null);
    });

    unsubRoll = onRollResult((data) => {
      setDiceValues(data.dice);
      setUsedDice([false, false]);
      setIsRolling(false);
    });

    unsubMove = onMoveResult((data) => {
      // Update used dice after move
      if (gameState?.usedDice) {
        setUsedDice([...gameState.usedDice]);
      }
      setSelectedToken(null);
    });

    requestGameState();

    return () => {
      unsubRoom();
      unsubState();
      unsubStarted();
      unsubTurn();
      unsubRoll();
      unsubMove();
    };
  }, []); // Only run once on mount - socket handlers manage state updates

  function createRoom(count) {
    const rid = generateRoomId();
    const pid = `player_${Date.now()}`;
    setRoomId(rid);
    setPlayerId(pid);
    setRequiredPlayers(count);
    wsJoinGame(rid, pid, count, (err) => {
      if (err) return console.error(err);
      setPhase('waiting');
    });
  }

  function joinRoom(rid) {
    const pid = `player_${Date.now()}`;
    setRoomId(rid);
    setPlayerId(pid);
    wsJoinGame(rid, pid, null, (err, data) => {
      if (err) return console.error(err);
      setRequiredPlayers(data.requiredPlayers || 2);
      setPhase('waiting');
    });
  }

  function startGame() {
    wsStartGame((err) => err && console.error(err));
  }

  function leaveRoom() {
    setPhase('lobby');
    setRoomId('');
    setPlayerId('');
    setPlayers([]);
    setPieceColor('');
    setGameState(null);
    setDiceValues(null);
    setUsedDice([false, false]);
  }

  function rollDice() {
    if (isRolling || !playerId || phase !== 'playing') return;
    if (currentPlayer?.id !== playerId) return;
    if (diceValues) return; // Already rolled

    setIsRolling(true);
    wsRollDice((err, data) => {
      if (err) {
        setIsRolling(false);
        return console.error(err);
      }
      // Response handled by onRollResult listener
    });
  }

  function handleTokenClick(token) {
    if (!diceValues || currentPlayer?.id !== playerId) return;
    if (token.color !== pieceColor) return; // Can only select own tokens

    setSelectedToken(token);
  }

  function handleDiceSelect(diceIndex) {
    if (!selectedToken || usedDice[diceIndex]) return;

    // Send move to server
    wsMoveToken(selectedToken.id, diceIndex, (err, data) => {
      if (err) {
        console.error('Move failed:', err);
        return;
      }
      // Response handled by onMoveResult and onStateUpdate listeners
    });
  }

  return {
    phase,
    roomId,
    playerId,
    requiredPlayers,
    players,
    currentPlayer,
    pieceColor,
    isRolling,
    dice: diceRef.current,
    diceValues,
    usedDice,
    gameState,
    selectedToken,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    rollDice,
    handleTokenClick,
    handleDiceSelect,
    setRequiredPlayers,
  };
}

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let res = '';
  for (let i = 0; i < 6; i++)
    res += chars[Math.floor(Math.random() * chars.length)];
  return res;
}
