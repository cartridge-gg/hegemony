import { Vector3 } from "three";
import { QuadraticBezierLine } from "@react-three/drei";

const ArcArrow = ({ start, end }: any) => {
  const vec3Start = new Vector3(start[0], start[1], start[2] + 5);

  const vec3End = new Vector3(end[0], end[1], end[2] + 5);

  const midpoint = new Vector3().lerpVectors(vec3Start, vec3End, 0.5);

  return (
    <>
      <mesh>
        <QuadraticBezierLine
          start={start} // Starting point, can be an array or a vec3
          end={end} // Ending point, can be an array or a vec3
          mid={midpoint} // Optional control point, can be an array or a vec3
          color="red" // Default
          lineWidth={3} // In pixels (default)
          dashed={false} // Default
        />
      </mesh>
    </>
  );
};

export default ArcArrow;
