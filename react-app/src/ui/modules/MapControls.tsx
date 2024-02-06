import { Button } from "@/components/ui/button";
import { useStateStore } from "@/hooks/useStateStore";
import { GRID_SIZE } from "@/utils";

export const MapControls = () => {
  const { setMapCenter, mapCenter } = useStateStore();

  const moveMap = (dx: number, dy: number) => {
    setMapCenter({ x: mapCenter.x + dx, y: mapCenter.y + dy });
  };

  return (
    <div className="bg-white fixed top-0 right-0 z-10 p-4">
      <div>
        Current Position: {mapCenter.x}, {mapCenter.y}
      </div>
      <div className="flex flex-col items-center">
        <Button onClick={() => moveMap(0, -GRID_SIZE)}>North</Button>
        <div className="flex">
          <Button onClick={() => moveMap(-GRID_SIZE, 0)}>West</Button>
          <Button onClick={() => moveMap(GRID_SIZE, 0)} className="ml-2">
            East
          </Button>
        </div>
        <Button onClick={() => moveMap(0, GRID_SIZE)}>South</Button>
      </div>
    </div>
  );
};
