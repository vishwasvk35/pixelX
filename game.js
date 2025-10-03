// PixelX - 3D Maze Game Logic
// All Three.js functionality, game logic, and jQuery extensions

var camera = undefined,
  scene = undefined,
  renderer = undefined,
  light = undefined,
  maze = undefined,
  mazeMesh = undefined,
  mazeDimension = 11,
  planeMesh = undefined,
  ballMesh = undefined,
  ballRadius = 0.25,
  ballPosition = { x: 1, y: 1 },
  lightIntensity = 1.0,
  lightModes = [0.3, 0.7, 1.0], // dim, medium, bright
  currentLightMode = 2,
  ironTexture = THREE.ImageUtils.loadTexture("/ball.webp"),
  planeTexture = THREE.ImageUtils.loadTexture("/concrete.png"),
  brickTexture = THREE.ImageUtils.loadTexture("/brick.jpg"),
  gameState = undefined;

function initializeGame() {
  // Set initial ball position
  ballPosition = { x: 1, y: 1 };
}

function generate_maze_mesh(field) {
  var dummy = new THREE.Geometry();
  for (var i = 0; i < field.dimension; i++) {
    for (var j = 0; j < field.dimension; j++) {
      if (field[i][j]) {
        var geometry = new THREE.CubeGeometry(1, 1, 1, 1, 1, 1);
        var mesh_ij = new THREE.Mesh(geometry);
        mesh_ij.position.x = i;
        mesh_ij.position.y = j;
        mesh_ij.position.z = 0.5;
        THREE.GeometryUtils.merge(dummy, mesh_ij);
      }
    }
  }
  var material = new THREE.MeshPhongMaterial({ map: brickTexture });
  var mesh = new THREE.Mesh(dummy, material);
  return mesh;
}

function createRenderWorld() {
  // Create the scene object.
  scene = new THREE.Scene();

  // Add the light.
  light = new THREE.PointLight(0xffffff, 1);
  light.position.set(1, 1, 1.3);
  scene.add(light);

  // Add the ball.
  g = new THREE.SphereGeometry(ballRadius, 32, 16);
  m = new THREE.MeshPhongMaterial({ map: ironTexture });
  ballMesh = new THREE.Mesh(g, m);
  ballMesh.position.set(ballPosition.x, ballPosition.y, ballRadius);
  scene.add(ballMesh);

  // Add the camera.
  var aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
  camera.position.set(1, 1, 5);
  scene.add(camera);

  // Add the maze.
  mazeMesh = generate_maze_mesh(maze);
  scene.add(mazeMesh);

  // Add the ground.
  g = new THREE.PlaneGeometry(
    mazeDimension * 10,
    mazeDimension * 10,
    mazeDimension,
    mazeDimension
  );
  planeTexture.wrapS = planeTexture.wrapT = THREE.RepeatWrapping;
  planeTexture.repeat.set(mazeDimension * 5, mazeDimension * 5);
  m = new THREE.MeshPhongMaterial({ map: planeTexture });
  planeMesh = new THREE.Mesh(g, m);
  planeMesh.position.set((mazeDimension - 1) / 2, (mazeDimension - 1) / 2, 0);
  planeMesh.rotation.set(Math.PI / 2, 0, 0);
  scene.add(planeMesh);
}

function toggleLighting() {
  currentLightMode = (currentLightMode + 1) % lightModes.length;
  lightIntensity = lightModes[currentLightMode];
  light.intensity = lightIntensity;
}

function changeBallPosition() {
  // Find all valid positions (not walls)
  var validPositions = [];
  for (var i = 0; i < maze.dimension; i++) {
    for (var j = 0; j < maze.dimension; j++) {
      if (!maze[i][j]) {
        // false means it's a path, not a wall
        validPositions.push({ x: i, y: j });
      }
    }
  }

  // Choose random valid position
  if (validPositions.length > 0) {
    var randomIndex = Math.floor(Math.random() * validPositions.length);
    ballPosition = validPositions[randomIndex];

    // Update ball mesh position immediately
    ballMesh.position.x = ballPosition.x;
    ballMesh.position.y = ballPosition.y;
    ballMesh.position.z = ballRadius;
  }
}

function updateRenderWorld() {
  // Keep ball at static position (no physics updates needed)
  // Ball position is updated directly in changeBallPosition()

  // Update camera to follow ball (smooth camera movement)
  camera.position.x += (ballMesh.position.x - camera.position.x) * 0.1;
  camera.position.y += (ballMesh.position.y - camera.position.y) * 0.1;
  camera.position.z += (5 - camera.position.z) * 0.1;

  // Update light position to follow camera
  light.position.x = camera.position.x;
  light.position.y = camera.position.y;
  light.position.z = camera.position.z - 3.7;
}

function gameLoop() {
  switch (gameState) {
    case "initialize":
      maze = generateSquareMaze(mazeDimension);
      maze[mazeDimension - 1][mazeDimension - 2] = false;
      initializeGame();
      createRenderWorld();
      camera.position.set(ballPosition.x, ballPosition.y, 5);
      light.position.set(ballPosition.x, ballPosition.y, 1.3);
      light.intensity = 0;
      $("#level").html("PixelX");
      gameState = "fade in";
      break;

    case "fade in":
      light.intensity += 0.1 * (lightIntensity - light.intensity);
      renderer.render(scene, camera);
      if (Math.abs(light.intensity - lightIntensity) < 0.05) {
        light.intensity = lightIntensity;
        gameState = "play";
      }
      break;

    case "play":
      updateRenderWorld();
      renderer.render(scene, camera);
      break;
  }

  requestAnimationFrame(gameLoop);
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

// jQuery Extensions
jQuery.fn.centerv = function () {
  wh = window.innerHeight;
  h = this.outerHeight();
  this.css("position", "absolute");
  this.css("top", Math.max(0, (wh - h) / 2) + "px");
  return this;
};

jQuery.fn.centerh = function () {
  ww = window.innerWidth;
  w = this.outerWidth();
  this.css("position", "absolute");
  this.css("left", Math.max(0, (ww - w) / 2) + "px");
  return this;
};

jQuery.fn.center = function () {
  this.centerv();
  this.centerh();
  return this;
};

// Game Initialization and Event Handling
$(document).ready(function () {
  // Prepare the instructions.
  $("#instructions").center();
  $("#instructions").hide();

  // Native keyboard handling for 'i' key
  var isInstructionsVisible = false;
  $(document).keydown(function (e) {
    if (e.which === 73) {
      // 'i' key
      if (!isInstructionsVisible) {
        $("#instructions").show();
        isInstructionsVisible = true;
      }
    }
  });

  $(document).keyup(function (e) {
    if (e.which === 73) {
      // 'i' key
      $("#instructions").hide();
      isInstructionsVisible = false;
    }
  });

  // Create the renderer.
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Bind button events and resize
  $("#lightToggle").click(toggleLighting);
  $("#positionChange").click(changeBallPosition);
  $(window).resize(onResize);

  // Set the initial game state.
  gameState = "initialize";

  // Start the game loop.
  requestAnimationFrame(gameLoop);
});
