import * as THREE from 'three';
import { clamp } from '../utils/MathUtils.js';

export class Car {
  constructor() {
    this.group = new THREE.Group();
    this.buildMesh();

    // Physics
    this.position = new THREE.Vector3(0, 0.5, -5);
    this.heading = Math.PI; // Face -Z direction (track runs from z=0 to z=-800)
    this.speed = 0;
    this.steerAngle = 0;

    // Tuning
    this.acceleration = 25;
    this.brakeForce = 40;
    this.maxSpeed = 50;
    this.maxReverseSpeed = 10;
    this.drag = 0.4;
    this.steerSpeed = 2.5;
    this.steerDecay = 0.90;
    this.collisionRadius = 2.0;

    // Stats
    this.topSpeed = 0;

    this.group.position.copy(this.position);
  }

  buildMesh() {
    // Car body
    const bodyGeom = new THREE.BoxGeometry(2.2, 0.8, 4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      metalness: 0.6,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    this.group.add(body);

    // Cabin (smaller box on top)
    const cabinGeom = new THREE.BoxGeometry(1.8, 0.7, 2);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x222244,
      metalness: 0.8,
      roughness: 0.2,
    });
    const cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(0, 1.3, -0.3);
    cabin.castShadow = true;
    this.group.add(cabin);

    // Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const wheelPositions = [
      [-1.1, 0.35, 1.2],
      [1.1, 0.35, 1.2],
      [-1.1, 0.35, -1.2],
      [1.1, 0.35, -1.2],
    ];

    this.wheels = [];
    for (const [x, y, z] of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      this.group.add(wheel);
      this.wheels.push(wheel);
    }

    // Headlights
    const lightGeom = new THREE.SphereGeometry(0.15, 8, 8);
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xffffaa,
      emissive: 0xffffaa,
      emissiveIntensity: 0.5,
    });
    for (const x of [-0.7, 0.7]) {
      const light = new THREE.Mesh(lightGeom, lightMat);
      light.position.set(x, 0.6, 2.0);
      this.group.add(light);
    }
  }

  get forwardVector() {
    return new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
  }

  get frontPosition() {
    return this.position.clone().add(this.forwardVector.multiplyScalar(2.2));
  }

  get speedKmh() {
    return Math.abs(this.speed) * 3.6;
  }

  update(dt, input) {
    // Acceleration / braking
    if (input.forward) {
      this.speed += this.acceleration * dt;
    } else if (input.brake) {
      this.speed -= this.brakeForce * dt;
    }

    // Drag
    this.speed *= (1 - this.drag * dt);
    this.speed = clamp(this.speed, -this.maxReverseSpeed, this.maxSpeed);

    // Steering
    if (input.left) this.steerAngle += this.steerSpeed * dt;
    if (input.right) this.steerAngle -= this.steerSpeed * dt;

    // Steer decay
    this.steerAngle *= this.steerDecay;

    // Turn rate scales with speed (low speed = gentle turns)
    const speedFactor = Math.min(Math.abs(this.speed) / 25, 1);
    const turnRate = this.steerAngle * speedFactor;
    this.heading += turnRate * dt;

    // Move
    this.position.x += Math.sin(this.heading) * this.speed * dt;
    this.position.z += Math.cos(this.heading) * this.speed * dt;

    // Keep above ground
    this.position.y = Math.max(0.5, this.position.y);

    // Update mesh
    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;

    // Visual lean on turns
    this.group.rotation.z = -this.steerAngle * 0.15;

    // Spin wheels
    const wheelSpin = this.speed * dt * 2;
    for (const wheel of this.wheels) {
      wheel.rotation.x += wheelSpin;
    }

    // Track top speed
    if (this.speedKmh > this.topSpeed) {
      this.topSpeed = this.speedKmh;
    }
  }

  applyImpactSlowdown(factor = 0.85) {
    this.speed *= factor;
  }

  reset() {
    this.position.set(0, 0.5, -5);
    this.heading = Math.PI;
    this.speed = 0;
    this.steerAngle = 0;
    this.topSpeed = 0;
    this.group.position.copy(this.position);
    this.group.rotation.set(0, 0, 0);
  }
}
