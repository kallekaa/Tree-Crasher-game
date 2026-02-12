import * as THREE from 'three';

export class TrackMesh {
  constructor(trackGenerator) {
    this.track = trackGenerator;
    this.group = new THREE.Group();
  }

  build(scene) {
    this.buildRoad();
    this.buildGround();
    scene.add(this.group);
  }

  buildRoad() {
    const samples = 500;
    const halfWidth = this.track.roadHalfWidth;

    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const point = this.track.getPointAt(t);
      const right = this.track.getRightVectorAt(t);

      // Left and right edge of road
      const left = point.clone().add(right.clone().multiplyScalar(-halfWidth));
      const rightPt = point.clone().add(right.clone().multiplyScalar(halfWidth));

      vertices.push(left.x, left.y + 0.01, left.z);
      vertices.push(rightPt.x, rightPt.y + 0.01, rightPt.z);

      uvs.push(0, t * 50);
      uvs.push(1, t * 50);

      if (i < samples) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.9,
      metalness: 0.0,
    });

    const road = new THREE.Mesh(geometry, material);
    road.receiveShadow = true;
    this.group.add(road);

    // Road center line (dashed)
    this.buildCenterLine(samples);

    // Road edge lines
    this.buildEdgeLines(samples, halfWidth);
  }

  buildCenterLine(samples) {
    const points = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = this.track.getPointAt(t);
      points.push(new THREE.Vector3(p.x, p.y + 0.05, p.z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0xffff00,
      dashSize: 3,
      gapSize: 3,
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    this.group.add(line);
  }

  buildEdgeLines(samples, halfWidth) {
    for (const side of [-1, 1]) {
      const points = [];
      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const p = this.track.getPointAt(t);
        const right = this.track.getRightVectorAt(t);
        const edge = p.clone().add(right.clone().multiplyScalar(side * halfWidth));
        points.push(new THREE.Vector3(edge.x, edge.y + 0.05, edge.z));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xffffff });
      const line = new THREE.Line(geometry, material);
      this.group.add(line);
    }
  }

  buildGround() {
    // Large ground plane covering the full track area
    const groundGeom = new THREE.PlaneGeometry(600, 1200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2d7d2d,
      roughness: 1.0,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.1, -500);
    ground.receiveShadow = true;
    this.group.add(ground);
  }
}
