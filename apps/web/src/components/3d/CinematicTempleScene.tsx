import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TEMPLE_CONFIG } from './templeConfig';

// ----------------------------------------------------
// 1. Models & Sanctum Scene
// ----------------------------------------------------
const TempleAndSwamyScene: React.FC<{ scrollProgress: number }> = ({ scrollProgress }) => {
  // Load both GLTF models
  const templeGltf = useGLTF(TEMPLE_CONFIG.temple.modelPath);
  const swamyGltf = useGLTF(TEMPLE_CONFIG.swamy.modelPath);

  const diyaLightRef = useRef<THREE.PointLight>(null);

  // Configure materials: double-sided for temple so interior walls are solid when entering
  useEffect(() => {
    if (templeGltf.scene) {
      templeGltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              m.side = THREE.DoubleSide; // Render both exterior and interior
              if ('roughness' in m) {
                (m as THREE.MeshStandardMaterial).roughness = Math.max((m as THREE.MeshStandardMaterial).roughness, 0.4);
              }
            });
          }
        }
      });
    }

    if (swamyGltf.scene) {
      swamyGltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if ('roughness' in m) {
                (m as THREE.MeshStandardMaterial).roughness = 0.3;
                (m as THREE.MeshStandardMaterial).metalness = 0.2;
              }
            });
          }
        }
      });
    }
  }, [templeGltf, swamyGltf]);

  // Gentle, sacred diya (oil lamp) flicker in the sanctum
  useFrame(({ clock }) => {
    if (diyaLightRef.current) {
      const time = clock.getElapsedTime();
      // Sanctum light brightens as visitor approaches the sanctum
      const sanctumFactor = Math.min(Math.max((scrollProgress - 0.4) / 0.5, 0.2), 1.0);
      const flicker = 0.9 + 0.1 * Math.sin(time * 6) * Math.cos(time * 4);
      diyaLightRef.current.intensity = TEMPLE_CONFIG.sanctumLight.intensity * sanctumFactor * flicker;
    }
  });

  return (
    <group>
      {/* 1. Exterior & Interior Temple Structure */}
      <primitive
        object={templeGltf.scene}
        scale={TEMPLE_CONFIG.temple.scale}
        position={TEMPLE_CONFIG.temple.position}
        rotation={TEMPLE_CONFIG.temple.rotation}
      />

      {/* 2. Swamy Deity inside Sanctum */}
      <primitive
        object={swamyGltf.scene}
        scale={TEMPLE_CONFIG.swamy.scale}
        position={TEMPLE_CONFIG.swamy.position}
        rotation={TEMPLE_CONFIG.swamy.rotation}
      />

      {/* 3. Divine Sanctum Diya / Aarti Glow */}
      <pointLight
        ref={diyaLightRef}
        position={TEMPLE_CONFIG.sanctumLight.position}
        color={TEMPLE_CONFIG.sanctumLight.color}
        distance={TEMPLE_CONFIG.sanctumLight.distance}
        decay={2}
      />
    </group>
  );
};

// ----------------------------------------------------
// 2. Scroll-Driven Camera Controller
// ----------------------------------------------------
const ScrollCameraController: React.FC<{ scrollProgress: number; isMobile: boolean }> = ({
  scrollProgress,
  isMobile
}) => {
  const { camera } = useThree();

  // Create CatmullRom 3D spline curves for Camera Position and LookAt Target
  const { posCurve, targetCurve } = useMemo(() => {
    const rawPoints = TEMPLE_CONFIG.camera.pathPoints;

    const posVectors = rawPoints.map((pt, i) => {
      // Adjust start distance for mobile portrait aspect ratio
      if (i === 0 && isMobile) {
        return new THREE.Vector3(...TEMPLE_CONFIG.camera.mobileStartPos);
      }
      return new THREE.Vector3(...(pt.pos as [number, number, number]));
    });

    const targetVectors = rawPoints.map((pt) => {
      return new THREE.Vector3(...(pt.target as [number, number, number]));
    });

    return {
      posCurve: new THREE.CatmullRomCurve3(posVectors),
      targetCurve: new THREE.CatmullRomCurve3(targetVectors)
    };
  }, [isMobile]);

  // Current smooth interpolation vectors
  const currentLookAt = useRef(new THREE.Vector3(0, 1.2, 0));

  useFrame(() => {
    // Clamp progress between 0 and 1
    const p = Math.min(Math.max(scrollProgress, 0), 1);

    // Sample target position and lookAt on the spline
    const desiredPos = posCurve.getPointAt(p);
    const desiredTarget = targetCurve.getPointAt(p);

    // Smooth lerp camera position to eliminate scroll jitter
    camera.position.lerp(desiredPos, 0.08);

    // Smooth lerp lookAt target
    currentLookAt.current.lerp(desiredTarget, 0.08);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

// Preload models for immediate smooth display
useGLTF.preload(TEMPLE_CONFIG.temple.modelPath);
useGLTF.preload(TEMPLE_CONFIG.swamy.modelPath);

// ----------------------------------------------------
// 3. Fullscreen Pinned Scroll Experience Component
// ----------------------------------------------------
interface CinematicTempleSceneProps {
  onExploreClick?: () => void;
}

const CinematicTempleScene: React.FC<CinematicTempleSceneProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track scroll progress within the pinned container
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Distance scrolled through the pinned container
      const totalScrollableDistance = containerHeight - viewportHeight;
      const currentScroll = -rect.top;

      let progress = 0;
      if (totalScrollableDistance > 0) {
        progress = Math.min(Math.max(currentScroll / totalScrollableDistance, 0), 1);
      }

      setScrollProgress(progress);
    };

    const onScrollTick = () => {
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScrollTick, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScrollTick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const scrollToBooking = () => {
    const el = document.getElementById('date-selector');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        // 450vh scroll distance for desktop, 360vh on mobile for comfortable thumb scroll
        height: isMobile ? '360vh' : '450vh',
        backgroundColor: '#120B0A'
      }}
    >
      {/* Pinned Viewport Container */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {/* Fullscreen 3D Canvas */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <Canvas
            shadows
            camera={{ position: isMobile ? TEMPLE_CONFIG.camera.mobileStartPos : TEMPLE_CONFIG.camera.desktopStartPos, fov: isMobile ? 48 : 42, near: 0.1, far: 100 }}
            dpr={[1, isMobile ? 1.5 : 1.75]}
            gl={{
              powerPreference: 'high-performance',
              antialias: true,
              alpha: false
            }}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Sacred Atmosphere Lighting */}
            <color attach="background" args={['#170F0D']} />
            <ambientLight intensity={0.9} color="#FFF8EB" />
            
            {/* Warm Sunlight */}
            <directionalLight
              position={[10, 16, 8]}
              intensity={1.3}
              color="#FFF2D6"
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            {/* Soft Fill Light */}
            <directionalLight position={[-8, 8, -6]} intensity={0.4} color="#80665A" />
            <hemisphereLight intensity={0.35} color="#FFE6C7" groundColor="#33241F" />

            <Suspense fallback={null}>
              <TempleAndSwamyScene scrollProgress={scrollProgress} />
              <ScrollCameraController scrollProgress={scrollProgress} isMobile={isMobile} />
            </Suspense>
          </Canvas>
        </div>

        {/* Cinematic Text & Narrative Overlays based on Scroll Progress */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: isMobile ? '1.5rem 1rem' : '2.5rem 3rem'
          }}
        >
          {/* Top Bar: Sacred Telugu Crest & Quick Booking Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div
              style={{
                backgroundColor: 'rgba(23, 15, 13, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(197, 160, 89, 0.4)',
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                color: '#D4AF37',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>🪔</span>
              <span>వాడపల్లి శ్రీ వేంకటేశ్వర స్వామి సన్నిధి</span>
            </div>

            {/* Quick Skip to Booking Button (Interactive) */}
            <button
              onClick={scrollToBooking}
              className="btn btn-primary"
              style={{
                pointerEvents: 'auto',
                backgroundColor: '#701A1E',
                color: '#FFFFFF',
                border: '1px solid #D4AF37',
                padding: isMobile ? '0.45rem 0.85rem' : '0.55rem 1.25rem',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: 600,
                borderRadius: '9999px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                cursor: 'pointer'
              }}
            >
              ⚡ Book Your Stay
            </button>
          </div>

          {/* Phase 1 Overlay: Temple Exterior (0% - 25%) */}
          <div
            style={{
              transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
              opacity: scrollProgress < 0.22 ? 1 : Math.max(0, 1 - (scrollProgress - 0.22) * 10),
              transform: `translateY(${scrollProgress < 0.22 ? 0 : -20}px)`,
              maxWidth: '680px',
              backgroundColor: 'rgba(23, 15, 13, 0.78)',
              backdropFilter: 'blur(10px)',
              padding: isMobile ? '1.5rem' : '2.25rem 2.5rem',
              borderRadius: '16px',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
              alignSelf: 'flex-start',
              margin: 'auto 0'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                color: '#D4AF37',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: '0.5rem'
              }}
            >
              Sacred Pilgrimage Lodging
            </span>
            <h1
              className="heading-serif"
              style={{
                fontSize: isMobile ? '1.85rem' : '2.85rem',
                color: '#FFFDF9',
                margin: 0,
                lineHeight: 1.15
              }}
            >
              Experience Divine Serenity
            </h1>
            <p
              style={{
                color: '#E8DFD5',
                fontSize: isMobile ? '0.95rem' : '1.15rem',
                marginTop: '0.75rem',
                marginBottom: '1.25rem',
                lineHeight: 1.5
              }}
            >
              Stay close to Sri Venkateswara Swamy Temple, Vadapalli. Just 200 meters (3-minute walk) to the sacred sanctum sanctorum.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', pointerEvents: 'auto' }}>
              <button
                onClick={scrollToBooking}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#701A1E',
                  color: '#FFFFFF',
                  border: '1px solid #D4AF37',
                  padding: '0.7rem 1.5rem',
                  fontSize: '0.95rem'
                }}
              >
                📅 Book Your Stay
              </button>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#D4AF37',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                <span>📜 Scroll down to enter temple</span>
                <span style={{ animation: 'bounce 1.5s infinite' }}>↓</span>
              </div>
            </div>
          </div>

          {/* Phase 2 Overlay: Approach (25% - 50%) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              transition: 'opacity 0.4s ease-out',
              opacity: scrollProgress >= 0.25 && scrollProgress < 0.48 ? 1 : 0,
              pointerEvents: 'none',
              textAlign: 'center',
              backgroundColor: 'rgba(23, 15, 13, 0.72)',
              backdropFilter: 'blur(8px)',
              padding: '1rem 2rem',
              borderRadius: '9999px',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              color: '#FFFDF9',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ color: '#D4AF37', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Approaching Entrance
            </div>
            <div style={{ fontSize: isMobile ? '1.05rem' : '1.35rem', fontWeight: 600 }}>
              Entering the Sacred Mandapam
            </div>
          </div>

          {/* Phase 3 & 4 Overlay: Moving Toward Sanctum (50% - 75%) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              transition: 'opacity 0.4s ease-out',
              opacity: scrollProgress >= 0.52 && scrollProgress < 0.74 ? 1 : 0,
              pointerEvents: 'none',
              textAlign: 'center',
              backgroundColor: 'rgba(23, 15, 13, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '1.25rem 2.25rem',
              borderRadius: '16px',
              border: '1px solid rgba(197, 160, 89, 0.4)',
              color: '#FFFDF9'
            }}
          >
            <div style={{ color: '#D4AF37', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Garbhagriha Corridor
            </div>
            <div style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: 700 }}>
              Approaching the Inner Sanctum...
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#E8DFD5' }}>
              Prepare for the divine darshanam of Sri Venkateswara Swamy
            </p>
          </div>

          {/* Phase 5 Overlay: Swamy Reveal (75% - 100%) */}
          <div
            style={{
              transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
              opacity: scrollProgress >= 0.76 ? 1 : 0,
              transform: `translateY(${scrollProgress >= 0.76 ? 0 : 20}px)`,
              backgroundColor: 'rgba(23, 15, 13, 0.82)',
              backdropFilter: 'blur(10px)',
              padding: isMobile ? '1.25rem 1.5rem' : '1.75rem 2.5rem',
              borderRadius: '16px',
              border: '1.5px solid #D4AF37',
              boxShadow: '0 12px 35px rgba(212, 175, 55, 0.25)',
              textAlign: 'center',
              maxWidth: '620px',
              margin: 'auto auto 2rem auto'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-telugu)',
                color: '#D4AF37',
                fontSize: isMobile ? '1.15rem' : '1.4rem',
                fontWeight: 600,
                marginBottom: '0.25rem'
              }}
            >
              శ్రీ వేంకటేశ్వర స్వామి దివ్య దర్శనం
            </div>
            <h2
              className="heading-serif"
              style={{
                color: '#FFFDF9',
                fontSize: isMobile ? '1.35rem' : '1.85rem',
                margin: '0.25rem 0',
                fontWeight: 700
              }}
            >
              Lord Sri Venkateswara Swamy
            </h2>
            <p style={{ color: '#E8DFD5', fontSize: isMobile ? '0.85rem' : '0.95rem', margin: '0.5rem 0 1rem 0' }}>
              You are now inside the sanctum sanctorum. Scroll further to explore rooms, availability, and book your stay.
            </p>
            <div style={{ pointerEvents: 'auto', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={scrollToBooking}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#701A1E',
                  color: '#FFFFFF',
                  border: '1px solid #D4AF37',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.9rem'
                }}
              >
                📅 Continue to Room Booking ↓
              </button>
            </div>
          </div>

          {/* Bottom Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${scrollProgress * 100}%`,
                backgroundColor: '#D4AF37',
                transition: 'width 0.1s linear'
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
};

export default CinematicTempleScene;
