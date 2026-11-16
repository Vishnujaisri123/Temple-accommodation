/**
 * Dedicated 3D Configuration for Vadapalli Temple & Swamy Models
 * Adjust positions, scales, and camera waypoints here easily.
 */
export const TEMPLE_CONFIG = {
  // 1. Exterior Temple Model Placement
  temple: {
    modelPath: '/models/temple.glb',
    scale: [12.5, 12.5, 12.5] as [number, number, number],
    position: [0, -4.5, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number]
  },

  // 2. Swamy Deity Model Placement (Positioned inside inner sanctum)
  swamy: {
    modelPath: '/models/swamy.glb',
    scale: [3.4, 3.4, 3.4] as [number, number, number],
    position: [0, -1.8, -1.2] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number] // Faces forward toward entrance
  },

  // 3. Sanctum Divine Lighting
  sanctumLight: {
    color: '#FFD700', // Sacred warm gold
    intensity: 4.5,
    distance: 6.0,
    position: [0, 0.2, -0.6] as [number, number, number]
  },

  // 4. Camera Waypoints (Tied to 0.0 -> 1.0 Scroll Progress)
  camera: {
    // Initial exterior starting view
    desktopStartPos: [0, 2.5, 16.5] as [number, number, number],
    mobileStartPos: [0, 3.2, 21.0] as [number, number, number],
    startTarget: [0, 1.2, 0] as [number, number, number],

    // Final sanctum view (Centered on Swamy)
    finalPos: [0, -0.8, 0.35] as [number, number, number],
    finalTarget: [0, -0.9, -1.2] as [number, number, number],

    // Multi-point camera travel spline for smooth cinematic journey
    // Progress checkpoints: 0.0 (Exterior), 0.25 (Approach), 0.50 (Enter), 0.75 (Sanctum Approach), 1.0 (Reveal)
    pathPoints: [
      { progress: 0.0,  pos: [0, 2.5, 16.5],  target: [0, 1.2, 0.0] },
      { progress: 0.25, pos: [0, 0.8, 8.5],   target: [0, 0.4, 3.0] },
      { progress: 0.50, pos: [0, -0.2, 4.2],  target: [0, -0.4, 0.5] },
      { progress: 0.75, pos: [0, -0.6, 1.8],  target: [0, -0.8, -0.8] },
      { progress: 1.0,  pos: [0, -0.8, 0.35], target: [0, -0.9, -1.2] }
    ]
  }
};
