import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ----------------------------------------------------
// 1. Camera Trajectory Waypoints Definition
// ----------------------------------------------------
interface Waypoint {
  t: number;
  camPos: [number, number, number];
  lookAt: [number, number, number];
}

const WAYPOINTS: Waypoint[] = [
  // Stage 1: Front exterior wide view
  { t: 0.00, camPos: [0, 0.36, 2.45],  lookAt: [0, 0.06, 0] },
  // Stage 2: Approaching entrance
  { t: 0.20, camPos: [0, 0.12, 1.25],  lookAt: [0, 0.03, 0] },
  // Stage 3: Entering through main doorway
  { t: 0.45, camPos: [0, 0.02, 0.48],  lookAt: [0, 0.01, -0.1] },
  // Stage 4: Moving along inner pathway / mandapam
  { t: 0.70, camPos: [0, -0.01, 0.18], lookAt: [0, -0.02, -0.14] },
  // Stage 5: Approaching inner sanctum & deity reveal
  { t: 0.88, camPos: [0, -0.02, 0.02], lookAt: [0, -0.025, -0.14] },
  // Stage 6: Final dignified Darshan at eye-level
  { t: 1.00, camPos: [0, -0.024, -0.055], lookAt: [0, -0.028, -0.14] }
];

function interpolateWaypoints(t: number): { pos: [number, number, number]; look: [number, number, number] } {
  const clampedT = Math.max(0, Math.min(1, t));

  // Find surrounding waypoints
  let idx = 0;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    if (clampedT >= WAYPOINTS[i].t && clampedT <= WAYPOINTS[i + 1].t) {
      idx = i;
      break;
    }
  }

  const p1 = WAYPOINTS[idx];
  const p2 = WAYPOINTS[idx + 1];
  const segmentDuration = p2.t - p1.t;
  const localT = segmentDuration === 0 ? 0 : (clampedT - p1.t) / segmentDuration;

  // Smooth Hermite / Smoothstep easing for cinematic glide
  const easeT = localT * localT * (3 - 2 * localT);

  const pos: [number, number, number] = [
    THREE.MathUtils.lerp(p1.camPos[0], p2.camPos[0], easeT),
    THREE.MathUtils.lerp(p1.camPos[1], p2.camPos[1], easeT),
    THREE.MathUtils.lerp(p1.camPos[2], p2.camPos[2], easeT)
  ];

  const look: [number, number, number] = [
    THREE.MathUtils.lerp(p1.lookAt[0], p2.lookAt[0], easeT),
    THREE.MathUtils.lerp(p1.lookAt[1], p2.lookAt[1], easeT),
    THREE.MathUtils.lerp(p1.lookAt[2], p2.lookAt[2], easeT)
  ];

  return { pos, look };
}

// ----------------------------------------------------
// 2. 3D Scene: Temple & Deity Models + Coordinated Camera
// ----------------------------------------------------
interface SceneContentProps {
  progressRef: React.MutableRefObject<number>;
  onProgressUpdate?: (p: number) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({ progressRef, onProgressUpdate }) => {
  const templeGltf = useGLTF('/models/temple.glb');
  const swamyGltf = useGLTF('/models/swamy.glb');

  const currentProgress = useRef(0);
  const swamyLightRef = useRef<THREE.PointLight>(null);

  // Configure materials: double-sided rendering for interior walls
  useEffect(() => {
    if (templeGltf.scene) {
      templeGltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((m) => {
            m.side = THREE.DoubleSide; // Allows seeing inside when camera enters!
            if ('roughness' in m) {
              (m as THREE.MeshStandardMaterial).roughness = 0.55;
            }
          });
        }
      });
    }

    if (swamyGltf.scene) {
      swamyGltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((m) => {
            m.side = THREE.FrontSide;
            if ('roughness' in m) {
              const stdMat = m as THREE.MeshStandardMaterial;
              stdMat.roughness = 0.35;
              stdMat.metalness = 0.15;
            }
          });
        }
      });
    }
  }, [templeGltf, swamyGltf]);

  // Single coordinated camera journey driven by useFrame and smooth damping
  useFrame((state, delta) => {
    const targetP = progressRef.current;
    currentProgress.current = THREE.MathUtils.damp(
      currentProgress.current,
      targetP,
      5.5,
      delta
    );

    const p = currentProgress.current;
    if (onProgressUpdate) {
      onProgressUpdate(p);
    }

    const { pos, look } = interpolateWaypoints(p);

    // Subtle gentle breathing motion when idle at exterior or darshan
    const idleWeight = p < 0.15 ? (1 - p / 0.15) : (p > 0.88 ? (p - 0.88) / 0.12 : 0);
    const idleSwayX = Math.sin(state.clock.elapsedTime * 0.75) * 0.003 * idleWeight;
    const idleSwayY = Math.cos(state.clock.elapsedTime * 0.9) * 0.002 * idleWeight;

    state.camera.position.set(pos[0] + idleSwayX, pos[1] + idleSwayY, pos[2]);
    state.camera.lookAt(look[0], look[1], look[2]);

    // Dynamic Aarti / Diya golden light on Swamy deity
    if (swamyLightRef.current) {
      // Glow intensifies as devotee approaches the sanctum
      const sanctumFactor = THREE.MathUtils.smoothstep(p, 0.5, 0.95);
      const flicker = (Math.sin(state.clock.elapsedTime * 6) + Math.cos(state.clock.elapsedTime * 9)) * 0.08;
      swamyLightRef.current.intensity = (1.5 + flicker) * sanctumFactor;
    }
  });

  return (
    <>
      {/* Daylight / Exterior Illumination */}
      <ambientLight intensity={0.9} color="#FFFDF5" />
      <directionalLight
        position={[6, 10, 5]}
        intensity={1.2}
        color="#FFF6D8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight intensity={0.4} color="#FFF8EB" groundColor="#D4C8B5" />

      {/* Temple Exterior & Interior Structure */}
      <group position={[0, 0, 0]}>
        <primitive object={templeGltf.scene} />
      </group>

      {/* Swamy Deity situated in the Inner Sanctum (Garbhalayam) */}
      <group
        position={[0, -0.05, -0.12]} // Positioned in the interior sanctum facing +Z
        scale={[0.38, 0.38, 0.38]}     // Respectfully proportioned to fit sanctum peetham
      >
        <primitive object={swamyGltf.scene} />
      </group>

      {/* Sacred Golden Diya / Aarti Spotlights inside Sanctum */}
      <pointLight
        ref={swamyLightRef}
        position={[0, 0.02, -0.06]}
        color="#FFD700"
        intensity={0}
        distance={1.5}
        decay={2}
      />
      <pointLight
        position={[0.08, -0.02, -0.08]}
        color="#FF8C00"
        intensity={0.6}
        distance={0.8}
      />
      <pointLight
        position={[-0.08, -0.02, -0.08]}
        color="#FF8C00"
        intensity={0.6}
        distance={0.8}
      />
    </>
  );
};

// ----------------------------------------------------
// 3. Loading Indicator
// ----------------------------------------------------
const JourneyLoader: React.FC = () => {
  return (
    <Html center>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'rgba(26, 18, 16, 0.88)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #C5A059',
          borderRadius: '16px',
          padding: '2rem 2.5rem',
          color: '#FFFDF9',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          minWidth: '260px'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            border: '3px solid rgba(197, 160, 89, 0.3)',
            borderTop: '3px solid #C5A059',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}
        />
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
        <div style={{ fontFamily: 'var(--font-telugu)', color: '#FFD700', fontSize: '1.1rem', marginBottom: '0.35rem' }}>
          వాడపల్లి శ్రీ వేంకటేశ్వర స్వామి సన్నిధి
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.04em' }}>
          Preparing Virtual Darshan...
        </div>
        <div style={{ fontSize: '0.75rem', color: '#A0AEC0', marginTop: '0.4rem' }}>
          Loading 3D Temple & Sanctum
        </div>
      </div>
    </Html>
  );
};

// ----------------------------------------------------
// 4. Main Exported Cinematic Journey Component
// ----------------------------------------------------
interface CinematicTempleJourneyProps {
  onExploreClick?: () => void;
  onBookClick?: () => void;
}

const CinematicTempleJourney: React.FC<CinematicTempleJourneyProps> = ({ onBookClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set up GSAP ScrollTrigger
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1, // Smooth dampening with mouse and touch wheel
      onUpdate: (self) => {
        progressRef.current = self.progress;
        setScrollProgress(self.progress);
      }
    });

    return () => {
      trigger.kill();
    };
  }, []);

  const handleContinueToBooking = () => {
    if (onBookClick) {
      onBookClick();
    } else {
      const target = document.getElementById('date-selector');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      ref={containerRef}
      style={{
        position: 'relative',
        height: '500vh', // Provides ample smooth scroll journey length
        backgroundColor: '#120C0A'
      }}
      aria-label="Interactive 3D Virtual Temple Darshan Journey"
    >
      {/* Fixed Sticky Viewport Container */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#120C0A'
        }}
      >
        {/* Full-Screen 3D Canvas */}
        <Canvas
          shadows
          camera={{ position: [0, 0.36, 2.45], fov: 40, near: 0.02, far: 40 }}
          dpr={[1, 1.75]} // Adaptive DPR for battery and mobile optimization
          gl={{
            powerPreference: 'high-performance',
            antialias: true,
            alpha: true
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            touchAction: 'pan-y' // Allows natural vertical page scroll on touch screens
          }}
        >
          <Suspense fallback={<JourneyLoader />}>
            <SceneContent progressRef={progressRef} />
          </Suspense>
        </Canvas>

        {/* ---------------------------------------------------- */}
        {/* STAGE 1 OVERLAY (0% to 18% Scroll): Exterior Welcome */}
        {/* ---------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: scrollProgress < 0.2 ? 'auto' : 'none',
            opacity: Math.max(0, 1 - scrollProgress * 5.5),
            transition: 'opacity 0.2s ease-out',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4rem 1.5rem 3rem 1.5rem',
            textAlign: 'center',
            background: 'radial-gradient(circle at 50% 50%, rgba(26, 18, 16, 0.2) 0%, rgba(18, 12, 10, 0.65) 100%)'
          }}
        >
          <div style={{ maxWidth: '820px', marginTop: '2rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(197, 160, 89, 0.2)',
                border: '1px solid #C5A059',
                padding: '0.4rem 1.25rem',
                borderRadius: '9999px',
                color: '#FFD700',
                fontFamily: 'var(--font-telugu)',
                fontSize: '1rem',
                marginBottom: '1rem',
                backdropFilter: 'blur(8px)'
              }}
            >
              <span>🪔</span> వాడపల్లి శ్రీ వేంకటేశ్వర స్వామి సన్నిధికి స్వాగతం
            </div>

            <h1
              className="heading-serif"
              style={{
                fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
                color: '#FFFDF9',
                lineHeight: 1.15,
                marginBottom: '1rem',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)'
              }}
            >
              Experience Divine Serenity
            </h1>

            <p
              style={{
                fontSize: 'clamp(1.05rem, 2vw, 1.3rem)',
                color: '#F5EFEB',
                maxWidth: '640px',
                margin: '0 auto 1.5rem auto',
                lineHeight: 1.6,
                textShadow: '0 2px 10px rgba(0,0,0,0.8)'
              }}
            >
              A Sacred Virtual Darshan of Sri Venkateswara Swamy, Vadapalli. Stay just 200 meters from this divine sanctum.
            </p>
          </div>

          {/* Bottom Scroll Prompt */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#FFD700',
              fontSize: '0.88rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              animation: 'bounce 2s infinite'
            }}
          >
            <style>{`
              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-8px); }
                60% { transform: translateY(-4px); }
              }
            `}</style>
            <span>Scroll down to enter the temple</span>
            <span style={{ fontSize: '1.25rem' }}>↓</span>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* STAGE 2 & 3 OVERLAY (20% to 50% Scroll): Approach/Entry */}
        {/* ---------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            opacity:
              scrollProgress >= 0.22 && scrollProgress <= 0.48
                ? Math.sin(((scrollProgress - 0.22) / 0.26) * Math.PI)
                : 0,
            transition: 'opacity 0.2s',
            textAlign: 'center',
            backgroundColor: 'rgba(26, 18, 16, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(197, 160, 89, 0.4)',
            padding: '0.75rem 1.75rem',
            borderRadius: '9999px',
            color: '#FFFDF9',
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ color: '#FFD700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Entering the Sacred Shrine
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 500 }}>
            Passing through the Temple Entrance Arch
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* STAGE 4 OVERLAY (52% to 75% Scroll): Mandapam Walk */}
        {/* ---------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            opacity:
              scrollProgress >= 0.52 && scrollProgress <= 0.76
                ? Math.sin(((scrollProgress - 0.52) / 0.24) * Math.PI)
                : 0,
            transition: 'opacity 0.2s',
            textAlign: 'center',
            backgroundColor: 'rgba(26, 18, 16, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(197, 160, 89, 0.4)',
            padding: '0.75rem 1.75rem',
            borderRadius: '9999px',
            color: '#FFFDF9',
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ color: '#FFD700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Approaching the Garbhalayam
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 500 }}>
            Moving along the Inner Sanctum Pathway
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* STAGE 5 & 6 OVERLAY (80% to 100% Scroll): Divine Darshan */}
        {/* ---------------------------------------------------- */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: scrollProgress >= 0.85 ? 'auto' : 'none',
            opacity:
              scrollProgress >= 0.8
                ? Math.min(1, (scrollProgress - 0.8) / 0.15)
                : 0,
            transition: 'opacity 0.25s ease-out',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '3rem 1.5rem 3.5rem 1.5rem',
            textAlign: 'center',
            background: 'radial-gradient(circle at 50% 60%, rgba(255, 215, 0, 0.08) 0%, rgba(18, 12, 10, 0.5) 100%)'
          }}
        >
          {/* Top Sacred Mantra */}
          <div
            style={{
              backgroundColor: 'rgba(26, 18, 16, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(197, 160, 89, 0.5)',
              padding: '0.6rem 1.75rem',
              borderRadius: '9999px',
              marginTop: '1.5rem'
            }}
          >
            <div style={{ fontFamily: 'var(--font-telugu)', fontSize: '1.35rem', color: '#FFD700', fontWeight: 700 }}>
              ఓం నమో వేంకటేశాయ
            </div>
            <div style={{ fontSize: '0.78rem', color: '#F5EFEB', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Sri Venkateswara Swamy Divya Darshanam
            </div>
          </div>

          {/* Bottom Darshan Actions */}
          <div
            style={{
              maxWidth: '650px',
              backgroundColor: 'rgba(26, 18, 16, 0.82)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid #C5A059',
              borderRadius: '16px',
              padding: '1.5rem 2rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
            }}
          >
            <h2 style={{ fontSize: '1.35rem', color: '#FFD700', margin: '0 0 0.5rem 0', fontWeight: 700 }}>
              Blessed Pilgrimage at Vadapalli
            </h2>
            <p style={{ color: '#E2E8F0', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              Stay just 200 meters from Sri Venkateswara Swamy Temple. Book your clean, peaceful room or hall bed for your family pilgrimage.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleContinueToBooking}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.95rem',
                  backgroundColor: '#701A1E',
                  border: '1px solid #C5A059'
                }}
              >
                📅 Book Accommodation Below ↓
              </button>
              <a
                href="https://wa.me/918555085539?text=Namaste,%20I%20would%20like%20to%20inquire%20about%20temple%20accommodation."
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  borderColor: '#C5A059',
                  color: '#FFD700'
                }}
              >
                💬 WhatsApp Owner
              </a>
            </div>
          </div>
        </div>

        {/* Scroll Progress Bar at the Top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            zIndex: 40
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${scrollProgress * 100}%`,
              backgroundColor: '#C5A059',
              boxShadow: '0 0 8px #FFD700',
              transition: 'width 0.05s linear'
            }}
          />
        </div>

      </div>
    </section>
  );
};

// Preload both assets so they are ready
useGLTF.preload('/models/temple.glb');
useGLTF.preload('/models/swamy.glb');

export default CinematicTempleJourney;
