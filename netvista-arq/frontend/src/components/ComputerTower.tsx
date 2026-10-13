import { RoundedBox, Line } from '@react-three/drei';
export function ComputerTower({color,side}:{color:string;side:number}){
 return <group position={[side*1.5,-.04,-.05]}>
  <RoundedBox args={[.72,1.55,.95]} radius={.055} castShadow><meshStandardMaterial color="#25354a" metalness={.65} roughness={.24}/></RoundedBox>
  <mesh position={[0,0,.483]}><planeGeometry args={[.61,1.38]}/><meshPhysicalMaterial color="#142a3e" transparent opacity={.38} roughness={.12} metalness={.2} depthWrite={false}/></mesh>
  {[-.39,.23].map(y=><group key={y} position={[0,y,.49]}><mesh><torusGeometry args={[.23,.024,8,40]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh><mesh><circleGeometry args={[.19,32]}/><meshStandardMaterial color="#33485c" metalness={.7} roughness={.25}/></mesh>{[0,1,2,3,4,5].map(i=><mesh key={i} rotation={[0,0,i*Math.PI/3]} position={[0,0,.01]}><boxGeometry args={[.3,.035,.012]}/><meshStandardMaterial color="#64788e"/></mesh>)}<mesh position={[0,0,.025]}><circleGeometry args={[.06,16]}/><meshBasicMaterial color={color}/></mesh></group>)}
  {[-.29,.29].map(x=><mesh key={x} position={[x,0,.505]}><boxGeometry args={[.016,1.35,.018]}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>)}
  {[-.16,.03].map(x=><mesh key={x} position={[x,.62,.51]}><boxGeometry args={[.1,.035,.025]}/><meshStandardMaterial color="#030912"/></mesh>)}
  <mesh position={[.23,.63,.51]}><sphereGeometry args={[.024,12,8]}/><meshBasicMaterial color={color}/></mesh>
  {Array.from({length:8},(_,i)=><mesh key={i} position={[0,.785,-.3+i*.08]}><boxGeometry args={[.45,.008,.022]}/><meshStandardMaterial color="#030912"/></mesh>)}
  <Line points={[[0,-.5,-.5],[0,-.8,-.9],[-side*.8,-.8,-1],[-side*1.5,-.5,-.25]]} color="#354c66" lineWidth={3}/>
 </group>;
}
