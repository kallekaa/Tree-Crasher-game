# Tree Crasher!

A 3D browser driving game where you smash through trees at high speed for points. Built with Three.js.

## Gameplay

Drive your car down a winding forest track and crash into as many trees as possible. Trees fly into the air and shatter on impact. The faster you go, the more points you earn. Chain rapid hits for combo multipliers.

## Controls

| Key | Action |
|-----|--------|
| W / Up Arrow | Accelerate |
| S / Down Arrow | Brake |
| A / Left Arrow | Steer Left |
| D / Right Arrow | Steer Right |

## Features

- Procedurally generated winding track with Catmull-Rom splines
- Arcade car physics with visual lean and wheel spin
- Tree destruction with flying fragments and physics simulation
- Particle effects (wood chips and leaves) on impact
- Speed-based score multipliers (1x-5x) and combo system (up to 10x)
- Camera shake and FOV zoom at high speed
- Slow-motion effect on big impacts
- Procedural audio (engine hum, crash sounds, score dings)
- Full game flow: menu, gameplay, and results screen

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- **Three.js** - 3D rendering
- **Howler.js** - Audio
- **Vite** - Build tool
