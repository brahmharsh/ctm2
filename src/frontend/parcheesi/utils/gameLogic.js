// /game-logic.js
import { GRID_SIZE, PLAYERS } from '../config/constants';

export function buildPath() {
  const path = [];
  // Create a linear path from left to right, top to bottom
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    let row = Math.floor(i / GRID_SIZE);
    let col = i % GRID_SIZE;
    path.push({ x: col, y: row, index: i });
  }

  // Create game cells mapping (Path for piece movement)
  const gameCells = {};
  let cellNumber = 1;

  // 1 to 8 - Vertical path going up (cells merged horizontally)
  gameCells[cellNumber++] = [391, 392]; // Cell 1
  gameCells[cellNumber++] = [371, 372]; // Cell 2
  gameCells[cellNumber++] = [351, 352]; // Cell 3
  gameCells[cellNumber++] = [331, 332]; // Cell 4
  gameCells[cellNumber++] = [311, 312]; // Cell 5
  gameCells[cellNumber++] = [291, 292]; // Cell 6
  gameCells[cellNumber++] = [271, 272]; // Cell 7
  gameCells[cellNumber++] = [251, 252]; // Cell 8

  // 9 to 16 - Horizontal path going right (cells merged vertically)
  gameCells[cellNumber++] = [232, 252]; // Cell 9
  gameCells[cellNumber++] = [233, 253]; // Cell 10
  gameCells[cellNumber++] = [234, 254]; // Cell 11
  gameCells[cellNumber++] = [235, 255]; // Cell 12
  gameCells[cellNumber++] = [236, 256]; // Cell 13
  gameCells[cellNumber++] = [237, 257]; // Cell 14
  gameCells[cellNumber++] = [238, 258]; // Cell 15
  gameCells[cellNumber++] = [239, 259]; // Cell 16

  // 17 to 18 - Vertical path going up (cells merged vertically)
  gameCells[cellNumber++] = [199, 219]; // Cell 17
  gameCells[cellNumber++] = [159, 179]; // Cell 18

  //19 to 25 - Horizontal path going left (cells merged vertically)
  gameCells[cellNumber++] = [158, 178]; // Cell 19
  gameCells[cellNumber++] = [157, 177]; // Cell 20
  gameCells[cellNumber++] = [156, 176]; // Cell 21
  gameCells[cellNumber++] = [155, 175]; // Cell 22
  gameCells[cellNumber++] = [154, 174]; // Cell 23
  gameCells[cellNumber++] = [153, 173]; // Cell 24
  gameCells[cellNumber++] = [152, 172]; // Cell 25

  // 26 to 33 - Vertical path going up (cells merged horizontally)
  gameCells[cellNumber++] = [151, 152]; // Cell 26
  gameCells[cellNumber++] = [131, 132]; // Cell 27
  gameCells[cellNumber++] = [111, 112]; // Cell 28
  gameCells[cellNumber++] = [91, 92]; // Cell 29
  gameCells[cellNumber++] = [71, 72]; // Cell 30
  gameCells[cellNumber++] = [51, 52]; // Cell 31
  gameCells[cellNumber++] = [31, 32]; // Cell 32
  gameCells[cellNumber++] = [11, 12]; // Cell 33

  //34 to 35 - Horizontal path going left (cells merged horizontally)
  gameCells[cellNumber++] = [9, 10]; // Cell 34
  gameCells[cellNumber++] = [7, 8]; // Cell 35

  //36 to 42 - Vertical path going down (cells merged horizontally)
  gameCells[cellNumber++] = [27, 28]; // Cell 36
  gameCells[cellNumber++] = [47, 48]; // Cell 37
  gameCells[cellNumber++] = [67, 68]; // Cell 38
  gameCells[cellNumber++] = [87, 88]; // Cell 39
  gameCells[cellNumber++] = [107, 108]; // Cell 40
  gameCells[cellNumber++] = [127, 128]; // Cell 41
  gameCells[cellNumber++] = [147, 148]; // Cell 42

  //43 to 50 - Horizontal path going left (cells merged vertically)
  gameCells[cellNumber++] = [147, 167]; // Cell 43
  gameCells[cellNumber++] = [146, 166]; // Cell 44
  gameCells[cellNumber++] = [145, 165]; // Cell 45
  gameCells[cellNumber++] = [144, 164]; // Cell 46
  gameCells[cellNumber++] = [143, 163]; // Cell 47
  gameCells[cellNumber++] = [142, 162]; // Cell 48
  gameCells[cellNumber++] = [141, 161]; // Cell 49
  gameCells[cellNumber++] = [140, 160]; // Cell 50

  // 51 to 52 - Vertical path going down (cells merged vertically)
  gameCells[cellNumber++] = [180, 200]; // Cell 51
  gameCells[cellNumber++] = [220, 240]; // Cell 52

  //53 to 59 - Horizontal path going right (cells merged vertically)
  gameCells[cellNumber++] = [221, 241]; // Cell 53
  gameCells[cellNumber++] = [222, 242]; // Cell 54
  gameCells[cellNumber++] = [223, 243]; // Cell 55
  gameCells[cellNumber++] = [224, 244]; // Cell 56
  gameCells[cellNumber++] = [225, 245]; // Cell 57
  gameCells[cellNumber++] = [226, 246]; // Cell 58
  gameCells[cellNumber++] = [227, 247]; // Cell 59

  //60 to 67 - Vertical path going down (cells merged horizontally)
  gameCells[cellNumber++] = [247, 248]; // Cell 60
  gameCells[cellNumber++] = [267, 268]; // Cell 61
  gameCells[cellNumber++] = [287, 288]; // Cell 62
  gameCells[cellNumber++] = [307, 308]; // Cell 63
  gameCells[cellNumber++] = [327, 328]; // Cell 64
  gameCells[cellNumber++] = [347, 348]; // Cell 65
  gameCells[cellNumber++] = [367, 368]; // Cell 66
  gameCells[cellNumber++] = [387, 388]; // Cell 67

  //68 - going right (cell merged horizontally)
  gameCells[cellNumber++] = [389, 390]; // Cell 68

  //Assign code number to tails
  //for yellow tail (cells merged horizontally)
  gameCells['Y1'] = [369, 370]; // Cell Y1
  gameCells['Y2'] = [349, 350]; // Cell Y2
  gameCells['Y3'] = [329, 330]; // Cell Y3
  gameCells['Y4'] = [309, 310]; // Cell Y4
  gameCells['Y5'] = [289, 290]; // Cell Y5
  gameCells['Y6'] = [269, 270]; // Cell Y6
  gameCells['Y7'] = [249, 250]; // Cell Y7

  //for blue tail (cells merged vertically)
  gameCells['B1'] = [198, 218]; // Cell B1
  gameCells['B2'] = [197, 217]; // Cell B2
  gameCells['B3'] = [196, 216]; // Cell B3
  gameCells['B4'] = [195, 215]; // Cell B4
  gameCells['B5'] = [194, 214]; // Cell B5
  gameCells['B6'] = [193, 213]; // Cell B6
  gameCells['B7'] = [192, 212]; // Cell B7

  //for red tail (cells merged horizontally)
  gameCells['R1'] = [29, 30]; // Cell R1
  gameCells['R2'] = [49, 50]; // Cell R2
  gameCells['R3'] = [69, 70]; // Cell R3
  gameCells['R4'] = [89, 90]; // Cell R4
  gameCells['R5'] = [109, 110]; // Cell R5
  gameCells['R6'] = [129, 130]; // Cell R6
  gameCells['R7'] = [149, 150]; // Cell R7

  //for green tail (cells merged vertically)
  gameCells['G1'] = [181, 201]; // Cell G1
  gameCells['G2'] = [182, 202]; // Cell G2
  gameCells['G3'] = [183, 203]; // Cell G3
  gameCells['G4'] = [184, 204]; // Cell G4
  gameCells['G5'] = [185, 205]; // Cell G5
  gameCells['G6'] = [186, 206]; // Cell G6
  gameCells['G7'] = [187, 207]; // Cell G7

  return { path, gameCells };
}
