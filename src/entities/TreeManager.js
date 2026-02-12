import { Tree } from './Tree.js';
import { randomRange } from '../utils/MathUtils.js';

export class TreeManager {
  constructor(trackGenerator) {
    this.track = trackGenerator;
    this.trees = [];
  }

  generate(scene) {
    const samples = 200;
    const halfWidth = this.track.roadHalfWidth;

    for (let i = 0; i < samples; i++) {
      const t = i / samples;

      // Skip start and end zones
      if (t < 0.02 || t > 0.97) continue;

      // Random chance to skip (vary density)
      if (Math.random() > 0.8) continue;

      const point = this.track.getPointAt(t);
      const right = this.track.getRightVectorAt(t);

      // Place trees on both sides
      for (const side of [-1, 1]) {
        // Random offset from road edge
        const offset = halfWidth + randomRange(1, 12);
        const x = point.x + right.x * side * offset;
        const z = point.z + right.z * side * offset;

        // Sometimes add a cluster of 2-3 trees
        const clusterSize = Math.random() > 0.7 ? Math.floor(randomRange(2, 4)) : 1;
        for (let c = 0; c < clusterSize; c++) {
          const cx = x + randomRange(-2, 2) * (c > 0 ? 1 : 0);
          const cz = z + randomRange(-2, 2) * (c > 0 ? 1 : 0);
          const tree = new Tree(cx, 0, cz);
          tree.addToScene(scene);
          this.trees.push(tree);
        }
      }
    }
  }

  update(dt, scene) {
    for (const tree of this.trees) {
      tree.update(dt);
    }

    // Clean up offscreen trees
    for (let i = this.trees.length - 1; i >= 0; i--) {
      if (this.trees[i].destroyed && this.trees[i].isOffscreen()) {
        this.trees[i].dispose(scene);
        this.trees.splice(i, 1);
      }
    }
  }

  getActiveTrees() {
    return this.trees.filter(t => !t.destroyed);
  }

  getTotalDestroyed() {
    return this.trees.filter(t => t.destroyed).length;
  }

  reset(scene) {
    for (const tree of this.trees) {
      tree.dispose(scene);
    }
    this.trees = [];
  }
}
