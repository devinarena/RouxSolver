import Cubie from "./cubie";
import { Group, Mesh } from "three";

function Cube() {
  this.cube = [];
  this.moves = [];
  this.history = [];
  this.historyIndex = 0;
  this.rotationDirection = "";
  this.rotationInverted = 1;
  this.rotationDoubled = false;
  this.rotatedAmount = 0;
  this.rotateGroup = new Group();
  this.rotationSpeed = 2;
  this.faceColors = {};

  /**
   * Updates the cube by rotating it if necessary.
   *
   * @param {Group} pivot to contain the cubies.
   * @param {number} delta delta time, to keep movement real-time.
   */
  this.update = (pivot, delta) => {
    if (this.rotateGroup.children.length > 0) {
      const rotationDirection = this.rotationDirection.toLowerCase()[0];
      // Rotate on the proper axis for each type of move
      if (rotationDirection === "l" || rotationDirection === "m")
        this.rotateGroup.rotateX(
          Math.PI * this.rotationSpeed * this.rotationInverted * delta
        );
      if (rotationDirection === "r" || rotationDirection === "x")
        this.rotateGroup.rotateX(
          -Math.PI * this.rotationSpeed * this.rotationInverted * delta
        );
      if (rotationDirection === "u" || rotationDirection === "y")
        this.rotateGroup.rotateY(
          -Math.PI * this.rotationSpeed * this.rotationInverted * delta
        );
      if (rotationDirection === "d")
        this.rotateGroup.rotateY(
          Math.PI * this.rotationSpeed * this.rotationInverted * delta
        );
      if (rotationDirection === "f" || rotationDirection === "z")
        this.rotateGroup.rotateZ(
          -Math.PI * this.rotationSpeed * this.rotationInverted * delta
        );
      if (rotationDirection === "b")
        this.rotateGroup.rotateZ(
          Math.PI * this.rotationSpeed * this.rotationInverted * delta
        );
      this.rotatedAmount += Math.PI * this.rotationSpeed * delta;
      // if we've hit the proper rotation (90 degrees)
      if (this.rotatedAmount >= (Math.PI / 2) * (this.rotationDoubled + 1)) {
        // clamp rotation values to nearest 90 degree
        let x =
          Math.round(this.rotateGroup.rotation.x / (Math.PI / 2)) *
          (Math.PI / 2);
        let y =
          Math.round(this.rotateGroup.rotation.y / (Math.PI / 2)) *
          (Math.PI / 2);
        let z =
          Math.round(this.rotateGroup.rotation.z / (Math.PI / 2)) *
          (Math.PI / 2);
        this.rotateGroup.rotation.set(x, y, z);
        // remove the rotate group so we can add the cubies back to the pivot
        pivot.remove(this.rotateGroup);
        let cubies = [];
        // grab each cubie from the rotation group
        this.rotateGroup.traverse((cubie) => {
          if (cubie instanceof Mesh) {
            cubies.push(cubie);
          }
        });
        // re-add the cubie to the pivot
        cubies.forEach((cubie) => {
          pivot.attach(cubie);
        });
        // reset the rotation group for the next move
        this.rotateGroup.rotation.set(0, 0, 0);
        this.rotateGroup.clear();
      }
    } else {
      // if we have moves in the moves queue
      if (this.moves.length > 0) {
        // rotate from the queue first move in the queue
        this.rotate(pivot, this.moves[0]);
        // remove the first move from the queue
        this.moves.splice(0, 1);
      }
    }
  };

  /**
   * Initializes the cube by adding 26 cubies to the cube array.
   *
   * @param {Group} pivot to contain the cubies
   */
  this.setupCube = (pivot) => {
    // for loop order doesn't matter but I like going from top down and accross
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        for (let k = 1; k >= -1; k--) {
          // we don't need a middle cubie, its not visible
          if (i === 0 && j === 0 && k === 0) continue;
          // add each cubie with a little bit of space in between
          let cubie = new Cubie(i * 1.05, j * 1.05, k * 1.05);
          this.cube.push(cubie);
          // add cubie to the pivot group
          pivot.attach(cubie.getCube());
        }
      }
    }
  };

  /**
   * Queues moves from a move string. String format must be: R U R2 U'
   *
   * @param {String} moves the moves to add to the queue.
   */
  this.queueMoves = (moves) => {
    if (!moves.includes(" ")) moves += " ";
    // Move strings are split by spaces, each move is a space
    // truncate history after the current history index
    this.history = this.history.slice(0, this.historyIndex + 1);
    moves.split(" ").forEach((move) => {
      if (move.length === 0) return; // skip empty strings
      // add to history
      this.history.push(move);
      this.moves.push(move);
    });
    this.historyIndex = this.history.length - 1;
  };

  /**
   * Queues moves in reverse from a move string. String format must be: R U R2 U'
   *
   * @param {String} moves the moves to add to the queue in forwards order.
   */
  this.queueMovesReversed = (moves) => {
    let out = "";
    // for each move in the move string
    // truncate history after the current history index
    this.history = this.history.slice(0, this.historyIndex + 1);
    moves.split(" ").forEach((move) => {
      if (move.length === 0) return; // skip empty strings
      // flip the moves (add or remove a prime)
      move = flipMove(move);
      // add the move to history
      this.history.push(move);
      // create a reversed output string
      out = move + " " + out;
    });
    // add the moves to the move queue
    this.queueMoves(out.trim());
    this.historyIndex = this.history.length - 1;
  };

  /**
   * Flips a move (add or remove prime)
   *
   * @param {String} move the move to flip
   * @returns {String} the flipped move, either added or removed prime
   */
  this.flipMove = (move) => {
    if (move.endsWith("'")) move = move.substring(move, move.length - 1);
    else move += "'";
    return move;
  };

  /**
   * Moves to the next-most recent move in history and executes it.
   *
   * @returns {String} the next (MORE RECENT) move in the history.
   */
  this.nextMoveInHistory = (pivot) => {
    if (this.inProgress()) return;
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    const move = this.history[this.historyIndex];
    this.rotate(pivot, move);
    return move;
  };

  /**
   * Moves to the previous-most recent move in history and executes it.
   *
   * @returns {String} the previous (LESS RECENT) move in the history.
   */
  this.previousMoveInHistory = (pivot) => {
    if (this.inProgress()) return;
    if (this.historyIndex < 0 || this.history.length === 0) return;
    const move = this.flipMove(this.history[this.historyIndex]);
    this.rotate(pivot, move);
    this.historyIndex--;
    return move;
  };

  /**
   * Getter for if the cube is currently rotating (move queue is not empty).
   *
   * @returns {boolean} true if the move queue contains moves, false otherwise.
   */
  this.inProgress = () => {
    return this.moves.length > 0 || this.rotateGroup.children.length > 0;
  };

  /**
   * Rotates a face of the cube like a real speed cube.
   *
   * @param {Object3D} pivot the global pivot to use
   * @param {String} move a directional code (R, L, U, D, B, F)
   * @returns true if the rotation was successful, false otherwise
   */
  this.rotate = (pivot, move) => {
    // if we're currently rotating stop
    if (this.rotateGroup.children.length != 0) return false;
    this.rotationDirection = move;
    const inverted = move.endsWith("'");
    this.rotationInverted = inverted ? -1 : 1;
    this.rotationDoubled = move.includes("2");
    this.rotatedAmount = 0;
    // this just adds the proper cubies to the rotation group depending on the move
    if (this.rotationDirection[0] === "L") {
      this.cube.forEach((cubie) => {
        if (cubie.getCube().position.x <= -1.03) {
          cubie.rotate("x", !inverted);
          this.rotateGroup.add(cubie.getCube());
          pivot.remove(cubie.getCube());
        }
      });
    } else if (this.rotationDirection[0] === "R") {
      this.cube.forEach((cubie) => {
        if (cubie.getCube().position.x >= 1.03) {
          cubie.rotate("x", inverted);
          this.rotateGroup.add(cubie.getCube());
          pivot.remove(cubie.getCube());
        }
      });
    } else if (this.rotationDirection[0] === "r") {
      this.cube.forEach((cubie) => {
        if (cubie.getCube().position.x >= -0.01) {
          cubie.rotate("x", inverted);
          this.rotateGroup.add(cubie.getCube());
          pivot.remove(cubie.getCube());
        }
      });
    } else if (this.rotationDirection[0] === "U") {
      this.cube.forEach((cubie) => {
        if (cubie.getCube().position.y >= 1.03) {
          cubie.rotate("y", !inverted);
          this.rotateGroup.add(cubie.getCube());
          pivot.remove(cubie.getCube());
        }
      });
    } else if (this.rotationDirection[0] === "D") {
      this.cube.forEach((cubie) => {
        if (cubie.getCube().position.y <= -1.03) {
          cubie.rotate("y", inverted);
          this.rotateGroup.add(cubie.getCube());
          pivot.remove(cubie.getCube());
        }
      });
    } else if (this.rotationDirection[0] === "F") {
      this.cube.forEach((cubie) => {
        if (cubie.getCube().position.z >= 1.03) {
          cubie.rotate("z", !inverted);
          this.rotateGroup.add(cubie.getCube());
          pivot.remove(cubie.getCube());
        }
      });
    } else if (this.rotationDirection[0] === "B") {
      this.cube.forEach((cubie) => {
        if (cubie.getCube().position.z <= -1.03) {
          cubie.rotate("z", inverted);
          this.rotateGroup.add(cubie.getCube());
          pivot.remove(cubie.getCube());
        }
      });
    } else if (this.rotationDirection[0] === "M") {
      this.cube.forEach((cubie) => {
        if (cubie.getCube().position.x > -1 && cubie.getCube().position.x < 1) {
          cubie.rotate("x", !inverted);
          this.rotateGroup.add(cubie.getCube());
          pivot.remove(cubie.getCube());
        }
      });
    }
    // These groups rotate the entire cube in a direction
    else if (this.rotationDirection[0] === "X") {
      this.cube.forEach((cubie) => {
        cubie.rotate("x", inverted);
        this.rotateGroup.add(cubie.getCube());
        pivot.remove(cubie.getCube());
      });
    } else if (this.rotationDirection[0] === "Y") {
      this.cube.forEach((cubie) => {
        cubie.rotate("y", !inverted);
        this.rotateGroup.add(cubie.getCube());
        pivot.remove(cubie.getCube());
      });
    } else if (this.rotationDirection[0] === "Z") {
      this.cube.forEach((cubie) => {
        cubie.rotate("z", !inverted);
        this.rotateGroup.add(cubie.getCube());
        pivot.remove(cubie.getCube());
      });
    }
    pivot.add(this.rotateGroup);
    return true;
  };

  /**
   * Kinda legacy, was mainly used for the original project idea.
   *
   * Used in the console to print the current state of a cube,
   * makes it easy for me to generate scrambled state JSON.
   */
  this.printState = () => {
    let out = "";
    let cubies = [];
    for (let cubie of this.cube) {
      // generate an ID from 0-26 based on original generation of cube
      let x = Math.round(cubie.getCube().position.x);
      let y = Math.round(cubie.getCube().position.y);
      let z = Math.round(cubie.getCube().position.z);
      let index = 9 * (x + 1) + (3 * (1 - y) + (1 - z));
      if (index >= 14) index--; // because we have no middle cubie
      cubies[index] = JSON.stringify(cubie.getFaces());
    }
    // concat onto output string
    for (let cubie of cubies) {
      out += cubie + ",";
    }
    // print so i can copy and paste
    console.log(out.substring(out, out.length - 1));
    // TODO: maybe eventually just save the JSON to a file?
  };
}

export default Cube;
