import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Cube from "./cube";
import * as state from "./state";
import { startAI, scrambleAI } from "./ai/ai";
import { randomScramble, checkScramble } from "./ai/algorithms";
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
const scrambleInput = document.getElementById("scramble");
const scrambleButton = document.getElementById("scramblebutton");
const solveButton = document.getElementById("solve");

let solutionMsg = document.getElementById("solution-msg");

// Use a pivot so we can rotate the entire cube
const pivot = new THREE.Group();

// initialize renderer and camera controller
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

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
  let valid = checkScramble(scrambleInput.value.trim());
  if (!valid) {
    console.log(valid);
    solutionMsg.innerHTML = "Invalid scramble provided";
    return;
  }

  if (running) return;
  running = true;
  scrambleButton.disabled = true;
  solveButton.disabled = true;

  scramble = scrambleInput.value.trim();
  console.log(scramble);
  scrambleAI(scramble);
  cube.queueMoves(scramble);
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

  running = true;
  scrambleButton.disabled = true;
  solveButton.disabled = true;

  solutionMsg.innerHTML = "Generating solution...";

  const { FB, SB, CMLL, LSE } = startAI(cube);
  cube.queueMoves(FB);
  cube.queueMoves(SB);
  cube.queueMoves(CMLL);
  cube.queueMoves(LSE);

  solutionMsg.innerHTML = `${FB} // FB\n${SB} // SB\n${CMLL} // CMLL\n${LSE} // LSE`;

  running = false;
  scrambleButton.disabled = false;
  solveButton.disabled = false;
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
document.addEventListener("keypress", (evt) => {
  if (evt.key === "Esc") {
    controls.reset();
    camera.position.set(0, 0, 7);
  }
  // Rotate the cube if a move key is pressed
  if (
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
    cube.rotate(pivot, evt.key.toUpperCase());
    scrambleAI(evt.key.toUpperCase());
  }
  // Capital letters are used for prime moves (in the opposite direction)
  if (
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
    cube.rotate(pivot, evt.key + "'");
    scrambleAI(evt.key + "'");
  }

  if (evt.key === "P") {
    cube.printState();
  }
});

document
  .getElementById("random")
  .addEventListener("click", () => (scrambleInput.value = randomScramble(18)));
scrambleButton.addEventListener("click", scrambleCube);
solveButton.addEventListener("click", solve);

/**
 * When the window first loads, begin animating the scene.
 */
window.onload = async () => {
  await init();
  animate();
};
