import { useGameState } from "@/hooks/useGameState";

export const GameClock = () => {
  const {
    currentStageColour,
    currentStage,
    hoursLeft,
    minutesLeft,
    secondsLeft,
    totalDays,
    totalCycles,
  } = useGameState();

  return (
    <div className="fixed top-0 right-0 p-2 bg-white z-10 border-b border-l border-black flex text-sm uppercase space-x-6">
      <div className={`${currentStageColour} self-center`}>
        {currentStage}: {hoursLeft}h {minutesLeft}m {secondsLeft}s
      </div>
      <div className="self-center">Year: {totalCycles}</div>
    </div>
  );
};
