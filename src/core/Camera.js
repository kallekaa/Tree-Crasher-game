import * as THREE from 'three';
import { dampedLerp } from '../utils/MathUtils.js';

export class Camera {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 8, 15);

    this.followDistance = 14;
    this.followHeight = 7;
    this.lookAheadDistance = 25;
    this.smoothing = 5;

    this.baseFov = 65;
    this.maxFov = 85;

    // Shake state
    this.shakeIntensity = 0;
    this.shakeTime = 0;
    this.shakeDecay = 8;

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  shake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = 0;
  }

  update(dt, carPosition, carHeading, carSpeed, maxSpeed) {
    // Chase camera position
    const offsetX = -Math.sin(carHeading) * this.followDistance;
    const offsetZ = -Math.cos(carHeading) * this.followDistance;

    const desiredX = carPosition.x + offsetX;
    const desiredY = carPosition.y + this.followHeight;
    const desiredZ = carPosition.z + offsetZ;

    this.camera.position.x = dampedLerp(this.camera.position.x, desiredX, this.smoothing, dt);
    this.camera.position.y = dampedLerp(this.camera.position.y, desiredY, this.smoothing, dt);
    this.camera.position.z = dampedLerp(this.camera.position.z, desiredZ, this.smoothing, dt);

    // Look ahead of car
    const lookX = carPosition.x + Math.sin(carHeading) * this.lookAheadDistance;
    const lookY = carPosition.y + 1;
    const lookZ = carPosition.z + Math.cos(carHeading) * this.lookAheadDistance;
    this.camera.lookAt(lookX, lookY, lookZ);

    // FOV increase at high speed
    const speedRatio = Math.abs(carSpeed) / maxSpeed;
    this.camera.fov = this.baseFov + (this.maxFov - this.baseFov) * speedRatio * speedRatio;
    this.camera.updateProjectionMatrix();

    // Camera shake
    if (this.shakeIntensity > 0.01) {
      this.shakeTime += dt;
      const decay = Math.exp(-this.shakeDecay * this.shakeTime);
      const shakeX = Math.sin(this.shakeTime * 40) * this.shakeIntensity * decay;
      const shakeY = Math.cos(this.shakeTime * 35) * this.shakeIntensity * decay * 0.7;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;

      if (decay < 0.01) {
        this.shakeIntensity = 0;
      }
    }
  }
}
