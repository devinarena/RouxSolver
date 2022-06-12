/**
 * @file ai.js
 * @author Devin Arena
 * @description AI Logic for generating moves to solve.
 * @since 6/7/2022
 **/

import { CMLL, CMLL_PIECES, STM, SBM, LSEM } from "./algorithms";

const state = [
  [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ], // top 0-8

  [
    [2, 2, 2],
    [2, 2, 2],
    [2, 2, 2],
  ], // left 9-17

  [
    [3, 3, 3],
    [3, 3, 3],
    [3, 3, 3],
  ], // front 18-26

  [
    [4, 4, 4],
    [4, 4, 4],
    [4, 4, 4],
  ], // right 27-35

  [
    [5, 5, 5],
    [5, 5, 5],
    [5, 5, 5],
  ], // back 36-44

  [
    [6, 6, 6],
    [6, 6, 6],
    [6, 6, 6],
  ], // bottom 45-53
];

let initialState = JSON.parse(JSON.stringify(state));

const TOP = 0;
const LEFT = 1;
const FRONT = 2;
const RIGHT = 3;
const BACK = 4;
const BOTTOM = 5;

const PRUNE_DEPTH = 4;

const scrambleAI = (scramble) => {
  for (const s of [state, fbMask, sbMask, lseMask]) makeMoves(s, scramble);
};

const startAI = () => {
  let start = new Date();

  let FB = "";
  let SB = "";
  let LSE = "";

  for (let i = 1; i <= 10; i++) {
    const sol = generateSolution(fbMask, STM, [], i, fbPieces, fbPruningTable);
    if (sol && sol.length > 0) {
      console.log(i + " moves: " + sol);
      makeMoves(state, sol);
      makeMoves(sbMask, sol);
      makeMoves(lseMask, sol);
      FB = sol;
      break;
    }
  }

  for (let i = 1; i <= 15; i++) {
    const sol = generateSolution(sbMask, SBM, [], i, sbPieces, sbPruningTable);
    if (sol && sol.length > 0) {
      console.log(i + " moves: " + sol);
      makeMoves(state, sol);
      makeMoves(lseMask, sol);
      SB = sol;
      break;
    }
  }

  const { CMLL, U } = getCMLL(state);
  console.log("CMLL: " + CMLL);
  makeMoves(state, CMLL);
  makeMoves(lseMask, U + CMLL);

  for (const req of [0, 2, 6, 8]) {
    const face = Math.floor(req / 9);
    const row = Math.floor((req % 9) / 3);
    const col = req % 3;
    if (state[face][row][col] !== initialState[face][row][col]) {
      console.log("CMLL: " + CMLL + " FAILED");
      return;
    }
  }

  for (let i = 1; i <= 18; i++) {
    const sol = generateSolution(
      lseMask,
      LSEM,
      [],
      i,
      lsePieces,
      lsePruningTable
    );
    if (sol && sol.length > 0) {
      console.log(i + " moves: " + sol);
      makeMoves(state, sol);
      LSE = sol;
      break;
    }
  }

  console.log("Elapsed: " + (new Date() - start) + "ms");

  return { FB, SB, CMLL: U + CMLL, LSE };
};

const generateMaskedState = (reqs) => {
  const masked = JSON.parse(JSON.stringify(initialState));
  for (
    let i = 0;
    i < masked.length * masked[0].length * masked[0][0].length;
    i++
  ) {
    const face = Math.floor(i / 9);
    const row = Math.floor((i % 9) / 3);
    const col = i % 3;
    if (reqs.includes(i)) {
      continue;
    }
    masked[face][row][col] = 0;
  }
  return masked;
};

const generatePruningTable = (states, depth, moves) => {
  const table = {};
  let prev = states;
  for (let i = 1; i <= depth; i++) {
    const next = [];
    for (const state of prev) {
      for (const move of moves) {
        const newState = JSON.parse(state);
        makeMoves(newState, move);
        const stateString = JSON.stringify(newState);
        if (!table.hasOwnProperty(stateString)) {
          table[stateString] = i;
          next.push(stateString);
        }
      }
    }
    prev = [...next];
  }
  return table;
};

const generateSolution = (mask, moves, current, left, reqs, pruneTable) => {
  if (left < 0) return undefined;

  let all = true;
  for (const req of reqs) {
    const face = Math.floor(req / 9);
    const row = Math.floor((req % 9) / 3);
    const col = req % 3;
    if (mask[face][row][col] !== initialState[face][row][col]) {
      all = false;
      break;
    }
  }
  if (all) return current.join(" ").trim();

  let leastMoves = pruneTable[JSON.stringify(mask)];
  if (!leastMoves) leastMoves = PRUNE_DEPTH + 1;
  if (leastMoves > left) return undefined;

  for (const move of moves) {
    if (current.length && current[current.length - 1][0] == move[0]) continue;
    current.push(move);
    makeMove(mask, move);
    const next = generateSolution(
      mask,
      moves,
      current,
      left - 1,
      reqs,
      pruneTable
    );
    if (next) return next;
    makeMove(mask, reverseMove(move));
    current.pop();
  }

  return "";
};

const getCMLL = (state) => {
  let x = 1;
  for (const cmll in CMLL) {
    let U = "";
    for (let i = 0; i < 4; i++) {
      const cols = [0, 0, 0, 0];
      let good = true;
      let index = 0;
      for (const piece of CMLL_PIECES) {
        const face = Math.floor(piece / 9);
        const row = Math.floor((piece % 9) / 3);
        const col = piece % 3;
        const color = state[face][row][col];
        let pos = cmll.charAt(index++) - "2";
        if ((color === 6 || color === 1) && pos !== 4) {
          good = false;
          break;
        } else if (pos >= 0 && pos <= 3) {
          if (cols[pos] === 0) {
            cols[pos] = color;
          } else if (cols[pos] !== color) {
            good = false;
            break;
          }
        }
      }
      if (good) return { CMLL: CMLL[cmll], U };
      makeMove(state, "U");
      U += "U ";
    }
  }
  return { CMLL: "", U: "" };
};

const reverseMove = (move) => {
  if (move.endsWith("'")) return move.substring(0, move.length - 1);
  return move + "'";
};

const makeMoves = (state, moves) => {
  for (const move of moves.split(" ")) {
    makeMove(state, move);
  }
};

const makeMove = (state, move) => {
  const doubled = move.includes("2") ? 2 : 1;
  switch (move[0]) {
    case "U": {
      const cw = move[move.length - 1] !== "'";
      for (let i = 0; i < doubled; i++) {
        rotateFace(state, TOP, cw);
        rotateY(state, 3, cw);
      }
      break;
    }
    case "D": {
      const cw = move[move.length - 1] !== "'";
      for (let i = 0; i < doubled; i++) {
        rotateFace(state, BOTTOM, cw);
        rotateY(state, 1, !cw);
      }
      break;
    }
    case "L": {
      const cw = move[move.length - 1] !== "'";
      for (let i = 0; i < doubled; i++) {
        rotateFace(state, LEFT, cw);
        rotateX(state, 1, !cw);
      }
      break;
    }
    case "R": {
      const cw = move[move.length - 1] !== "'";
      for (let i = 0; i < doubled; i++) {
        rotateFace(state, RIGHT, cw);
        rotateX(state, 3, cw);
      }
      break;
    }
    case "r": {
      const cw = move[move.length - 1] !== "'";
      for (let i = 0; i < doubled; i++) {
        rotateFace(state, RIGHT, cw);
        rotateX(state, 3, cw);
        rotateX(state, 2, cw);
      }
      break;
    }
    case "F": {
      const cw = move[move.length - 1] !== "'";
      for (let i = 0; i < doubled; i++) {
        rotateFace(state, FRONT, cw);
        rotateZ(state, 1, cw);
      }
      break;
    }
    case "B": {
      const cw = move[move.length - 1] !== "'";
      for (let i = 0; i < doubled; i++) {
        rotateFace(state, BACK, cw);
        rotateZ(state, 3, !cw);
      }
      break;
    }
    case "M": {
      const cw = move[move.length - 1] !== "'";
      for (let i = 0; i < doubled; i++) {
        rotateX(state, 2, !cw);
      }
      break;
    }
  }
};

const rotateZ = (state, layer, cw) => {
  // nvm this is the worst
  // need to start rotate from the first row on the bottom, the last col on left, first row on top, first col on right
  const top = 3 - layer;
  const bottom = layer - 1;
  const left = 3 - layer;
  const right = layer - 1;
  if (cw) {
    const temp = [...state[TOP][top]]; // 1 1 1
    for (let i = 0; i < state[TOP].length; i++) {
      state[TOP][top][i] = state[LEFT][state[LEFT].length - i - 1][left];
    }
    for (let i = 0; i < state[LEFT].length; i++) {
      state[LEFT][i][left] = state[BOTTOM][bottom][i];
    }
    for (let i = 0; i < state[BOTTOM].length; i++) {
      state[BOTTOM][bottom][state[BOTTOM].length - 1 - i] =
        state[RIGHT][i][right];
    }
    for (let i = 0; i < state[RIGHT].length; i++) {
      state[RIGHT][i][right] = temp[i];
    }
  } else {
    const temp = [...state[TOP][top]]; // 1 1 1
    for (let i = 0; i < state[TOP].length; i++) {
      state[TOP][top][i] = state[RIGHT][i][right];
    }
    for (let i = 0; i < state[RIGHT].length; i++) {
      state[RIGHT][i][right] =
        state[BOTTOM][bottom][state[BOTTOM].length - 1 - i];
    }
    for (let i = 0; i < state[BOTTOM].length; i++) {
      state[BOTTOM][bottom][i] = state[LEFT][i][left];
    }
    for (let i = 0; i < state[LEFT].length; i++) {
      state[LEFT][state[left].length - i - 1][left] = temp[i];
    }
  }
};

const rotateX = (state, layer, cw) => {
  // this ones gonna suck isn't it
  // for counterclockwise, front becomes top, top becomes back, back becomes bottom, bottom becomes front
  // for clockwise, front becomes bottom, bottom becomes back, back becomes top, top becomes front
  const adjusted = layer - 1;
  const back = 3 - layer;
  if (cw) {
    const temp = [];
    for (let i = 0; i < state[FRONT].length; i++) {
      temp.push(state[FRONT][i][adjusted]);
    }
    for (let i = 0; i < state[FRONT].length; i++) {
      state[FRONT][i][adjusted] = state[BOTTOM][i][adjusted];
    }
    for (let i = 0; i < state[BOTTOM].length; i++) {
      state[BOTTOM][state[BOTTOM].length - i - 1][adjusted] =
        state[BACK][i][back];
    }
    for (let i = 0; i < state[BACK].length; i++) {
      state[BACK][state[BACK].length - i - 1][back] = state[TOP][i][adjusted];
    }
    for (let i = 0; i < state[TOP].length; i++) {
      state[TOP][i][adjusted] = temp[i];
    }
  } else {
    const temp = [];
    for (let i = 0; i < state[FRONT].length; i++) {
      temp.push(state[FRONT][i][adjusted]);
    }
    for (let i = 0; i < state[FRONT].length; i++) {
      state[FRONT][i][adjusted] = state[TOP][i][adjusted];
    }
    for (let i = 0; i < state[TOP].length; i++) {
      state[TOP][i][adjusted] = state[BACK][state[BACK].length - i - 1][back];
    }
    for (let i = 0; i < state[BACK].length; i++) {
      state[BACK][state[BACK].length - i - 1][back] =
        state[BOTTOM][i][adjusted];
    }
    for (let i = 0; i < state[BOTTOM].length; i++) {
      state[BOTTOM][i][adjusted] = temp[i];
    }
  }
};

const rotateY = (state, layer, cw) => {
  // for clockwise, left becomes back, back becomes right, right becomes front, front becomes left
  // for counterclockwise, left becomes front, front becomes right, right becomes back, back becomes left
  const adjusted = 3 - layer;
  if (cw) {
    const temp = [...state[LEFT][adjusted]];
    state[LEFT][adjusted] = state[FRONT][adjusted];
    state[FRONT][adjusted] = state[RIGHT][adjusted];
    state[RIGHT][adjusted] = state[BACK][adjusted];
    state[BACK][adjusted] = temp;
  } else {
    const temp = [...state[LEFT][adjusted]];
    state[LEFT][adjusted] = state[BACK][adjusted];
    state[BACK][adjusted] = state[RIGHT][adjusted];
    state[RIGHT][adjusted] = state[FRONT][adjusted];
    state[FRONT][adjusted] = temp;
  }
};

const rotateFace = (state, faceID, cw) => {
  // same as rotating an nxn matrix clockwise or counterclockwise
  let face = state[faceID];
  // convert rows to columns
  for (let j = 0; j < face[0].length; j++) {
    for (let i = j + 1; i < face.length; i++) {
      const temp = face[i][j];
      face[i][j] = face[j][i];
      face[j][i] = temp;
    }
  }

  // swap rows and cols (clockwise)
  if (cw) {
    for (let i = 0; i < face.length; i++) {
      for (let j = 0; j < face[i].length / 2; j++) {
        const temp = face[i][j];
        face[i][j] = face[i][face[i].length - j - 1];
        face[i][face[i].length - j - 1] = temp;
      }
    }
  } else {
    // swap rows and cols (counterclockwise)
    for (let i = 0; i < face.length / 2; i++) {
      for (let j = 0; j < face[i].length; j++) {
        const temp = face[i][j];
        face[i][j] = face[face.length - i - 1][j];
        face[face.length - i - 1][j] = temp;
      }
    }
  }
};

const printState = (state) => {
  for (let i = 0; i < 3; i++) {
    let row = "      ";
    for (let j = 0; j < 3; j++) {
      row += state[TOP][i][j] + " ";
    }
    console.log(row);
  }

  for (let i = 0; i < 3; i++) {
    let row = "";
    for (let j = 0; j < 3; j++) {
      row += state[LEFT][i][j] + " ";
    }
    for (let j = 0; j < 3; j++) {
      row += state[FRONT][i][j] + " ";
    }
    for (let j = 0; j < 3; j++) {
      row += state[RIGHT][i][j] + " ";
    }
    for (let j = 0; j < 3; j++) {
      row += state[BACK][i][j] + " ";
    }
    console.log(row);
  }

  for (let i = 0; i < 3; i++) {
    let row = "      ";
    for (let j = 0; j < 3; j++) {
      row += state[BOTTOM][i][j] + " ";
    }
    console.log(row);
  }
};

const fbPieces = [12, 13, 14, 15, 16, 17, 21, 24, 39, 42, 45, 48, 51];
const fbMask = generateMaskedState(fbPieces);
const fbPruningTable = generatePruningTable([JSON.stringify(fbMask)], 4, STM);

const sbPieces = [23, 26, 30, 31, 32, 33, 34, 35, 39, 42, 47, 50, 53];
const sbMask = generateMaskedState(sbPieces);
const sbPruningTable = generatePruningTable([JSON.stringify(sbMask)], 4, SBM);

const lsePieces = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 18, 19, 20, 27, 28, 29, 36, 37, 38, 25,
  43, 46, 49,
];
const lseMask = generateMaskedState(lsePieces);
const lsePruningTable = generatePruningTable(
  [JSON.stringify(lseMask)],
  4,
  LSEM
);

export { startAI, scrambleAI };
