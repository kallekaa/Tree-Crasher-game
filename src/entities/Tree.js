import * as THREE from 'three';
import { randomRange } from '../utils/MathUtils.js';

export class Tree {
  constructor(x, y, z) {
    this.group = new THREE.Group();
    this.destroyed = false;
    this.collisionRadius = 1.2;

    // Vary tree size slightly
    this.scale = randomRange(0.8, 1.4);

    this.buildMesh();

    this.group.position.set(x, y, z);
    this.group.scale.setScalar(this.scale);

    // Destruction physics
    this.velocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3();

    // Fragments for splitting
    this.fragments = [];
    this.fragmentTime = 0;
  }

  buildMesh() {
    // Trunk
    const trunkHeight = randomRange(3, 5);
    const trunkRadius = randomRange(0.25, 0.4);
    const trunkGeom = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x6b4226,
      roughness: 0.9,
    });
    this.trunk = new THREE.Mesh(trunkGeom, trunkMat);
    this.trunk.position.y = trunkHeight / 2;
    this.trunk.castShadow = true;
    this.group.add(this.trunk);

    // Canopy (layered cones for fuller look)
    const canopyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.3 + randomRange(-0.05, 0.05), 0.7, 0.3),
      roughness: 0.8,
    });

    const canopyLayers = 3;
    for (let i = 0; i < canopyLayers; i++) {
      const radius = randomRange(1.5, 2.5) - i * 0.4;
      const height = randomRange(2, 3);
      const canopyGeom = new THREE.ConeGeometry(radius, height, 8);
      const canopy = new THREE.Mesh(canopyGeom, canopyMat);
      canopy.position.y = trunkHeight + i * 1.2;
      canopy.castShadow = true;
      this.group.add(canopy);
    }

    this.trunkHeight = trunkHeight;
  }

  destroy(carVelocity, carSpeed) {
    if (this.destroyed) return;
    this.destroyed = true;

    const impactForce = carSpeed * 6;

    // Main impulse: car direction + upward
    this.velocity.set(
      carVelocity.x * impactForce,
      impactForce * 0.5 + randomRange(5, 15),
      carVelocity.z * impactForce
    );

    // Angular velocity - spin!
    this.angularVelocity.set(
      randomRange(-3, 3) * (carSpeed / 30),
      randomRange(-2, 2) * (carSpeed / 30),
      randomRange(-3, 3) * (carSpeed / 30)
    );

    // At high speed, split into fragments
    if (carSpeed > 40) {
      this.splitIntoFragments(carVelocity, carSpeed);
    }
  }

  splitIntoFragments(carVelocity, carSpeed) {
    const pos = this.group.position.clone();
    const scale = this.scale;

    // Create 2-3 fragment groups
    const fragmentCount = carSpeed > 70 ? 3 : 2;

    for (let i = 0; i < fragmentCount; i++) {
      const frag = new THREE.Group();

      if (i === 0) {
        // Lower trunk piece
        const geom = new THREE.CylinderGeometry(0.2, 0.35, 2, 6);
        const mat = new THREE.MeshStandardMaterial({ color: 0x6b4226 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        frag.add(mesh);
      } else if (i === 1) {
        // Canopy chunk
        const geom = new THREE.ConeGeometry(1.5, 2.5, 6);
        const mat = new THREE.MeshStandardMaterial({ color: 0x2d7d2d });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.castShadow = true;
        frag.add(mesh);
      } else {
        // Upper trunk + small canopy
        const trunkGeom = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4226 });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.castShadow = true;
        frag.add(trunk);

        const canopyGeom = new THREE.ConeGeometry(1, 1.5, 6);
        const canopyMat = new THREE.MeshStandardMaterial({ color: 0x3a8a3a });
        const canopy = new THREE.Mesh(canopyGeom, canopyMat);
        canopy.position.y = 1.2;
        canopy.castShadow = true;
        frag.add(canopy);
      }

      frag.position.copy(pos);
      frag.position.y += i * 2;
      frag.scale.setScalar(scale);

      const fragData = {
        mesh: frag,
        velocity: new THREE.Vector3(
          carVelocity.x * carSpeed * 4 + randomRange(-10, 10),
          randomRange(8, 25),
          carVelocity.z * carSpeed * 4 + randomRange(-10, 10)
        ),
        angularVelocity: new THREE.Vector3(
          randomRange(-5, 5),
          randomRange(-3, 3),
          randomRange(-5, 5)
        ),
      };

      this.fragments.push(fragData);
    }
  }

  update(dt) {
    if (!this.destroyed) return;

    // Update main body
    if (this.fragments.length === 0) {
      // Gravity
      this.velocity.y -= 25 * dt;

      // Move
      this.group.position.add(this.velocity.clone().multiplyScalar(dt));

      // Rotate
      this.group.rotation.x += this.angularVelocity.x * dt;
      this.group.rotation.y += this.angularVelocity.y * dt;
      this.group.rotation.z += this.angularVelocity.z * dt;
    } else {
      // Hide original
      this.group.visible = false;

      // Update fragments
      this.fragmentTime += dt;
      for (const frag of this.fragments) {
        frag.velocity.y -= 25 * dt;
        frag.mesh.position.add(frag.velocity.clone().multiplyScalar(dt));
        frag.mesh.rotation.x += frag.angularVelocity.x * dt;
        frag.mesh.rotation.y += frag.angularVelocity.y * dt;
        frag.mesh.rotation.z += frag.angularVelocity.z * dt;
      }
    }
  }

  // Check if tree has fallen below ground and can be cleaned up
  isOffscreen() {
    if (this.fragments.length > 0) {
      return this.fragmentTime > 5;
    }
    return this.group.position.y < -20;
  }

  dispose(scene) {
    scene.remove(this.group);
    for (const frag of this.fragments) {
      scene.remove(frag.mesh);
    }
  }

  addToScene(scene) {
    scene.add(this.group);
  }

  addFragmentsToScene(scene) {
    for (const frag of this.fragments) {
      scene.add(frag.mesh);
    }
  }
}
