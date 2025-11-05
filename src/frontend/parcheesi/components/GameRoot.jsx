'use client';
import { useParcheesiGame } from '../hooks/useParcheesiGame.js';
import Lobby from './Lobby.jsx';
import WaitingRoom from './WaitingRoom.jsx';
import Game from './Game.jsx';

export default function GameRoot() {
  const {
    phase,
    roomId,
    playerId,
    players,
    requiredPlayers,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
  } = useParcheesiGame();

  return (
    <>
      {phase === 'lobby' && (
        <Lobby onCreateRoom={createRoom} onJoinRoom={joinRoom} />
      )}
      {phase === 'waiting' && (
        <WaitingRoom
          roomId={roomId}
          players={players}
          requiredPlayers={requiredPlayers}
          isHost={true}
          onLeave={leaveRoom}
        />
      )}
      {phase === 'playing' && <Game roomId={roomId} playerId={playerId} />}
    </>
  );
}
