import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Cube from "./cube";
import * as state from "./state";
import { startAI, scrambleAI, debug } from "../ai/ai";
import { randomScramble, checkScramble } from "../ai/algorithms";
import "./styles.css";

// Cube-X

/**
 * @file: index.js
 * @author: Devin Arena
 * @since 10/15/2021
 * @description Entry point for the application, handles bulk of the
 *              logic for Three.js scenes and camera.
 */

// initialize camera and scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
const clock = new THREE.Clock();

let running = false;

let scramble;
let cube;

// form stuff
const scrambleInput = document.querySelector("#scramble");
const scrambleButton = document.querySelector("#scramblebutton");
const solveButton = document.querySelector("#solve");
const controlsButton = document.querySelector("#controls");
const speedSelector = document.querySelector("#speed");

const historyCounter = document.querySelector("#history-counter");
const solutionMsg = document.querySelector("#solution-msg");

// Use a pivot so we can rotate the entire cube
const pivot = new THREE.Group();

// initialize renderer and camera controller
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

// setup bounds for distance from camera to cube
controls.minDistance = 3;
controls.maxDistance = 50;

const threeContainer =
  document.body.getElementsByClassName("three-container")[0];

const init = async () => {
  // add the cube pivot to the scene
  scene.add(pivot);

  // set renderer size and add it to the DOM
  renderer.setSize(
    threeContainer.clientWidth,
    threeContainer.clientHeight,
    false
  );
  threeContainer.appendChild(renderer.domElement);

  // default camera position
  camera.position.set(0, 0, 7);
  // disable panning for controls
  controls.enablePan = false;

  updateCanvasSize(true);

  // initialize the starting cube by creating 27 cubies
  cube = new Cube();
  cube.setupCube(pivot);

  state.loadSolvedState(cube);
};

/**
 * Gets the scramble from the input and runs it on the cube.
 */
const scrambleCube = () => {
  // Scrambles must use only defined letters, 2, and "'"
  let valid = checkScramble(scrambleInput.value.trim());
  if (!valid) {
    console.log(valid);
    solutionMsg.innerHTML = "Invalid scramble provided";
    return;
  }

  // disable and reenable the buttons to prevent spamming 'solve'

  if (running) return;
  running = true;
  scrambleButton.disabled = true;
  solveButton.disabled = true;

  // get the scramble from the input
  scramble = scrambleInput.value.trim();
  scrambleAI(scramble);
  queueMoves(scramble);
  solutionMsg.innerHTML = "Scrambling with " + scramble;

  running = false;
  scrambleButton.disabled = false;
  solveButton.disabled = false;
};

/**
 * Runs the AI to get the solution string and executes it on the cube.
 */
const solve = () => {
  if (running) return;
  if (cube.inProgress()) {
    solutionMsg.innerHTML = "Cannot solve while cube is still scrambling";
    return;
  }

  solutionMsg.innerHTML = "Generating solution...";

  running = true;
  scrambleButton.disabled = true;
  solveButton.disabled = true;

  setTimeout(() => {
    let start = new Date();

    const { FB, SB, CMLL, LSE } = startAI(cube);
    queueMoves(FB);
    queueMoves(SB);
    queueMoves(CMLL);
    queueMoves(LSE);

    let elapsed = new Date() - start;

    solutionMsg.innerHTML = `${FB} // FB\n${SB} // SB\n${CMLL} // CMLL\n${LSE} // LSE\n\nTime to solution: ${elapsed}ms \n\n\n// ALPHA NOTICE: And the cube is solved... hopefully. If not, this is a bug (I most likely entered an algorithm wrong). If you have the scramble, please post it with this as an issue on GitHub.`;

    running = false;
    scrambleButton.disabled = false;
    solveButton.disabled = false;
  }, 50);
};

/**
 * Updates elements of the main scene.
 */
const animate = () => {
  updateCanvasSize(false);

  controls.update();
  cube.update(pivot, clock.getDelta());
  // pivot.rotateY(0.005);

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
};

/**
 * Fixes the size of the canvas if its not properly sized.
 *
 * @param {boolean} force if we should update it even if the size is not computed as off
 */
const updateCanvasSize = (force) => {
  const canvas = renderer.domElement;

  // get current container size
  const width = threeContainer.clientWidth;
  const height = threeContainer.clientHeight;

  // if container size is not canvas size, window has resized, we need to fix it
  if (force || canvas.width !== width || canvas.height !== height) {
    // set the renderer size
    renderer.setSize(width, height, false);
    // update the camera so it looks the same
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
};

/**
 * Reset the camera when 'r' is pressed.
 */
document.addEventListener("keydown", (evt) => {
  // ignore when typing into scramble field
  if (evt.target.tagName === "INPUT") return;

  if (evt.keyCode === 27) {
    controls.reset();
    camera.position.set(0, 0, 7);
  }
  // Rotate the cube if a move key is pressed
  else if (
    evt.key === "l" ||
    evt.key === "r" ||
    evt.key === "u" ||
    evt.key === "d" ||
    evt.key === "f" ||
    evt.key === "b" ||
    evt.key === "m"
    // evt.key === "x" ||
    // evt.key === "y" ||
    // evt.key === "z"
  ) {
    queueMoves(evt.key.toUpperCase());
    scrambleAI(evt.key.toUpperCase());
  }
  // Capital letters are used for prime moves (in the opposite direction)
  else if (
    evt.key === "L" ||
    evt.key === "R" ||
    evt.key === "U" ||
    evt.key === "D" ||
    evt.key === "F" ||
    evt.key === "B" ||
    evt.key === "M"
    // evt.key === "X" ||
    // evt.key === "Y" ||
    // evt.key === "Z"
  ) {
    queueMoves(evt.key + "'");
    scrambleAI(evt.key + "'");
  } else if (evt.key === "P") {
    cube.printState();
    debug();
  } else if (evt.keyCode === 37) {
    cube.previousMoveInHistory(pivot);
    if (cube.history.length > 0)
      historyCounter.innerHTML =
        cube.history.length - cube.historyIndex - 1 + " moves back in history";
  } else if (evt.keyCode === 39) {
    cube.nextMoveInHistory(pivot);
    if (
      cube.history.length > 0 &&
      cube.historyIndex != cube.history.length - 1
    ) {
      historyCounter.innerHTML =
        cube.history.length - cube.historyIndex - 1 + " moves back in history";
    } else {
      historyCounter.innerHTML = "";
    }
  }
});

const queueMoves = (moves) => {
  cube.queueMoves(moves);
  historyCounter.innerHTML = "";
};

// Input listeners for buttons
document
  .getElementById("random")
  .addEventListener("click", () => (scrambleInput.value = randomScramble(18)));
scrambleButton.addEventListener("click", scrambleCube);
solveButton.addEventListener("click", solve);
speedSelector.addEventListener(
  "change",
  () => (cube.rotationSpeed = parseFloat(speedSelector.value))
);
controlsButton.addEventListener("click", () => {
  solutionMsg.innerHTML = "";
  solutionMsg.innerHTML += "Controls:\n\n";
  solutionMsg.innerHTML += "Basic:\n";
  solutionMsg.innerHTML += "R: Rotates the right face cw\n";
  solutionMsg.innerHTML += "Shift+R: Rotates the right face ccw\n";
  solutionMsg.innerHTML += "L: Rotates the left face cw\n";
  solutionMsg.innerHTML += "Shift+L: Rotates the left face ccw\n";
  solutionMsg.innerHTML += "U: Rotates the up face cw\n";
  solutionMsg.innerHTML += "Shift+U: Rotates the up face ccw\n";
  solutionMsg.innerHTML += "D: Rotates the down face cw\n";
  solutionMsg.innerHTML += "Shift+D: Rotates the down face ccw\n";
  solutionMsg.innerHTML += "F: Rotates the front face cw\n";
  solutionMsg.innerHTML += "Shift+F: Rotates the front face ccw\n";
  solutionMsg.innerHTML += "B: Rotates the back face cw\n";
  solutionMsg.innerHTML += "Shift+B: Rotates the back face ccw\n";
  solutionMsg.innerHTML += "M: Rotates the middle face cw\n";
  solutionMsg.innerHTML +=
    "Shift+M: Rotates the middle face ccw\n\n";
  solutionMsg.innerHTML += "Other:\n";
  solutionMsg.innerHTML += "Esc: Resets the camera\n";
  solutionMsg.innerHTML += "P: Prints the state of the cube (debug)\n";
  solutionMsg.innerHTML += "Arrow keys: Moves through move history\n";
});

/**
 * When the window first loads, begin animating the scene.
 */
window.onload = async () => {
  await init();
  animate();
};
