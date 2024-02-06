import { Commitment } from "@/ui/modules/Commitment";
import { GameClock } from "@/ui/components/GameClock";
import { Game } from "@/ui/scenes/Game";
import { MapControls } from "../modules/MapControls";

export const GameScreen = () => {
  return (
    <div
      id="canvas-container"
      className="left-0 absolute top-0 w-screen h-screen overflow-hidden"
    >
      <Commitment />
      <MapControls />
      <GameClock />
      <Game />
    </div>
  );
};
