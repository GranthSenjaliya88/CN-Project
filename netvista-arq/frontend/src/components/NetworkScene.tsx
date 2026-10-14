import { ComputerTower } from './ComputerTower';
// src/components/NetworkScene.tsx
// React Three Fiber 3D scene for the ARQ simulation

import { useRef, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Grid, RoundedBox, Line, Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// HTML labels stay sharp and need no remote font download.
function Text({children,position,fontSize=0.2,color}: {children:ReactNode;position:[number,number,number];fontSize?:number;color?:string;anchorX?:string;anchorY?:string;outlineColor?:string;outlineWidth?:number}) {
 const {size}=useThree();
 if(size.width<500 && fontSize<.2)return null;
 return <Html position={position} center style={{pointerEvents:'none',whiteSpace:'nowrap',fontSize:Math.max(10,fontSize*55),fontWeight:600,color,background:'rgba(7,13,26,.75)',padding:'2px 5px',borderRadius:4}}>{children}</Html>;
}
import type { InFlightPacket, LiveSenderState, LiveReceiverState } from '../types/simulation';

// Detailed local geometry: no external models or texture downloads.
function Workstation({x,label,state,detail,color}:{x:number;label:string;state:string;detail:string;color:string}) {
 return <group position={[x,0,0]}>
  <ComputerTower color={color} side={x<0?-1:1}/><RoundedBox args={[4.0,.16,2.3]} radius={.08} position={[0,-.91,.15]} receiveShadow><meshStandardMaterial color="#202c39" roughness={.24} metalness={.65}/></RoundedBox>
  {[-.95,.95].map(dx=><mesh key={dx} position={[dx,-1.1,.15]}><boxGeometry args={[.12,.4,1.3]}/><meshStandardMaterial color="#182638"/></mesh>)}
  <RoundedBox args={[1.95,1.25,.16]} radius={.055} position={[0,.18,-.15]} castShadow><meshStandardMaterial color="#596a7f" metalness={.55} roughness={.32}/></RoundedBox>
  <mesh position={[0,.18,-.059]}><planeGeometry args={[1.78,1.06]}/><meshStandardMaterial color="#071d2d" emissive="#123c57" emissiveIntensity={.7} roughness={.25}/></mesh>
  <mesh position={[0,-.59,-.16]}><boxGeometry args={[.16,.4,.16]}/><meshStandardMaterial color="#a4b2c3" metalness={.65} roughness={.3}/></mesh>
  <RoundedBox args={[.75,.055,.45]} radius={.02} position={[0,-.80,-.05]}><meshStandardMaterial color="#73849b" metalness={.55} roughness={.3}/></RoundedBox>
  <mesh position={[.78,-.36,-.055]}><sphereGeometry args={[.025,12,8]}/><meshBasicMaterial color={color}/></mesh>
  <mesh position={[0,.74,-.053]}><sphereGeometry args={[.025,12,8]}/><meshStandardMaterial color="#040b12"/></mesh>
  {/* Screen terminal lines and status indicator */}
  {[0,1,2,3,4].map(i=><mesh key={i} position={[-.22+(i%2)*.08,.43-i*.13,-.05]}><planeGeometry args={[.94-(i%3)*.18,.027]}/><meshBasicMaterial color={i===0?color:'#395f78'}/></mesh>)}
  <mesh position={[.58,.26,-.045]}><ringGeometry args={[.15,.18,32]}/><meshBasicMaterial color={color}/></mesh>
  <RoundedBox args={[1.4,.075,.48]} radius={.025} position={[-.1,-.79,.63]} castShadow><meshStandardMaterial color="#708094" metalness={.25} roughness={.5}/></RoundedBox>
  {Array.from({length:36},(_,i)=><mesh key={i} position={[-.69+(i%12)*.107,-.742,.49+Math.floor(i/12)*.11]}><boxGeometry args={[.078,.02,.075]}/><meshStandardMaterial color="#192b3f"/></mesh>)}
  <mesh position={[.96,-.705,.64]}><boxGeometry args={[.018,.02,.10]}/><meshBasicMaterial color={color}/></mesh>
  <mesh position={[.96,-.77,.64]} scale={[1,.5,1.6]}><sphereGeometry args={[.12,20,12]}/><meshStandardMaterial color="#92a3b7" roughness={.38}/></mesh>
  <Line points={[[.96,-.8,.45],[1.08,-.8,.15],[.75,-.8,-.4],[0,-.8,-.4],[0,-.4,-.24]]} color="#172537" lineWidth={2}/>
  <Text position={[0,1.27,0]} fontSize={.25} color={color}>{label}</Text>
  <Text position={[0,1.0,0]} fontSize={.16} color="#d5e2ee">{state}</Text>
  <Text position={[0,-1.45,.5]} fontSize={.14} color="#9bb8d0">{detail}</Text>
 </group>;
}
function SenderMesh({state}:{state:LiveSenderState}) {
 const color=state.state==='Retransmitting'?'#fb923c':state.state==='Complete'?'#4ade80':'#38bdf8';
 return <Workstation x={-4.5} label="SENDER" state={state.state} detail={`Message ${state.currentMessage??'—'} · Seq ${state.sequence??'—'} · Attempt ${state.attempt??'—'}`} color={color}/>;
}
function ReceiverMesh({state}:{state:LiveReceiverState}) {
 return <Workstation x={4.5} label="RECEIVER" state={state.state} detail={`Expected seq ${state.expectedSeq} · Delivered ${state.uniqueDelivered}`} color={state.lastOutcome==='duplicate'?'#fb923c':'#4ade80'}/>;
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

  const color = packet.lost ? '#ff4545' : packet.direction === 'ack'
    ? '#4ade80'
    : packet.isRetransmission ? '#fb923c' : '#60a5fa';

  const startX = packet.direction === 'data' ? -3.15 : 3.15;
  const endX = packet.lost ? 0 : packet.direction === 'data' ? 3.15 : -3.15;
  const y = (packet.direction === 'data' ? 0.6 : -0.6)+(packet.laneZ??0)*.6;
  const laneZ=packet.laneZ??0;

  const x = startX + (endX - startX) * progress;



  return (
    <group position={[x, y, laneZ]}>
      <Line points={[[-.20,.10,.07],[0,-.015,.07],[.20,.10,.07]]} color="#effaff" lineWidth={2}/>
      {[1,2,3,4,5,6,7,8].map(i=><mesh key={i} position={[(packet.direction==='data'?-1:1)*i*.12,0,0]} scale={[2,1,1]}><sphereGeometry args={[.055*(1-i/10),8,8]}/><meshBasicMaterial color={color} toneMapped={false} transparent opacity={.65-i*.07}/></mesh>)}
      <mesh ref={meshRef} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.48, 0.26, 0.12]} />
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
      {packet.laneZ===undefined&&<Text position={[0,-0.32,0]} fontSize={0.12} color="#cbd5e1">{`${Math.max(0,packet.arriveTimeMs-currentTimeMs).toFixed(0)} ms to ${packet.lost?'loss':'arrival'}`}</Text>}
    </group>
  );
}

// ─── Channel lanes ────────────────────────────────────────────────────────────
function ChannelLanes() {
  return (
    <>
      {[-2,0,2].map(x=><group key={x}><mesh position={[x,.6,-.1]} rotation={[0,0,-Math.PI/2]}><coneGeometry args={[.12,.3,3]}/><meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={.5}/></mesh><mesh position={[x,-.6,-.1]} rotation={[0,0,Math.PI/2]}><coneGeometry args={[.12,.3,3]}/><meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={.5}/></mesh></group>)}
      {/* Upper lane — DATA */}
      <mesh position={[0, 0.6, -0.1]}>
        <boxGeometry args={[6.3, 0.025, 0.025]} />
        <meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.4} opacity={0.6} transparent />
      </mesh>
      {/* Lower lane — ACK */}
      <mesh position={[0, -0.6, -0.1]}>
        <boxGeometry args={[6.3, 0.025, 0.025]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.4} opacity={0.6} transparent />
      </mesh>
      <Line points={[[-6,-.6,-.6],[-6,-1.22,-1.5],[-2,-1.22,-1.7],[2,-1.22,-1.7],[6,-1.22,-1.5],[6,-.6,-.6]]} color="#3f586e" lineWidth={4}/>
      {[-3.15,3.15].map(x=><group key={x} position={[x,.6,0]}><mesh><boxGeometry args={[.16,.18,.2]}/><meshStandardMaterial color="#38516a" metalness={.6}/></mesh><mesh position={[0,0,.11]}><planeGeometry args={[.10,.08]}/><meshBasicMaterial color="#67e8f9"/></mesh></group>)}
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
  cameraMode?: string;
  failures?: {time:number;direction:string;frame:number}[];
}

export function NetworkScene({
  sender, receiver, inFlight, currentTimeMs, isTimeout = false, cameraReset = 0, reducedMotion = false, cameraMode = "orbit", failures = [],
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
        <Environment resolution={128}><Lightformer form="rect" intensity={3} position={[0,6,2]} rotation={[Math.PI/2,0,0]} scale={[15,8,1]}/><Lightformer form="rect" intensity={2} color="#38bdf8" position={[-8,2,0]} rotation={[0,Math.PI/2,0]} scale={[6,5,1]}/></Environment>
        {/* Lighting */}
        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#dbeafe", "#24344b", 1.5]}/><directionalLight position={[2, 8, 6]} intensity={2.5} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={5} shadow-camera-bottom={-5}/>
        <pointLight position={[-6, 2, 2]} color="#22d3ee" intensity={8} />
        <pointLight position={[6, 2, 2]} color="#4ade80" intensity={8} />

        {/* Grid floor */}
        <Grid
          position={[0, -1.32, 0]}
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
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.34,0]} receiveShadow><planeGeometry args={[60,60]}/><MeshReflectorMaterial resolution={256} mirror={.3} mixStrength={.45} color="#111f32" metalness={.4} roughness={.45}/></mesh>
        <fog attach="fog" args={['#070d1a', 35, 80]} />

        {/* Protocol objects */}
        <SenderMesh state={sender} />
        <ReceiverMesh state={receiver} />
        <ChannelLanes />
        <Text position={[-4.5,-1.78,.5]} fontSize={0.13} color="#22d3ee">{sender.timerStartMs===null?'Timer idle':`Timeout in ${Math.max(0,sender.timeoutMs-(currentTimeMs-sender.timerStartMs)).toFixed(0)} ms`}</Text>
        <Text position={[4.5,-1.78,.5]} fontSize={0.13} color="#4ade80">{`${receiver.pendingAcks} ACK pending`}</Text>
        <TimeoutRing visible={isTimeout && !reducedMotion} elapsed={currentTimeMs-(sender.timerStartMs??currentTimeMs)} />

        {/* In-flight packets */}
        {inFlight.map(pkt => (
          <PacketMesh key={pkt.id} packet={pkt} currentTimeMs={currentTimeMs} />
        ))}

        {/* Controls */}
        {failures.filter(f=>currentTimeMs>=f.time&&currentTimeMs-f.time<500).map((f,i)=><group key={`${f.time}-${i}`} position={[0,f.direction==='data'?.6:-.6,0]}><mesh rotation={[0,0,Math.PI/4]}><boxGeometry args={[.7,.06,.06]}/><meshBasicMaterial color="#ff4545"/></mesh><mesh rotation={[0,0,-Math.PI/4]}><boxGeometry args={[.7,.06,.06]}/><meshBasicMaterial color="#ff4545"/></mesh><Text position={[0,.45,0]} color="#ff7070">{`${f.direction.toUpperCase()} ${f.frame} LOST`}</Text></group>)}
        <CameraControls reset={cameraReset} mode={cameraMode} packet={inFlight[0]} time={currentTimeMs} />
      </Canvas>
    </div>
  );
}

function CameraControls({reset,mode,packet,time}:{reset:number;mode:string;packet?:InFlightPacket;time:number}) {
 const ref=useRef<OrbitControlsImpl>(null);
 const {camera,size,invalidate}=useThree();
 useEffect(()=>{
  const distance=Math.max(8,16/Math.max(size.width/size.height,0.55));
  camera.position.set(mode==='overview'?4:2.6,mode==='overview'?7:4.2,distance+2);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  ref.current?.target.set(0,0,0);ref.current?.update();invalidate();
 },[reset,mode,camera,size.width,size.height,invalidate]);
 useEffect(()=>{
  if(mode!=='follow'||!packet)return;
  const progress=Math.min(1,Math.max(0,(time-packet.launchTimeMs)/(packet.arriveTimeMs-packet.launchTimeMs)));
  const start=packet.direction==='data'?-3.15:3.15;const end=packet.lost?0:-start;
  const x=start+(end-start)*progress;
  ref.current?.target.set(x,0,packet.laneZ??0);camera.position.set(x+1.5,2.5,6);ref.current?.update();invalidate();
 },[mode,packet,time,camera,invalidate]);
 return <OrbitControls ref={ref} enablePan={true} minDistance={6} maxDistance={42} minPolarAngle={0.2} maxPolarAngle={Math.PI/2.2} target={[0,0,0]} />;
}
