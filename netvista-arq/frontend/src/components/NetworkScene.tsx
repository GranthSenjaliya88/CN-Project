// src/components/NetworkScene.tsx
// React Three Fiber 3D scene for the ARQ simulation

import { useRef, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// HTML labels stay sharp and need no remote font download.
function Text({children,position,fontSize=0.2,color}: {children:ReactNode;position:[number,number,number];fontSize?:number;color?:string;anchorX?:string;anchorY?:string;outlineColor?:string;outlineWidth?:number}) {
 return <Html position={position} center style={{pointerEvents:'none',whiteSpace:'nowrap',fontSize:Math.max(10,fontSize*55),fontWeight:600,color,background:'rgba(7,13,26,.75)',padding:'2px 5px',borderRadius:4}}>{children}</Html>;
}
import type { InFlightPacket, LiveSenderState, LiveReceiverState } from '../types/simulation';

// ─── Sender workstation ──────────────────────────────────────────────────────
function SenderMesh({ state, time }: { state: LiveSenderState; time:number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const isTimeout = state.state === 'Retransmitting';
  const isComplete = state.state === 'Complete';



  const color = isTimeout ? '#fb923c' : isComplete ? '#4ade80' : '#22d3ee';

  return (
    <group position={[-4.5, 0, 0]}>
      {/* Glow light */}
      <pointLight ref={glowRef} color={color} intensity={1.5} distance={4} />

      {/* Main body */}
      <mesh ref={meshRef} rotation={[0, Math.sin(time / 3000) * 0.15, 0]} castShadow>
        <boxGeometry args={[1.5, 1.15, 0.6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isTimeout ? 0.6 : 0.3}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Screen face */}
      <mesh position={[0, 0, 0.31]}>
        <planeGeometry args={[1.25, 0.85]} />
        <meshStandardMaterial
          color="#0d1a2e"
          emissive={color}
          emissiveIntensity={0.1}
        />
      </mesh>

      <mesh position={[0,-0.65,0]}><boxGeometry args={[0.15,0.35,0.15]}/><meshStandardMaterial color="#334155"/></mesh>
      {/* Base */}
      <mesh position={[0, -0.85, 0]} receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.1, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Label */}
      <Text
        position={[0, 1.65, 0]}
        fontSize={0.28}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineColor="#000"
        outlineWidth={0.02}
      >
        SENDER
      </Text>

      {/* State label */}
      <Text
        position={[0, 1.28, 0]}
        fontSize={0.16}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        {state.state}
      </Text>

      {/* Sequence label */}
      {state.sequence !== null && (
        <Text
          position={[0, 1.02, 0]}
          fontSize={0.15}
          color="#60a5fa"
          anchorX="center"
          anchorY="middle"
        >
          {`Seq: ${state.sequence} | Msg: ${state.currentMessage}`}
        </Text>
      )}
    </group>
  );
}

// ─── Receiver workstation ────────────────────────────────────────────────────
function ReceiverMesh({ state, time }: { state: LiveReceiverState; time:number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  const isDuplicate = state.lastOutcome === 'duplicate';



  const color = isDuplicate ? '#fb923c' : '#4ade80';

  return (
    <group position={[4.5, 0, 0]}>
      <pointLight ref={glowRef} color={color} intensity={0.5} distance={4} />

      <mesh ref={meshRef} rotation={[0, Math.sin(time / 3000) * 0.15, 0]} castShadow>
        <boxGeometry args={[1.5, 1.15, 0.6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isDuplicate ? 0.5 : 0.2}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0, 0, 0.31]}>
        <planeGeometry args={[1.25, 0.85]} />
        <meshStandardMaterial color="#0d1a2e" emissive={color} emissiveIntensity={0.1} />
      </mesh>

      <mesh position={[0, -0.85, 0]} receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.1, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      <Text position={[0, 1.65, 0]} fontSize={0.28} color={color}
        anchorX="center" anchorY="middle" outlineColor="#000" outlineWidth={0.02}>
        RECEIVER
      </Text>
      <Text position={[0, 1.28, 0]} fontSize={0.16} color="#94a3b8"
        anchorX="center" anchorY="middle">
        {state.state}
      </Text>
      <Text position={[0, 1.02, 0]} fontSize={0.15} color="#60a5fa"
        anchorX="center" anchorY="middle">
        {`Exp Seq: ${state.expectedSeq} | Delivered: ${state.uniqueDelivered}`}
      </Text>
    </group>
  );
}

// ─── In-flight packet ────────────────────────────────────────────────────────
function PacketMesh({
  packet, currentTimeMs,
}: {
  packet: InFlightPacket;
  currentTimeMs: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const progress = useMemo(() => {
    const range = packet.arriveTimeMs - packet.launchTimeMs;
    if (range <= 0) return 1;
    return Math.min(1, Math.max(0,
      (currentTimeMs - packet.launchTimeMs) / range
    ));
  }, [currentTimeMs, packet]);

  const color = packet.direction === 'ack'
    ? '#4ade80'
    : packet.isRetransmission ? '#fb923c' : '#60a5fa';

  const startX = packet.direction === 'data' ? -3.8 : 3.8;
  const endX = packet.direction === 'data' ? 3.8 : -3.8;
  const y = packet.direction === 'data' ? 0.6 : -0.6;

  const x = startX + (endX - startX) * progress;



  return (
    <group position={[x, y, 0]}>
      <pointLight color={color} intensity={1.5} distance={1.5} />
      <mesh ref={meshRef} rotation={[0, currentTimeMs / 180, 0]} castShadow>
        <boxGeometry args={[0.5, 0.22, 0.18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      <Text
        position={[0, 0.28, 0]}
        fontSize={0.14}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineColor="#000"
        outlineWidth={0.015}
      >
        {`${packet.label} · M${packet.msgId}`}
      </Text>
      <Text position={[0,-0.32,0]} fontSize={0.12} color="#cbd5e1">{`${Math.max(0,packet.arriveTimeMs-currentTimeMs).toFixed(0)} ms to arrival`}</Text>
    </group>
  );
}

// ─── Channel lanes ────────────────────────────────────────────────────────────
function ChannelLanes() {
  return (
    <>
      {[-4.5,4.5].map(x=><mesh key={x} position={[x,-1.04,0]} receiveShadow><cylinderGeometry args={[1.2,1.4,.18,48]}/><meshStandardMaterial color="#17324a" metalness={.65} roughness={.35}/></mesh>)}
      {[-2,0,2].map(x=><group key={x}><mesh position={[x,.6,-.1]} rotation={[0,0,-Math.PI/2]}><coneGeometry args={[.12,.3,3]}/><meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={.5}/></mesh><mesh position={[x,-.6,-.1]} rotation={[0,0,Math.PI/2]}><coneGeometry args={[.12,.3,3]}/><meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={.5}/></mesh></group>)}
      {/* Upper lane — DATA */}
      <mesh position={[0, 0.6, -0.1]}>
        <boxGeometry args={[9, 0.04, 0.04]} />
        <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.4} opacity={0.6} transparent />
      </mesh>
      {/* Lower lane — ACK */}
      <mesh position={[0, -0.6, -0.1]}>
        <boxGeometry args={[9, 0.04, 0.04]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.4} opacity={0.6} transparent />
      </mesh>
      {/* Lane labels */}
      <Text position={[0, 0.9, 0]} fontSize={0.15} color="#60a5fa" anchorX="center">DATA →</Text>
      <Text position={[0, -0.9, 0]} fontSize={0.15} color="#4ade80" anchorX="center">← ACK</Text>
    </>
  );
}

// ─── Timeout ring ────────────────────────────────────────────────────────────
function TimeoutRing({ visible, elapsed }: { visible: boolean; elapsed:number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  if (!visible) return null;
  return (
    <mesh ref={ringRef} position={[-4.5, 0, 0]} scale={1 + Math.min(1,elapsed/150)}>
      <torusGeometry args={[1, 0.05, 8, 32]} />
      <meshStandardMaterial color="#f87171" emissive="#f87171" emissiveIntensity={1} transparent opacity={Math.max(0.1,1-elapsed/150)} />
    </mesh>
  );
}

// ─── Main NetworkScene component ─────────────────────────────────────────────
export interface NetworkSceneProps {
  sender: LiveSenderState;
  receiver: LiveReceiverState;
  inFlight: InFlightPacket[];
  currentTimeMs: number;
  isTimeout?: boolean;
  cameraReset?: number;
  reducedMotion?: boolean;
}

export function NetworkScene({
  sender, receiver, inFlight, currentTimeMs, isTimeout = false, cameraReset = 0, reducedMotion = false,
}: NetworkSceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 380 }}>
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 3, 8], fov: 40 }}
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
        <pointLight position={[-6, 4, 4]} color="#22d3ee" intensity={0.8} />
        <pointLight position={[6, 4, 4]} color="#4ade80" intensity={0.8} />

        {/* Grid floor */}
        <Grid
          position={[0, -1.2, 0]}
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#0d2d4a"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#0d2d4a"
          fadeDistance={20}
          fadeStrength={1}
          infiniteGrid
        />

        {/* Environment fog */}
        <fog attach="fog" args={['#070d1a', 12, 30]} />

        {/* Protocol objects */}
        <SenderMesh state={sender} time={reducedMotion?0:currentTimeMs} />
        <ReceiverMesh state={receiver} time={reducedMotion?0:currentTimeMs} />
        <ChannelLanes />
        <Text position={[-4.5,-1.5,0]} fontSize={0.13} color="#22d3ee">{sender.timerStartMs===null?'Timer idle':`Timeout in ${Math.max(0,sender.timeoutMs-(currentTimeMs-sender.timerStartMs)).toFixed(0)} ms`}</Text>
        <Text position={[4.5,-1.5,0]} fontSize={0.13} color="#4ade80">{`${receiver.pendingAcks} ACK pending`}</Text>
        <TimeoutRing visible={isTimeout && !reducedMotion} elapsed={currentTimeMs-(sender.timerStartMs??currentTimeMs)} />

        {/* In-flight packets */}
        {inFlight.map(pkt => (
          <PacketMesh key={pkt.id} packet={pkt} currentTimeMs={currentTimeMs} />
        ))}

        {/* Controls */}
        <CameraControls reset={cameraReset} />
      </Canvas>
    </div>
  );
}

function CameraControls({reset}:{reset:number}) {
 const ref=useRef<OrbitControlsImpl>(null);
 const {camera,size,invalidate}=useThree();
 useEffect(()=>{
  const distance=Math.max(8,16/Math.max(size.width/size.height,0.55));
  camera.position.set(0,3,distance);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  ref.current?.target.set(0,0,0);ref.current?.update();invalidate();
 },[reset,camera,size.width,size.height,invalidate]);
 return <OrbitControls ref={ref} enablePan={false} minDistance={6} maxDistance={36} minPolarAngle={0.2} maxPolarAngle={Math.PI/2.2} target={[0,0,0]} />;
}
