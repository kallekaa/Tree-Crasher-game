import * as THREE from 'three';
import { randomRange } from '../utils/MathUtils.js';

class Particle {
  constructor(mesh) {
    this.mesh = mesh;
    this.velocity = new THREE.Vector3();
    this.life = 0;
    this.maxLife = 1;
    this.active = false;
  }
}

export class ParticleSystem {
  constructor(scene, poolSize = 300) {
    this.scene = scene;
    this.particles = [];

    // Wood chip material
    this.woodMat = new THREE.MeshBasicMaterial({ color: 0x8B6914 });
    // Leaf material
    this.leafMat = new THREE.MeshBasicMaterial({ color: 0x3a8a3a });

    // Pre-create particle pool
    const chipGeom = new THREE.BoxGeometry(0.15, 0.08, 0.3);
    const leafGeom = new THREE.PlaneGeometry(0.3, 0.3);

    for (let i = 0; i < poolSize; i++) {
      const isLeaf = i > poolSize * 0.6;
      const geom = isLeaf ? leafGeom : chipGeom;
      const mat = isLeaf ? this.leafMat : this.woodMat;
      const mesh = new THREE.Mesh(geom, mat);
      mesh.visible = false;
      scene.add(mesh);
      this.particles.push(new Particle(mesh));
    }
  }

  burst(position, carSpeed, count = 30) {
    const intensity = Math.min(carSpeed / 40, 2);
    let spawned = 0;

    for (const particle of this.particles) {
      if (particle.active) continue;
      if (spawned >= count) break;

      particle.active = true;
      particle.life = 0;
      particle.maxLife = randomRange(0.5, 1.5);

      particle.mesh.visible = true;
      particle.mesh.position.copy(position);
      particle.mesh.position.y += randomRange(1, 4);
      particle.mesh.position.x += randomRange(-1, 1);
      particle.mesh.position.z += randomRange(-1, 1);

      // Explode outward + upward
      particle.velocity.set(
        randomRange(-15, 15) * intensity,
        randomRange(5, 20) * intensity,
        randomRange(-15, 15) * intensity
      );

      particle.mesh.rotation.set(
        randomRange(0, Math.PI * 2),
        randomRange(0, Math.PI * 2),
        randomRange(0, Math.PI * 2)
      );

      const s = randomRange(0.5, 1.5);
      particle.mesh.scale.setScalar(s);

      spawned++;
    }
  }

  update(dt) {
    for (const particle of this.particles) {
      if (!particle.active) continue;

      particle.life += dt;
      if (particle.life >= particle.maxLife) {
        particle.active = false;
        particle.mesh.visible = false;
        continue;
      }

      // Gravity
      particle.velocity.y -= 30 * dt;

      // Move
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(dt));

      // Spin
      particle.mesh.rotation.x += 5 * dt;
      particle.mesh.rotation.z += 3 * dt;

      // Fade out via scale
      const lifeRatio = 1 - particle.life / particle.maxLife;
      particle.mesh.scale.setScalar(lifeRatio * 1.5);
    }
  }

  reset() {
    for (const particle of this.particles) {
      particle.active = false;
      particle.mesh.visible = false;
    }
  }
}
