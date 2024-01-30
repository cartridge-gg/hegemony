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
    <div
      className={`${currentStageColour} px-2 fixed top-0 left-0 z-10 border border-black flex text-sm uppercase space-x-6 text-xl`}
    >
      <div className={` self-center`}>
        {currentStage}: {hoursLeft}h {minutesLeft}m {secondsLeft}s
      </div>
      <div className="self-center">Year: {totalCycles}</div>
    </div>
  );
};
