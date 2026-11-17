import React, { useRef, useEffect, useState, Suspense, useCallback, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MeshoptDecoder } from 'meshoptimizer';

gsap.registerPlugin(ScrollTrigger);

// ----------------------------------------------------
// 0. Asset Paths & Meshopt Decoder Configuration
// Ensures correct resolution in local dev, subdirectories, and production deployment.
// ----------------------------------------------------
export const getAssetUrl = (relativePath: string): string => {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanPath}`;
};

export const TEMPLE_MODEL_PATH = getAssetUrl('models/temple.glb');
export const SWAMY_MODEL_PATH = getAssetUrl('models/swamy.glb');

// Configure GLTFLoader to decode EXT_meshopt_compression using meshoptimizer
const configureGLTFLoader = (loader: any) => {
  if (loader && typeof loader.setMeshoptDecoder === 'function') {
    loader.setMeshoptDecoder(MeshoptDecoder);
  }
};

// ----------------------------------------------------
// 1. Camera Trajectory Waypoints Definition
// Front entrance of temple is facing +Z after rotation.
// Camera moves directly into the sanctum towards -Z.
// ----------------------------------------------------
interface Waypoint {
  t: number;
  camPos: [number, number, number];
  lookAt: [number, number, number];
}

const WAYPOINTS: Waypoint[] = [
  // Stage 1: Front exterior wide view - looking directly at front entrance arch
  { t: 0.00, camPos: [0, 0.22, 2.25],  lookAt: [0, -0.05, 0] },
  // Stage 2: Approaching entrance steps and descending
  { t: 0.20, camPos: [0, 0.04, 1.35],  lookAt: [0, -0.15, 0] },
  // Stage 3: Gliding down through the entrance doorway
  { t: 0.45, camPos: [0, -0.12, 0.85], lookAt: [0, -0.22, 0] },
  // Stage 4: Moving down along inner pathway towards down center
  { t: 0.70, camPos: [0, -0.20, 0.55], lookAt: [0, -0.27, 0] },
  // Stage 5: Approaching down-center sanctum to reveal Swamy
  { t: 0.88, camPos: [0, -0.26, 0.40], lookAt: [0, -0.29, 0] },
  // Stage 6: Final dignified Darshan at eye-level with Swamy in down center of temple
  { t: 1.00, camPos: [0, -0.28, 0.32], lookAt: [0, -0.29, 0] }
];

function interpolateWaypoints(t: number): { pos: [number, number, number]; look: [number, number, number] } {
  const clampedT = Math.max(0, Math.min(1, t));

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
// 2. 3D Scene: Unified Temple Complex & Coordinated Camera
// ----------------------------------------------------
interface SceneContentProps {
  progressRef: React.MutableRefObject<number>;
  userYawRef: React.MutableRefObject<number>;
  baseYawRef: React.MutableRefObject<number>;
  onProgressUpdate?: (p: number) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({
  progressRef,
  userYawRef,
  baseYawRef,
  onProgressUpdate
}) => {
  // Pass true for Draco, true for Meshopt, and custom loader configurator for meshoptimizer
  const templeGltf = useGLTF(TEMPLE_MODEL_PATH, true, true, configureGLTFLoader);
  const swamyGltf = useGLTF(SWAMY_MODEL_PATH, true, true, configureGLTFLoader);

  const currentProgress = useRef(0);
  const dampedYaw = useRef(0);
  const complexGroupRef = useRef<THREE.Group>(null);

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
            m.side = THREE.DoubleSide; // Allows viewing inside as camera enters
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
              stdMat.roughness = 0.5;
              stdMat.metalness = 0.05;
            }
          });
        }
      });
    }
  }, [templeGltf, swamyGltf]);

  // Coordinated camera journey driven by useFrame and smooth damping
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

    // Handle user drag & base rotation
    // When devotee starts scrolling down into the temple (p > 0.08),
    // user drag yaw smoothly re-aligns back to 0 so the journey enters straight
    const targetYaw = p > 0.08 ? 0 : userYawRef.current;
    dampedYaw.current = THREE.MathUtils.damp(dampedYaw.current, targetYaw, 4.5, delta);

    if (complexGroupRef.current) {
      complexGroupRef.current.rotation.y = baseYawRef.current + dampedYaw.current;
    }
  });

  return (
    <>
      {/* Daylight / Exterior Illumination */}
      <ambientLight intensity={0.95} color="#FFFDF5" />
      <directionalLight
        position={[6, 10, 5]}
        intensity={1.25}
        color="#FFF6D8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight intensity={0.45} color="#FFF8EB" groundColor="#D4C8B5" />

      {/* Unified Temple & Sanctum Complex */}
      {/* Default base angle (-Math.PI / 2) brings front entrance (+X) directly facing the camera (+Z) */}
      <group ref={complexGroupRef} position={[0, 0, 0]}>
        {/* 1. Temple Exterior & Interior Structure */}
        <primitive object={templeGltf.scene} />

        {/* 2. Swamy Deity placed in the Down Center of the Temple */}
        {/* Resting naturally on the temple floor */}
        <group
          position={[0, -0.297, 0]}
          scale={[0.18, 0.18, 0.18]}
        >
          <primitive object={swamyGltf.scene} />
        </group>
      </group>
    </>
  );
};

// ----------------------------------------------------
// 3. Real-time Loading Indicator with Percentage & Progress
// ----------------------------------------------------
const JourneyLoader: React.FC = () => {
  const { progress, loaded, total } = useProgress();
  const roundedProgress = Math.round(progress || 0);

  return (
    <Html center>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'rgba(26, 18, 16, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #C5A059',
          borderRadius: '16px',
          padding: '2.2rem 2.5rem',
          color: '#FFFDF9',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          minWidth: '290px',
          maxWidth: '380px'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '54px',
            height: '54px',
            marginBottom: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '3px solid rgba(197, 160, 89, 0.25)',
              borderTop: '3px solid #C5A059',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFD700' }}>
            {roundedProgress}%
          </span>
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>

        <div style={{ fontFamily: 'var(--font-telugu)', color: '#FFD700', fontSize: '1.15rem', marginBottom: '0.35rem' }}>
          వాడపల్లి శ్రీ వేంకటేశ్వర స్వామి సన్నిధి
        </div>
        <div style={{ fontSize: '0.96rem', fontWeight: 600, letterSpacing: '0.04em' }}>
          Preparing Virtual Darshan...
        </div>

        {/* Real-time Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginTop: '1rem',
            marginBottom: '0.5rem'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.max(6, roundedProgress)}%`,
              backgroundColor: '#C5A059',
              boxShadow: '0 0 10px #FFD700',
              transition: 'width 0.2s ease-out'
            }}
          />
        </div>

        <div style={{ fontSize: '0.78rem', color: '#D4C8B5', marginTop: '0.2rem' }}>
          {roundedProgress < 45
            ? 'Streaming 3D Temple Architecture...'
            : roundedProgress < 88
            ? 'Streaming Sacred Garbhalayam & Swamy...'
            : 'Finalizing Divine Sanctum Lighting...'}
        </div>
        {total > 0 && (
          <div style={{ fontSize: '0.7rem', color: '#A0AEC0', marginTop: '0.3rem' }}>
            Assets: {loaded} of {total} loaded
          </div>
        )}
      </div>
    </Html>
  );
};

// ----------------------------------------------------
// 4. React Error Boundary for 3D Canvas
// ----------------------------------------------------
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (error: Error, retry: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ThreeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🕉️ [ThreeErrorBoundary] 3D Canvas error occurred:', error, errorInfo);
  }

  retry = () => {
    // Clear useGLTF cache for both models before retrying
    useGLTF.clear(TEMPLE_MODEL_PATH);
    useGLTF.clear(SWAMY_MODEL_PATH);
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.retry);
    }
    return this.props.children;
  }
}

// ----------------------------------------------------
// 5. Fallback View for Error or WebGL Unsupported
// ----------------------------------------------------
interface FallbackProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  onContinue?: () => void;
  diagnostics?: {
    webglSupported: boolean;
    webglRenderer: string;
    templeUrl: string;
    templeStatus?: string;
    swamyUrl: string;
    swamyStatus?: string;
  };
}

const TempleFallbackHero: React.FC<FallbackProps> = ({
  title = 'Sri Venkateswara Swamy Temple, Vadapalli',
  message = 'Welcome to the sacred abode of Sri Venkateswara Swamy. Explore and book comfortable temple accommodations just 200 meters from the temple.',
  error,
  onRetry,
  onContinue,
  diagnostics
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#120C0A',
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(197, 160, 89, 0.15) 0%, rgba(18, 12, 10, 0.95) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        color: '#FFFDF9',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          backgroundColor: 'rgba(26, 18, 16, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid #C5A059',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
        }}
      >
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
            fontSize: '1.05rem',
            marginBottom: '1rem'
          }}
        >
          <span>🪔</span> వాడపల్లి శ్రీ వేంకటేశ్వర స్వామి సన్నిధి
        </div>

        <h1
          className="heading-serif"
          style={{
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            color: '#FFFDF9',
            lineHeight: 1.2,
            marginBottom: '1rem'
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: '#F5EFEB',
            lineHeight: 1.65,
            marginBottom: '2rem'
          }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onContinue && (
            <button
              onClick={onContinue}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.75rem',
                fontSize: '0.95rem',
                backgroundColor: '#701A1E',
                border: '1px solid #C5A059',
                boxShadow: '0 4px 14px rgba(112, 26, 30, 0.5)'
              }}
            >
              📅 Explore Accommodations ↓
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="btn btn-secondary"
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                borderColor: '#C5A059',
                color: '#FFD700'
              }}
            >
              🔄 Retry 3D Virtual Darshan
            </button>
          )}

          <a
            href="https://wa.me/918555085539?text=Namaste,%20I%20would%20like%20to%20inquire%20about%20temple%20accommodation."
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.95rem',
              borderColor: 'rgba(197, 160, 89, 0.5)',
              color: '#FFFDF9'
            }}
          >
            💬 WhatsApp Support
          </a>
        </div>

        {/* Developer Diagnostics Toggle */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(197, 160, 89, 0.2)', paddingTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowDetails(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: '#A0AEC0',
              fontSize: '0.78rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {showDetails ? 'Hide Diagnostics ▲' : 'Show Deployment Diagnostics ▼'}
          </button>

          {showDetails && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.85rem',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: '#E2E8F0',
                maxHeight: '220px',
                overflowY: 'auto',
                lineHeight: 1.5
              }}
            >
              <div><strong>WebGL Supported:</strong> {diagnostics?.webglSupported ? 'Yes' : 'No'}</div>
              <div><strong>WebGL Renderer:</strong> {diagnostics?.webglRenderer || 'Unknown'}</div>
              <div style={{ marginTop: '0.4rem' }}><strong>Temple Model:</strong> {diagnostics?.templeUrl}</div>
              {diagnostics?.templeStatus && <div><strong>Temple Fetch:</strong> {diagnostics.templeStatus}</div>}
              <div style={{ marginTop: '0.4rem' }}><strong>Swamy Model:</strong> {diagnostics?.swamyUrl}</div>
              {diagnostics?.swamyStatus && <div><strong>Swamy Fetch:</strong> {diagnostics.swamyStatus}</div>}
              {error && (
                <div style={{ marginTop: '0.5rem', color: '#FC8181' }}>
                  <strong>Error:</strong> {error.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 6. Main Exported Cinematic Journey Component
// ----------------------------------------------------
interface CinematicTempleJourneyProps {
  onExploreClick?: () => void;
  onBookClick?: () => void;
}

const FRONT_VIEW_ANGLE = -Math.PI / 2; // Default true Front Entrance facing camera

const CinematicTempleJourney: React.FC<CinematicTempleJourneyProps> = ({ onBookClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<number>(0);
  const userYawRef = useRef<number>(0);
  const baseYawRef = useRef<number>(FRONT_VIEW_ANGLE);

  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeAngleLabel, setActiveAngleLabel] = useState<string>('Front Entrance');
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [diagnostics, setDiagnostics] = useState<{
    webglSupported: boolean;
    webglRenderer: string;
    templeUrl: string;
    templeStatus?: string;
    swamyUrl: string;
    swamyStatus?: string;
  }>({
    webglSupported: true,
    webglRenderer: 'Detecting...',
    templeUrl: TEMPLE_MODEL_PATH,
    swamyUrl: SWAMY_MODEL_PATH
  });

  // Interactive mouse/touch drag state
  const isDragging = useRef(false);
  const startX = useRef(0);

  // Preflight asset & WebGL inspection on mount
  useEffect(() => {
    // 1. Check WebGL availability
    let hasWebGL = false;
    let rendererName = 'Not Available';
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (gl) {
        hasWebGL = true;
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        rendererName = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Generic WebGL';
      }
    } catch {
      hasWebGL = false;
    }

    setWebglSupported(hasWebGL);

    // 2. Preflight HEAD checks to verify that models are being served with correct status
    const runPreflight = async () => {
      let tStatus = 'Checking...';
      let sStatus = 'Checking...';

      try {
        const respT = await fetch(TEMPLE_MODEL_PATH, { method: 'HEAD' });
        const cTypeT = respT.headers.get('content-type') || '';
        tStatus = `Status ${respT.status} (${cTypeT || 'no-type'})`;
        if (cTypeT.includes('text/html')) {
          console.warn('⚠️ [3D Virtual Darshan] Warning: temple.glb returned text/html. Hosting may be redirecting missing files to index.html.');
        }
      } catch (err) {
        tStatus = `Network failed: ${err instanceof Error ? err.message : String(err)}`;
      }

      try {
        const respS = await fetch(SWAMY_MODEL_PATH, { method: 'HEAD' });
        const cTypeS = respS.headers.get('content-type') || '';
        sStatus = `Status ${respS.status} (${cTypeS || 'no-type'})`;
      } catch (err) {
        sStatus = `Network failed: ${err instanceof Error ? err.message : String(err)}`;
      }

      const diag = {
        webglSupported: hasWebGL,
        webglRenderer: rendererName,
        templeUrl: TEMPLE_MODEL_PATH,
        templeStatus: tStatus,
        swamyUrl: SWAMY_MODEL_PATH,
        swamyStatus: sStatus
      };

      setDiagnostics(diag);

      // Diagnostic group in browser developer tools
      console.groupCollapsed('🕉️ Vadapalli 3D Virtual Darshan Asset Preflight');
      console.log('WebGL Supported:', hasWebGL, '| Renderer:', rendererName);
      console.log('Temple Model URL:', TEMPLE_MODEL_PATH, '| Result:', tStatus);
      console.log('Swamy Model URL:', SWAMY_MODEL_PATH, '| Result:', sStatus);
      console.log('Three.js Revision:', THREE.REVISION);
      console.groupEnd();
    };

    runPreflight();
  }, []);

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

  // Quick preset angle switchers
  const handleSetAngle = useCallback((angle: number, label: string) => {
    baseYawRef.current = angle;
    userYawRef.current = 0;
    setActiveAngleLabel(label);
  }, []);

  const handleCycleAngle = useCallback(() => {
    const angles = [
      { angle: -Math.PI / 2, label: 'Front Entrance' },
      { angle: 0, label: 'Side View (90°)' },
      { angle: Math.PI / 2, label: 'Back View (180°)' },
      { angle: Math.PI, label: 'Opposite Side (270°)' }
    ];
    const currentIdx = angles.findIndex(a => Math.abs(a.angle - baseYawRef.current) < 0.1);
    const nextIdx = (currentIdx + 1) % angles.length;
    handleSetAngle(angles[nextIdx].angle, angles[nextIdx].label);
  }, [handleSetAngle]);

  // Pointer drag for interactive exploration at Stage 1
  const handlePointerDown = (e: React.PointerEvent) => {
    if (scrollProgress < 0.18) {
      isDragging.current = true;
      startX.current = e.clientX;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current && scrollProgress < 0.18) {
      const delta = e.clientX - startX.current;
      startX.current = e.clientX;
      userYawRef.current += delta * 0.007;
      setActiveAngleLabel('Custom Angle');
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  };

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

  // Graceful fallback if WebGL is disabled or unsupported in browser
  if (!webglSupported) {
    return (
      <TempleFallbackHero
        title="Experience Sri Venkateswara Swamy Temple, Vadapalli"
        message="Your browser hardware does not currently support WebGL 3D rendering. All booking functionalities, rooms, and pooja timings remain fully available below."
        onContinue={handleContinueToBooking}
        diagnostics={diagnostics}
      />
    );
  }

  return (
    <ThreeErrorBoundary
      fallback={(error, retry) => (
        <TempleFallbackHero
          title="Virtual Darshan Temporarily Unavailable"
          message="We are preparing the 3D temple journey. You can proceed directly to explore and book available accommodations."
          error={error}
          onRetry={retry}
          onContinue={handleContinueToBooking}
          diagnostics={diagnostics}
        />
      )}
    >
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
            camera={{ position: [0, 0.22, 2.25], fov: 46, near: 0.02, far: 40 }}
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
              <SceneContent
                progressRef={progressRef}
                userYawRef={userYawRef}
                baseYawRef={baseYawRef}
              />
            </Suspense>
          </Canvas>

          {/* ---------------------------------------------------- */}
          {/* STAGE 1 OVERLAY (0% to 18% Scroll): Exterior Welcome */}
          {/* ---------------------------------------------------- */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
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
              background: 'radial-gradient(circle at 50% 50%, rgba(26, 18, 16, 0.2) 0%, rgba(18, 12, 10, 0.65) 100%)',
              cursor: scrollProgress < 0.18 ? 'grab' : 'default',
              userSelect: 'none'
            }}
          >
            {/* Top Quick Angle Controls */}
            <div
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                zIndex: 35,
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                justifyContent: 'flex-end'
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetAngle(FRONT_VIEW_ANGLE, 'Front Entrance');
                }}
                style={{
                  padding: '0.4rem 0.9rem',
                  fontSize: '0.8rem',
                  borderRadius: '9999px',
                  backgroundColor: activeAngleLabel === 'Front Entrance' ? '#701A1E' : 'rgba(26, 18, 16, 0.85)',
                  border: '1.5px solid #C5A059',
                  color: '#FFD700',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                title="Reset to True Front Entrance View"
              >
                <span>🎯</span> Front View
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCycleAngle();
                }}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(26, 18, 16, 0.85)',
                  border: '1px solid rgba(197, 160, 89, 0.5)',
                  color: '#FFFDF9',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                title="Rotate View by 90°"
              >
                <span>🔄</span> Rotate 90°
              </button>
            </div>

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

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  color: '#C5A059',
                  backgroundColor: 'rgba(26, 18, 16, 0.7)',
                  padding: '0.3rem 0.85rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(197, 160, 89, 0.3)'
                }}
              >
                <span>👆</span> Drag horizontally to explore 3D temple ({activeAngleLabel})
              </div>
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

            {/* Bottom Sleek Darshan Bar */}
            <div
              style={{
                maxWidth: '680px',
                width: '92%',
                backgroundColor: 'rgba(26, 18, 16, 0.88)',
                backdropFilter: 'blur(12px)',
                border: '1.5px solid #C5A059',
                borderRadius: '16px',
                padding: '0.85rem 1.4rem',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                marginBottom: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'left', flex: 1, minWidth: '220px' }}>
                  <div style={{ fontSize: '1.05rem', color: '#FFD700', fontWeight: 700, lineHeight: 1.2 }}>
                    Blessed Pilgrimage at Vadapalli
                  </div>
                  <div style={{ color: '#E2E8F0', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    Stay just 200m from Sri Venkateswara Swamy Temple.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleContinueToBooking}
                    className="btn btn-primary"
                    style={{
                      padding: '0.55rem 1.25rem',
                      fontSize: '0.88rem',
                      backgroundColor: '#701A1E',
                      border: '1px solid #C5A059'
                    }}
                  >
                    📅 Book Room Below ↓
                  </button>
                  <a
                    href="https://wa.me/918555085539?text=Namaste,%20I%20would%20like%20to%20inquire%20about%20temple%20accommodation."
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{
                      padding: '0.55rem 1.1rem',
                      fontSize: '0.88rem',
                      borderColor: '#C5A059',
                      color: '#FFD700'
                    }}
                  >
                    💬 WhatsApp
                  </a>
                </div>
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
    </ThreeErrorBoundary>
  );
};

// Preload both assets with MeshoptDecoder explicitly configured
useGLTF.preload(TEMPLE_MODEL_PATH, true, true, configureGLTFLoader);
useGLTF.preload(SWAMY_MODEL_PATH, true, true, configureGLTFLoader);

export default CinematicTempleJourney;
