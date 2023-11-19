import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const sizes = {
  width: innerWidth,
  height: innerHeight,
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.set(2, 3, 8);
scene.add(camera);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.castShadow = true;
light.position.y = 3;
light.position.z = 1;
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

class Box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color,
    velocity = {
      x: 0,
      y: 0,
      z: 0,
    },
    position = {
      x: 0,
      y: 0,
      z: 0,
    },
    zAcceleration = false,
  }) {
    super(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color })
    );

    this.width = width;
    this.height = height;
    this.depth = depth;

    this.position.set(position.x, position.y, position.z);

    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;

    this.velocity = velocity;
    this.gravity = -0.002;

    this.zAcceleration = zAcceleration;
  }

  updateSides() {
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }

  update(ground) {
    this.updateSides();

    if (this.zAcceleration) {
      this.velocity.z += 0.0005;
    }

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    if (
      isBoxBorderTouch({
        box1: this,
        box2: ground,
      })
    ) {
      this.velocity.y *= 0.6;
      this.velocity.y = -this.velocity.y;
    } else {
      this.position.y += this.velocity.y;
    }
  }
}

function isBoxBorderTouch({ box1, box2 }) {
  const xBorder = box1.right >= box2.left && box1.left <= box2.right;
  const zBorder = box1.front >= box2.back && box1.back <= box2.front;
  const yBorder =
    box1.top >= box2.bottom && box1.bottom + box1.velocity.y <= box2.top;

  return xBorder && zBorder && yBorder;
}

function isFallDown({ box1, box2 }) {
  const xBorder = box1.right >= box2.left && box1.left <= box2.right;
  const zBorder = box1.front >= box2.back && box1.back <= box2.front;

  return xBorder && zBorder;
}

const cube = new Box({
  width: 1,
  height: 1,
  depth: 1,
  color: 0x64e224,
  velocity: {
    x: 0,
    y: -0.05,
    z: 0,
  },
});
cube.castShadow = true;
scene.add(cube);

const ground = new Box({
  width: 10,
  height: 0.5,
  depth: 50,
  color: 0x1877CA,
  position: {
    x: 0,
    y: -2,
    z: 0,
  },
});
ground.receiveShadow = true;
scene.add(ground);

const canvas = document.querySelector(".canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.setSize(sizes.width, sizes.height);

const controls = new OrbitControls(camera, renderer.domElement);

const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  w: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
};

window.addEventListener("keypress", (event) => {
  switch (event.code) {
    case "KeyA": {
      keys.a.pressed = true;
      break;
    }
    case "KeyD": {
      keys.d.pressed = true;
      break;
    }
    case "KeyW": {
      keys.w.pressed = true;
      break;
    }
    case "KeyS": {
      keys.s.pressed = true;
      break;
    }
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyA": {
      keys.a.pressed = false;
      break;
    }
    case "KeyD": {
      keys.d.pressed = false;
      break;
    }
    case "KeyW": {
      keys.w.pressed = false;
      break;
    }
    case "KeyS": {
      keys.s.pressed = false;
      break;
    }
  }
});

const enemies = [];

let frames = 0;
let spawnSpeed = 200;
let counter = 0;
function animate() {
  const animationId = requestAnimationFrame(animate);
  renderer.render(scene, camera);

  cube.velocity.x = 0;
  cube.velocity.z = 0;
  if (keys.a.pressed) {
    cube.velocity.x = -0.08;
  }
  if (keys.d.pressed) {
    cube.velocity.x = 0.08;
  }
  if (keys.w.pressed) {
    cube.velocity.z = -0.08;
  }
  if (keys.s.pressed) {
    cube.velocity.z = 0.08;
  }

  cube.update(ground);
  enemies.forEach((enemy) => {
    enemy.update(ground);
    if (
      isBoxBorderTouch({
        box1: cube,
        box2: enemy,
      })
    ) {
      document.querySelector(".game-over").style.display = "flex";
      window.cancelAnimationFrame(animationId);
    }
  });
  if (
    !isFallDown({
      box1: cube,
      box2: ground,
    })
  ) {
    document.querySelector(".game-over").style.display = "flex";

    document.addEventListener("keydown", (event) => {
      if (
        event.code === "KeyA" ||
        event.code === "KeyD" ||
        event.code === "KeyW" ||
        event.code === "KeyS"
      ) {
        event.preventDefault();
        return false;
      }
    });
  }

  if (cube.top < -8) {
    window.cancelAnimationFrame(animationId);
  }

  if (frames % spawnSpeed === 0) {
    if (frames % 200 === 0 && spawnSpeed > 20) {
      spawnSpeed -= 20;
    }
    const enemy = new Box({
      width: 1,
      height: 1,
      depth: 1,
      color: "red",
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: -25,
      },
      velocity: {
        x: 0,
        y: 0,
        z: 0.003,
      },
      zAcceleration: true,
    });
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
  }

  if (frames % 100 === 0) {
    counter++;
  }

  frames++;
  document.querySelector(".time").innerHTML = counter;
  document.querySelector(".total").innerHTML = `Total Score: ${counter}`;
}

document.querySelector(".start").onclick = function () {
  document.querySelector(".game-start").style.display = "none";
  document.querySelector(".rules").style.fontSize = "15px";
  animate();
};

document.querySelector(".reload").onclick = function () {
  location.reload();
};
