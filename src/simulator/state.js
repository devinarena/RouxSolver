/*
    {
        "left": "black",
        "right": "black",
        "top": "black",
        "bottom": "black",
        "front": "black",
        "back": "black"
    }
*/

/**
 * @file: cubestate.js
 * @author: Devin Arena
 * @since 10/16/2021
 * @description Contains logic for updating the state of the cube.
 */

import solved from "../cubestate/solved.json";

/**
 * Loads the solved state form solved.json onto the cube.
 *
 * @param {Cube} cube the cube to load
 */
const loadSolvedState = (cube) => {
  // grab each cubie
  for (let i = 0; i < solved["state"].length; i++) {
    let cubie = cube.cube[i];

    // set each color for each face
    for (let curr in solved["state"][i]) {
      cubie.setColor(curr, solved["state"][i][curr]);
    }
  }
};

export { loadSolvedState };
