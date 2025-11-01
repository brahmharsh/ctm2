"use client";
import { useEffect, useState } from "react";

export default function Dice3D({ diceValue = 1, isRolling }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Map dice value to rotation
  const faceRotations = {
    1: { x: 0, y: 0 },       // Front
    2: { x: 0, y: 180 },     // Back
    3: { x: 0, y: -90 },     // Right
    4: { x: 0, y: 90 },      // Left
    5: { x: -90, y: 0 },     // Top
    6: { x: 90, y: 0 },      // Bottom
  };

  useEffect(() => {
    if (isRolling) {
      // Start spinning randomly
      const spinX = 360 * (2 + Math.floor(Math.random() * 3));
      const spinY = 360 * (2 + Math.floor(Math.random() * 3));
      setRotation({ x: spinX, y: spinY });

      // Stop spinning after animation duration
      const timer = setTimeout(() => {
        console.log("[Dice3D] Final rotation set to show face:", diceValue);
        setRotation(faceRotations[diceValue] || { x: 0, y: 0 });
      }, 1500); // matches CSS transition

      return () => clearTimeout(timer);
    } else {
      // Show final dice immediately
      console.log("[Dice3D] Static render for face:", diceValue);
      setRotation(faceRotations[diceValue] || { x: 0, y: 0 });
    }
  }, [diceValue, isRolling]);

  return (
    <div className="w-16 h-16 perspective-[600px]">
      <div
        className="relative w-full h-full transition-transform duration-[1500ms] ease-in-out transform-style-3d"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Dice Faces */}
        <Face rotateX={0} rotateY={0} number={1} />      {/* Front */}
        <Face rotateX={0} rotateY={180} number={2} />    {/* Back */}
        <Face rotateX={0} rotateY={90} number={4} />     {/* Left */}
        <Face rotateX={0} rotateY={-90} number={3} />    {/* Right */}
        <Face rotateX={-90} rotateY={0} number={5} />    {/* Top */}
        <Face rotateX={90} rotateY={0} number={6} />     {/* Bottom */}
      </div>
    </div>
  );
}

function Face({ rotateX = 0, rotateY = 0, number }) {
  return (
    <div
      className="absolute w-16 h-16 bg-white border-2 border-gray-700 rounded-lg flex items-center justify-center shadow-inner"
      style={{
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(2.5rem)`,
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
  return <div className={`w-2.5 h-2.5 rounded-full ${isDot ? "bg-black" : ""}`}></div>;
}

// "use client";
// import { useState } from "react";

// export default function Dice3D() {
//   const [rolling, setRolling] = useState(false);
//   const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
//   const [diceValue, setDiceValue] = useState(1);

//   // Mapping dice number to rotation so that number lands on top
//   const diceRotations = {
//     1: { x: -90, y: 0 },
//     2: { x: 90, y: 0 },
//     3: { x: 0, y: -90 },
//     4: { x: 0, y: 90 },
//     5: { x: 0, y: 0 },
//     6: { x: 180, y: 0 },
//   };

// const rollDice = () => {
//   if (rolling) return;
//   setRolling(true);

//   const rolled = Math.floor(Math.random() * 6) + 1;
//   const finalRotation = diceRotations[rolled];

//   // spins in multiples of 360 so cube lands perfectly
//   const spinX = 360 * (2 + Math.floor(Math.random() * 3)) + finalRotation.x;
//   const spinY = 360 * (2 + Math.floor(Math.random() * 3)) + finalRotation.y;

//   setRotation({ x: spinX, y: spinY, z: 0 });

//   setTimeout(() => {
//     setDiceValue(rolled);
//     setRolling(false);
//   }, 1500);
// };


//   return (
//     <div className="flex flex-col items-center justify-center min-h-[60vh] perspective-[800px]">
//       {/* Dice cube */}
//       <div
//         className="relative w-24 h-24 transition-transform duration-[1500ms] ease-in-out transform-style-3d"
//         style={{
//           transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
//         }}
//       >
//         {/* Six faces of the cube */}
//         <Face rotateX={0} rotateY={0} number={1} />      {/* Front */}
//         <Face rotateX={0} rotateY={180} number={6} />    {/* Back */}
//         <Face rotateX={0} rotateY={90} number={3} />     {/* Right */}
//         <Face rotateX={0} rotateY={-90} number={4} />    {/* Left */}
//         <Face rotateX={90} rotateY={0} number={5} />     {/* Top */}
//         <Face rotateX={-90} rotateY={0} number={2} />    {/* Bottom */}
//       </div>

//       {/* Roll button */}
//       <button
//         onClick={rollDice}
//         disabled={rolling}
//         className="mt-8 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
//       >
//         {rolling ? "Rolling..." : "Roll Dice"}
//       </button>
//     </div>
//   );
// }

// /* Dice face component */
// function Face({ rotateX = 0, rotateY = 0, number }) {
//   return (
//     <div
//       className="absolute w-24 h-24 bg-white border-2 border-gray-700 rounded-lg flex items-center justify-center shadow-inner"
//       style={{
//         transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(3rem)`,
//       }}
//     >
//       <div className="grid grid-cols-3 grid-rows-3 gap-1 w-16 h-16">
//         {Array.from({ length: 9 }).map((_, i) => (
//           <Dot key={i} number={number} index={i} />
//         ))}
//       </div>
//     </div>
//   );
// }

// /* Dot component for dice numbers */
// function Dot({ number, index }) {
//   const dotPatterns = {
//     1: [4],
//     2: [0, 8],
//     3: [0, 4, 8],
//     4: [0, 2, 6, 8],
//     5: [0, 2, 4, 6, 8],
//     6: [0, 2, 3, 5, 6, 8],
//   };
//   const isDot = dotPatterns[number].includes(index);
//   return <div className={`w-3 h-3 rounded-full ${isDot ? "bg-black" : ""}`}></div>;
// }
