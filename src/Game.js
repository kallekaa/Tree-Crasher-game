import * as THREE from 'three';
import { Renderer } from './core/Renderer.js';
import { Camera } from './core/Camera.js';
import { InputManager } from './core/InputManager.js';
import { TrackGenerator } from './track/TrackGenerator.js';
import { TrackMesh } from './track/TrackMesh.js';
import { Car } from './entities/Car.js';
import { TreeManager } from './entities/TreeManager.js';
import { CollisionHandler } from './physics/CollisionHandler.js';
import { ParticleSystem } from './effects/ParticleSystem.js';
import { ScorePopup } from './effects/ScorePopup.js';
import { HUD } from './ui/HUD.js';
import { AudioManager } from './audio/AudioManager.js';

const STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  RESULTS: 'results',
};

export class Game {
  constructor() {
    this.state = STATE.MENU;
    this.scene = new THREE.Scene();
    this.input = new InputManager();

    // Renderer
    const container = document.getElementById('game-container');
    this.renderer = new Renderer(container);

    // Camera
    this.cameraController = new Camera();
    this.camera = this.cameraController.camera;

    // Track
    this.trackGenerator = new TrackGenerator();
    this.trackGenerator.generate();
    this.trackMesh = new TrackMesh(this.trackGenerator);

    // Car
    this.car = new Car();

    // Trees
    this.treeManager = new TreeManager(this.trackGenerator);

    // Effects
    this.particles = null;
    this.scorePopup = new ScorePopup();

    // HUD
    this.hud = new HUD();

    // Audio
    this.audio = new AudioManager();

    // Collision
    this.collision = null;

    // Slow motion
    this.timeScale = 1;
    this.slowMoTimer = 0;

    // Screen elements
    this.menuScreen = document.getElementById('menu-screen');
    this.resultsScreen = document.getElementById('results-screen');

    // Initial setup
    this.setupScene();
    this.setupLighting();

    // Clock
    this.clock = new THREE.Clock();
    this.lastTime = 0;

    // Initial destroyed count for tracking new hits
    this.initialTreeCount = 0;
  }

  setupScene() {
    // Sky color
    this.scene.background = new THREE.Color(0x87CEEB);

    // Fog
    this.scene.fog = new THREE.Fog(0x87CEEB, 80, 250);

    // Build track
    this.trackMesh.build(this.scene);

    // Add car
    this.scene.add(this.car.group);

    // Generate trees
    this.treeManager.generate(this.scene);

    // Particles
    this.particles = new ParticleSystem(this.scene);

    // Collision handler
    this.collision = new CollisionHandler(this.car, this.treeManager, (tree, carSpeed) => {
      this.onTreeHit(tree, carSpeed);
    });
  }

  setupLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    // Directional (sun)
    const sun = new THREE.DirectionalLight(0xfff5e6, 1.2);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    this.sun = sun;
    this.scene.add(sun);

    // Hemisphere light for natural feel
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x2d7d2d, 0.3);
    this.scene.add(hemi);
  }

  onTreeHit(tree, carSpeed) {
    // Scoring
    const result = this.hud.addHit(carSpeed, this.car.maxSpeed);

    // Particles
    this.particles.burst(tree.group.position, carSpeed);

    // Camera shake
    const shakeAmount = Math.min(carSpeed / this.car.maxSpeed * 1.5, 1.5);
    this.cameraController.shake(shakeAmount);

    // Score popup
    const screenPos = this.scorePopup.worldToScreen(tree.group.position, this.camera);
    this.scorePopup.show(screenPos.x, screenPos.y, result.points, result.comboMultiplier > 1);

    // Audio
    this.audio.playCrash(carSpeed / this.car.maxSpeed);
    this.audio.playScore();

    // Slow motion on big hits
    if (carSpeed > 60) {
      this.timeScale = 0.3;
      this.slowMoTimer = 0.2;
    }
  }

  startGame() {
    this.state = STATE.PLAYING;
    this.menuScreen.classList.add('hidden');
    this.resultsScreen.classList.add('hidden');
    this.hud.show();

    // Reset everything
    this.car.reset();
    this.treeManager.reset(this.scene);
    this.particles.reset();
    this.hud.reset();

    // Regenerate track and trees
    this.trackGenerator.generate();
    this.treeManager.generate(this.scene);

    // Recreate collision handler
    this.collision = new CollisionHandler(this.car, this.treeManager, (tree, carSpeed) => {
      this.onTreeHit(tree, carSpeed);
    });

    this.initialTreeCount = this.treeManager.trees.length;

    // Start engine sound
    this.audio.startEngine();
  }

  showResults() {
    this.state = STATE.RESULTS;
    this.hud.hide();
    this.resultsScreen.classList.remove('hidden');

    document.getElementById('final-score').textContent = this.hud.score;
    document.getElementById('final-trees').textContent = this.hud.treesDestroyed;
    document.getElementById('final-speed').textContent = Math.round(this.car.topSpeed) + ' km/h';
    document.getElementById('final-combo').textContent = 'x' + this.hud.maxCombo;

    this.audio.stopEngine();
  }

  applyTrackBoundary(dt) {
    // Find approximate nearest point on track
    const carPos = this.car.position;
    const progress = this.trackGenerator.getProgressFromZ(carPos.z);
    const trackPoint = this.trackGenerator.getPointAt(Math.max(0.001, Math.min(0.999, progress)));

    const dx = carPos.x - trackPoint.x;
    const dz = carPos.z - trackPoint.z;
    const distFromTrack = Math.sqrt(dx * dx + dz * dz);

    // Allow 25 units of freedom, then start pulling back
    const maxDist = 25;
    if (distFromTrack > maxDist) {
      const pullStrength = (distFromTrack - maxDist) * 2.0 * dt;
      const dirX = dx / distFromTrack;
      const dirZ = dz / distFromTrack;
      carPos.x -= dirX * pullStrength;
      carPos.z -= dirZ * pullStrength;
    }
  }

  update() {
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05); // Cap delta

    // Slow motion handling
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= rawDt;
      if (this.slowMoTimer <= 0) {
        this.timeScale = 1;
      }
    }

    const scaledDt = dt * this.timeScale;

    switch (this.state) {
      case STATE.MENU:
        if (this.input.enter) {
          this.startGame();
        }
        // Slowly rotate camera for menu
        this.camera.position.set(
          Math.sin(performance.now() * 0.0003) * 30,
          15,
          Math.cos(performance.now() * 0.0003) * 30 - 50
        );
        this.camera.lookAt(0, 0, -50);
        break;

      case STATE.PLAYING:
        // Update car
        this.car.update(scaledDt, this.input);

        // Soft boundary: gently push car back toward track
        this.applyTrackBoundary(scaledDt);

        // Check collisions
        this.collision.update();

        // Update trees
        this.treeManager.update(scaledDt, this.scene);

        // Update particles
        this.particles.update(scaledDt);

        // Update camera
        this.cameraController.update(
          scaledDt,
          this.car.position,
          this.car.heading,
          this.car.speed,
          this.car.maxSpeed
        );

        // Move shadow camera with car
        this.sun.position.set(
          this.car.position.x + 50,
          80,
          this.car.position.z + 30
        );
        this.sun.target.position.copy(this.car.position);
        this.sun.target.updateMatrixWorld();

        // Update HUD
        const progress = this.trackGenerator.getProgressFromZ(this.car.position.z);
        this.hud.update(this.car.speedKmh, progress);

        // Update engine sound
        this.audio.updateEngine(Math.abs(this.car.speed) / this.car.maxSpeed);

        // Check finish
        if (progress >= 1) {
          this.showResults();
        }
        break;

      case STATE.RESULTS:
        if (this.input.enter) {
          this.startGame();
        }
        break;
    }

    this.input.clearJustPressed();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    this.update();
    this.render();
  }

  start() {
    this.loop();
  }
}
