// buildPath (moved from features/parcheesi/lib/logic/buildPath.js)
export function buildPath(GRID_SIZE) {
  const path = []; for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) { const row = Math.floor(i / GRID_SIZE); const col = i % GRID_SIZE; path.push({ x: col, y: row, index: i }); }
  const gameCells = {}; let c = 1;
  // Original mapping retained:
  gameCells[c++] = [391, 392]; gameCells[c++] = [371, 372]; gameCells[c++] = [351, 352]; gameCells[c++] = [331, 332]; gameCells[c++] = [311, 312]; gameCells[c++] = [291, 292]; gameCells[c++] = [271, 272]; gameCells[c++] = [251, 252];
  gameCells[c++] = [232, 252]; gameCells[c++] = [233, 253]; gameCells[c++] = [234, 254]; gameCells[c++] = [235, 255]; gameCells[c++] = [236, 256]; gameCells[c++] = [237, 257]; gameCells[c++] = [238, 258]; gameCells[c++] = [239, 259];
  gameCells[c++] = [199, 219]; gameCells[c++] = [159, 179]; gameCells[c++] = [158, 178]; gameCells[c++] = [157, 177]; gameCells[c++] = [156, 176]; gameCells[c++] = [155, 175]; gameCells[c++] = [154, 174]; gameCells[c++] = [153, 173]; gameCells[c++] = [152, 172];
  gameCells[c++] = [151, 152]; gameCells[c++] = [131, 132]; gameCells[c++] = [111, 112]; gameCells[c++] = [91, 92]; gameCells[c++] = [71, 72]; gameCells[c++] = [51, 52]; gameCells[c++] = [31, 32]; gameCells[c++] = [11, 12]; gameCells[c++] = [9, 10]; gameCells[c++] = [7, 8];
  gameCells[c++] = [27, 28]; gameCells[c++] = [47, 48]; gameCells[c++] = [67, 68]; gameCells[c++] = [87, 88]; gameCells[c++] = [107, 108]; gameCells[c++] = [127, 128]; gameCells[c++] = [147, 148];
  gameCells[c++] = [147, 167]; gameCells[c++] = [146, 166]; gameCells[c++] = [145, 165]; gameCells[c++] = [144, 164]; gameCells[c++] = [143, 163]; gameCells[c++] = [142, 162]; gameCells[c++] = [141, 161]; gameCells[c++] = [140, 160];
  gameCells[c++] = [180, 200]; gameCells[c++] = [220, 240]; gameCells[c++] = [221, 241]; gameCells[c++] = [222, 242]; gameCells[c++] = [223, 243]; gameCells[c++] = [224, 244]; gameCells[c++] = [225, 245]; gameCells[c++] = [226, 246]; gameCells[c++] = [227, 247];
  gameCells[c++] = [247, 248]; gameCells[c++] = [267, 268]; gameCells[c++] = [287, 288]; gameCells[c++] = [307, 308]; gameCells[c++] = [327, 328]; gameCells[c++] = [347, 348]; gameCells[c++] = [367, 368]; gameCells[c++] = [387, 388]; gameCells[c++] = [389, 390];
  gameCells['Y1'] = [369, 370]; gameCells['Y2'] = [349, 350]; gameCells['Y3'] = [329, 330]; gameCells['Y4'] = [309, 310]; gameCells['Y5'] = [289, 290]; gameCells['Y6'] = [269, 270]; gameCells['Y7'] = [249, 250];
  gameCells['B1'] = [198, 218]; gameCells['B2'] = [197, 217]; gameCells['B3'] = [196, 216]; gameCells['B4'] = [195, 215]; gameCells['B5'] = [194, 214]; gameCells['B6'] = [193, 213]; gameCells['B7'] = [192, 212];
  gameCells['R1'] = [29, 30]; gameCells['R2'] = [49, 50]; gameCells['R3'] = [69, 70]; gameCells['R4'] = [89, 90]; gameCells['R5'] = [109, 110]; gameCells['R6'] = [129, 130]; gameCells['R7'] = [149, 150];
  gameCells['G1'] = [181, 201]; gameCells['G2'] = [182, 202]; gameCells['G3'] = [183, 203]; gameCells['G4'] = [184, 204]; gameCells['G5'] = [185, 205]; gameCells['G6'] = [186, 206]; gameCells['G7'] = [187, 207];
  return { path, gameCells };
}