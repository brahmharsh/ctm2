// /hooks/usePlayerControls.js
export function usePlayerControls(debug, setDebug, players, playerId, setPlayerId, setPieceColor) {
  const toggleDebug = () => setDebug(!debug);

  const changeColor = () => {
    if (players.length <= 1) return;
    const currentIndex = players.findIndex(p => p.id === playerId);
    const nextPlayer = players[(currentIndex + 1) % players.length];
    setPlayerId(nextPlayer.id);
    setPieceColor(nextPlayer.color);
  };

  return { toggleDebug, changeColor };
}
