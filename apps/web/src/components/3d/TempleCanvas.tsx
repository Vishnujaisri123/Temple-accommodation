import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Html } from '@react-three/drei';
import * as THREE from 'three';

// ----------------------------------------------------
// 1. Inner 3D Temple Model Component
// ----------------------------------------------------
const TempleModel: React.FC<{ autoRotate: boolean }> = ({ autoRotate }) => {
  // Load temple GLB from public directory
  const { scene } = useGLTF('/models/temple.glb');
  const modelRef = useRef<THREE.Group>(null);

  // Traverse materials to ensure lighting responds gracefully
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((m) => {
              if (m instanceof THREE.MeshStandardMaterial || 'roughness' in m) {
                const stdMat = m as THREE.MeshStandardMaterial;
                stdMat.roughness = Math.max(stdMat.roughness, 0.35);
              }
            });
          }
        }
      });
    }
  }, [scene]);

  // Gentle, respectful idle floating rotation
  useFrame((_, delta) => {
    if (modelRef.current && autoRotate) {
      modelRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={modelRef}>
      <Center top>
        <primitive object={scene} />
      </Center>
    </group>
  );
};

// Preload the GLTF model so it caches smoothly
useGLTF.preload('/models/temple.glb');

// ----------------------------------------------------
// 2. 3D Loading Fallback Indicator
// ----------------------------------------------------
const ModelLoader: React.FC = () => {
  return (
    <Html center>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 253, 249, 0.95)',
          padding: '1.25rem 1.75rem',
          borderRadius: '12px',
          border: '1.5px solid #C5A059',
          boxShadow: '0 8px 24px rgba(112, 26, 30, 0.15)',
          minWidth: '220px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            border: '3px solid #E8DFD5',
            borderTop: '3px solid #701A1E',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '0.75rem'
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ color: '#701A1E', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.02em' }}>
          Loading 3D Temple
        </div>
        <div style={{ color: '#6B5B52', fontSize: '0.75rem', marginTop: '0.2rem' }}>
          Sri Venkateswara Swamy Sannidhi
        </div>
      </div>
    </Html>
  );
};

// ----------------------------------------------------
// 3. Graceful Error Fallback if WebGL/Model Fails
// ----------------------------------------------------
class TempleErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('Temple 3D View Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ----------------------------------------------------
// 4. Main Exported 3D Temple Canvas
// ----------------------------------------------------
interface TempleCanvasProps {
  className?: string;
  style?: React.CSSProperties;
}

const TempleCanvas: React.FC<TempleCanvasProps> = ({ style }) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const controlsRef = useRef<any>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setAutoRotate(false);
    }
  }, []);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const fallbackUI = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFDF9',
        border: '1.5px solid var(--border-gold)',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛕</div>
      <h3 style={{ color: 'var(--color-primary)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        Sri Venkateswara Swamy Temple
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px' }}>
        Experience the sacred architecture of Vadapalli. (3D hardware acceleration unavailable on your device).
      </p>
    </div>
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '360px',
        borderRadius: '18px',
        overflow: 'hidden',
        backgroundColor: 'radial-gradient(circle at 50% 50%, #FFFDF9 0%, #FAF6F0 100%)',
        border: '1px solid rgba(197, 160, 89, 0.35)',
        boxShadow: '0 12px 36px rgba(112, 26, 30, 0.08), inset 0 0 40px rgba(197, 160, 89, 0.04)',
        ...style
      }}
      aria-label="Interactive 3D view of Vadapalli Sri Venkateswara Swamy Temple"
    >
      {/* Floating Interactive Badge & Controls */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'rgba(255, 253, 249, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(197, 160, 89, 0.4)',
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#701A1E',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <span style={{ fontSize: '0.9rem' }}>✨</span>
          <span>Interactive 3D Temple</span>
        </div>
      </div>

      {/* Top-Right Control Buttons */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          zIndex: 10,
          display: 'flex',
          gap: '0.5rem'
        }}
      >
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="btn"
          style={{
            padding: '0.4rem 0.65rem',
            fontSize: '0.75rem',
            backgroundColor: autoRotate ? '#701A1E' : '#FFFFFF',
            color: autoRotate ? '#FFFFFF' : '#701A1E',
            border: '1px solid #C5A059',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
          }}
          title={autoRotate ? 'Pause Rotation' : 'Resume Auto Rotation'}
        >
          {autoRotate ? '⏸️ Auto-Rotate' : '▶️ Rotate'}
        </button>
        <button
          onClick={handleResetCamera}
          className="btn"
          style={{
            padding: '0.4rem 0.65rem',
            fontSize: '0.75rem',
            backgroundColor: '#FFFFFF',
            color: '#701A1E',
            border: '1px solid #C5A059',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
          }}
          title="Reset Camera Angle"
        >
          🎯 Reset
        </button>
      </div>

      {/* Bottom Hint Banner */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.85rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
          backgroundColor: 'rgba(255, 253, 249, 0.88)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(197, 160, 89, 0.35)',
          padding: '0.25rem 0.85rem',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          color: '#6B5B52',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        {isTouchDevice ? '👆 Drag with finger to rotate • Pinch to zoom' : '🖱️ Click & drag to rotate • Scroll to zoom'}
      </div>

      {/* 3D Canvas with WebGL Error Boundary */}
      <TempleErrorBoundary fallback={fallbackUI}>
        <Canvas
          shadows
          camera={{ position: [0, 4, 11], fov: 42 }}
          dpr={[1, 1.75]} // Adaptive DPR for battery and mobile performance
          gl={{
            powerPreference: 'high-performance',
            antialias: true,
            alpha: true
          }}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'none' // Crucial: prevents mobile page scrolling conflicts while rotating 3D canvas
          }}
        >
          {/* Subtle Temple Lighting */}
          <ambientLight intensity={1.1} color="#FFFDF7" />
          
          {/* Warm Sun Directional Light */}
          <directionalLight
            position={[8, 12, 6]}
            intensity={1.4}
            color="#FFF4D6"
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={1}
            shadow-camera-far={30}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
          />
          
          {/* Fill Light for Shadows */}
          <directionalLight position={[-6, 6, -4]} intensity={0.5} color="#E8DFD5" />
          <hemisphereLight intensity={0.4} color="#FFF9E6" groundColor="#E0D5C1" />

          {/* Model with Suspense */}
          <Suspense fallback={<ModelLoader />}>
            <TempleModel autoRotate={autoRotate} />
          </Suspense>

          {/* Smooth Damped Orbit Controls */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            enablePan={false} // Keeps temple centered in view
            enableZoom={true}
            minDistance={4.5} // Prevents clipping into temple interior
            maxDistance={22}  // Prevents zooming too far away
            minPolarAngle={Math.PI / 8}   // Prevents top-down zenith artifacting
            maxPolarAngle={Math.PI / 2.05} // Prevents looking from beneath ground level
          />
        </Canvas>
      </TempleErrorBoundary>
    </div>
  );
};

export default TempleCanvas;
