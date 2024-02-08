import { Cone, RoundedBox } from "@react-three/drei";
import { Vector3 } from "@react-three/fiber";

interface BaseProps {
  text?: string;
  position: THREE.Vector3;
  color?: string;
}

export const HomeBase = ({ position, text, color = "black" }: BaseProps) => {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={position}>
      <RoundedBox
        args={[2, 2, 2]} // Width, height, depth. Default is [1, 1, 1]
        radius={0.05} // Radius of the rounded corners. Default is 0.05
        smoothness={4} // The number of curve segments. Default is 4
        bevelSegments={4} // The number of bevel segments. Default is 4, setting it to 0 removes the bevel, as a result the texture is applied to the whole geometry.
        creaseAngle={0.4}
      >
        <meshPhongMaterial color={color} />
      </RoundedBox>
    </mesh>
  );
};
