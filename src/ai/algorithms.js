/**
 * @file algorithms.js
 * @author Devin Arena
 * @description Need to store a lot of CMLL algorithms here.
 * @since 6/11/2022
 **/

const movePattern = /^([UDLRFBMr]+2?'? +)+$/;

const scrambleMoves = [
  "U",
  "U'",
  "U2",
  "D",
  "D'",
  "D2",
  "L",
  "L'",
  "L2",
  "R",
  "R'",
  "R2",
  "F",
  "F'",
  "F2",
  "B",
  "B'",
  "B2",
];

const STM = [
  "U",
  "U'",
  "U2",
  "D",
  "D'",
  "D2",
  "L",
  "L'",
  "L2",
  "R",
  "R'",
  "R2",
  "F",
  "F'",
  "F2",
  "B",
  "B'",
  "B2",
  "M",
  "M'",
  "M2",
];

const SBM = ["U", "U'", "U2", "R", "R'", "R2", "M", "M'", "M2"];

const LSEM = ["U", "U'", "U2", "M", "M'", "M2"];

const CMLL_PIECES = [38, 36, 9, 0, 2, 29, 11, 6, 8, 27, 18, 20];

const CMLL = {
  // O
  "234665466253": "R U R' F' R U R' U' R' F R2 U' R'",
  "234664566523": "F R U' R' U' R U R' F' R U R' U' R' F R F'",
  // H
  "662342534566": "R U2 R' U' R U R' U' R U' R'",
  "662334255466": "F R U R' U' R U R' U' R U R' U' F'",
  "226346655643": "R U2' R2' F R F' U2 R' F R F'",
  "662334542566": "r U' r2' D' r U' r' D r2 U r'",
  // Pi
  "266343654526": "F R U R' U' R U R' U' F'",
  "662345645632": "F R' F' R U2 R U' R' U R U2' R'",
  "226346543566": "R' F R U F U' R U R' U' F'",
  "266343645256": "R U2 R' U' R U R' U2' R' F R F'",
  "236446355266": "r U' r2' D' r U r' D r2 U r'",
  "226346355466": "R' U' R' F R F' R U' R' U2 R",
  // U
  "234665235466": "R2 D R' U2 R D' R' U2 R'",
  "662345566423": "R2' D' R U2 R' D R U2 R",
  "662342366455": "R2' F U' F U F2 R2 U' R' F R",
  "236465646532": "F R2 D R' U R D' R2' U' F'",
  "234664532566": "r U' r' U r' D' r U' r' D r",
  "236462646553": "F R U R' U' F'",
  // T
  "622364456563": "R U R' U' R' F R F'",
  "263642565346": "L' U' L U L F' L' F",
  "236446266355": "F R' F R2 U' R' U' R U R' F2",
  "226346466355": "r' U r U2' R2' F R F' R",
  "236446566532": "r' D' r U r' D r U' r U r'",
  "234664623655": "r2' D' r U r' D r2 U' r' U' r",
  // S
  "623436462556": "R U R' U R U2 R'",
  "623246463556": "L' U2 L U2' L F' L' F",
  "623456463526": "F R' F' R U2 R U2' R'",
  "234656623456": "R' U' R U' R2' F' R U R U' R' F U2' R",
  "623464635256": "R U R' U R' F R F' R U2' R'",
  "623456562436": "R U' L' U R' U' L",
  // Anti-S
  "263642535664": "R' U' R U' R' U2' R",
  "266343456562": "R2 D R' U R D' R' U R' U' R U' R'",
  "266345356462": "F' L F L' U2' L' U2 L",
  "266324546365": "R U2' R' U2 R' F R F'",
  "266345426365": "L' U R U' L U R'",
  "266324564635": "R' U' R U' R' U R' F R F' U R",
  // L
  "234626356564": "F R U' R' U' R U R' F'",
  "234656346265": "F R' F' R U R U' R'",
  "263642656435": "R U2 R' U' R U R' U' R U R' U' R U' R'",
  "233646546265": "R U2 R D R' U2 R D' R2'",
  "263634626554": "R' U' R U R' F' R U R' U' R' F R2",
  "622364563645": "R' U2 R' D' R U2 R' D R2",
};

/**
 * Generates a random scramble from the scramble list.
 * 
 * @param {number} moves the number of moves to generate
 * @returns a random scramble
 */
const randomScramble = (moves) => {
  const scramble = [];
  for (let i = 0; i < moves; i++) {
    let move = scrambleMoves[Math.floor(Math.random() * scrambleMoves.length)];
    // don't use the same move twice in a row
    while (scramble.length && move[0] === scramble[scramble.length - 1][0])
      move = scrambleMoves[Math.floor(Math.random() * scrambleMoves.length)];

    scramble.push(move);
  }
  return scramble.join(" ").trim();
};

/**
 * Checks a scramble for validity. Scrambles may only contain developed moves.
 * 
 * @param {String} scramble the scramble to test
 * @returns true if the scramble is valid, false otherwise
 */
const checkScramble = (scramble) => {
  // Add a space at the end since regex expects one
  return movePattern.test((scramble + " "));
}

export { CMLL, CMLL_PIECES, STM, SBM, LSEM, randomScramble, checkScramble };
