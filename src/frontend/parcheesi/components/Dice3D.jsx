'use client';
import { useEffect, useState } from 'react';

export default function Dice3D({
  values = [1, 1],
  isRolling,
  isMyTurn,
  usedDice = [],
}) {
  console.log(
    '[Dice3D] Rendering with values:',
    values,
    'values[0]:',
    values[0],
    'values[1]:',
    values[1],
    'isRolling:',
    isRolling
  );
  return (
    <div className="flex space-x-4">
      <SingleDie
        key={`die-0-${values[0]}`}
        index={0}
        diceValue={values[0]}
        isRolling={isRolling}
        used={!!usedDice[0]}
      />
      <SingleDie
        key={`die-1-${values[1]}`}
        index={1}
        diceValue={values[1]}
        isRolling={isRolling}
        used={!!usedDice[1]}
      />
    </div>
  );
}

function SingleDie({ index, diceValue = 1, isRolling, used }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  console.log(
    `[SingleDie ${index}] diceValue:`,
    diceValue,
    'isRolling:',
    isRolling
  );

  // ✅ Corrected face rotation map (to bring correct number to the front)
  // Rotation mapping ensures requested face points toward viewer (Z+)
  // Adjusted: show 6 (traditionally bottom) by rotating cube so 6 faces front.
  const faceRotations = {
    1: { x: 0, y: 0 }, // 1 front
    2: { x: 0, y: 180 }, // 2 back
    3: { x: 0, y: -90 }, // 3 right
    4: { x: 0, y: 90 }, // 4 left
    5: { x: 90, y: 0 }, // 5 now treated as bottom -> rotate up
    6: { x: -90, y: 0 }, // 6 top -> rotate down so 6 faces viewer
  };

  useEffect(() => {
    if (isRolling) {
      // Simulate random spin before landing - use index to create different animations
      const spinX = 360 * (2 + Math.floor(Math.random() * 3) + index);
      const spinY = 360 * (2 + Math.floor(Math.random() * 3) + index * 0.5);
      setRotation({ x: spinX, y: spinY });

      const timer = setTimeout(() => {
        setRotation(faceRotations[diceValue] || { x: 0, y: 0 });
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setRotation(faceRotations[diceValue] || { x: 0, y: 0 });
    }
  }, [diceValue, isRolling, index]);

  return (
    <div
      className="w-16 h-16 perspective-[600px]"
      style={{ opacity: used ? 0.4 : 1 }}
    >
      <div
        className="relative w-full h-full transition-transform duration-[1500ms] ease-in-out"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Dice Faces */}
        <Face rotateX={0} rotateY={0} number={1} color="#ffffff" />{' '}
        {/* Front */}
        <Face rotateX={0} rotateY={180} number={2} color="#f3f3f3" />{' '}
        {/* Back */}
        <Face rotateX={0} rotateY={-90} number={4} color="#e6f7ff" />{' '}
        {/* Left */}
        <Face rotateX={0} rotateY={90} number={3} color="#fff4e6" />{' '}
        {/* Right */}
        <Face rotateX={90} rotateY={0} number={6} color="#ffe6e6" />{' '}
        {/* Bottom */}
        <Face rotateX={-90} rotateY={0} number={5} color="#f0f0ff" />{' '}
        {/* Top */}
      </div>
    </div>
  );
}

function Face({ rotateX = 0, rotateY = 0, number, color = 'white' }) {
  return (
    <div
      className="absolute w-16 h-16 border-2 border-gray-700 rounded-lg flex items-center justify-center shadow-inner"
      style={{
        backgroundColor: color,
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(2.5rem)`,
        backfaceVisibility: 'hidden',
      }}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-12 h-12">
        {Array.from({ length: 9 }).map((_, i) => (
          <Dot key={i} number={number} index={i} />
        ))}
      </div>
    </div>
  );
}

function Dot({ number, index }) {
  const dotPatterns = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const isDot = dotPatterns[number]?.includes(index);
  return (
    <div className={`w-2.5 h-2.5 rounded-full ${isDot ? 'bg-black' : ''}`} />
  );
}
