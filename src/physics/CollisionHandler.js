export class CollisionHandler {
  constructor(car, treeManager, onHit) {
    this.car = car;
    this.treeManager = treeManager;
    this.onHit = onHit; // callback(tree, carSpeed)
    this.checkRadius = 50; // Only check trees within this distance
  }

  update() {
    const carFront = this.car.frontPosition;
    const carSpeed = Math.abs(this.car.speed);
    const carForward = this.car.forwardVector;

    if (carSpeed < 2) return; // Too slow to crash

    for (const tree of this.treeManager.getActiveTrees()) {
      const treePos = tree.group.position;

      // Quick distance check (skip far trees)
      const dx = carFront.x - treePos.x;
      const dz = carFront.z - treePos.z;
      const distSq = dx * dx + dz * dz;

      if (distSq > this.checkRadius * this.checkRadius) continue;

      const dist = Math.sqrt(distSq);
      const hitDist = this.car.collisionRadius + tree.collisionRadius * tree.scale;

      if (dist < hitDist) {
        // Collision!
        tree.destroy(carForward, carSpeed);
        tree.addFragmentsToScene(tree.group.parent);
        this.car.applyImpactSlowdown(0.88);
        this.onHit(tree, carSpeed);
      }
    }
  }
}
