import * as THREE from 'three';

export class TrackGenerator {
  constructor() {
    this.segmentCount = 30;
    this.trackLength = 800;
    this.roadHalfWidth = 6;
  }

  generate() {
    const points = [];
    const segLen = this.trackLength / this.segmentCount;

    for (let i = 0; i <= this.segmentCount; i++) {
      const z = -i * segLen;
      let x = 0;

      // Keep first and last segments straight
      if (i > 3 && i < this.segmentCount - 3) {
        x = Math.sin(i * 0.3) * 35
          + Math.sin(i * 0.7 + 1) * 18
          + Math.sin(i * 1.4 + 2) * 10;
      }

      // Gentle elevation
      const y = Math.sin(i * 0.15) * 2;

      points.push(new THREE.Vector3(x, y, z));
    }

    this.curve = new THREE.CatmullRomCurve3(points);
    this.totalLength = this.curve.getLength();
    return this.curve;
  }

  // Get position and direction at a fraction (0-1) along the track
  getPointAt(t) {
    return this.curve.getPointAt(t);
  }

  getTangentAt(t) {
    return this.curve.getTangentAt(t);
  }

  // Get the perpendicular (right) vector at a point on the track
  getRightVectorAt(t) {
    const tangent = this.getTangentAt(t);
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Vector3().crossVectors(tangent, up).normalize();
  }

  // Get progress (0-1) based on a world Z position (approximate)
  getProgressFromZ(z) {
    // Track runs from z=0 to z=-trackLength
    return Math.max(0, Math.min(1, -z / this.trackLength));
  }
}
