import { Text, Billboard as ThreeBillboard, Plane } from "@react-three/drei";
import { Vector3 } from "three";

export const Billboard = ({
  text,
  position,
  color = "black",
}: {
  text: string;
  position: Vector3;
  color?: string;
}) => {
  return (
    <ThreeBillboard follow position={position}>
      <Text
        fontSize={0.4}
        outlineColor="#000000"
        outlineOpacity={1}
        outlineWidth="5%"
      >
        {text}
      </Text>
      <Plane args={[5, 1]} material-color={color} />
    </ThreeBillboard>
  );
};
