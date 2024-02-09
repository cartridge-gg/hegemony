import { useDojo } from "@/dojo/useDojo";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useEffect, useState } from "react";
import { useQueryParams } from "./useQueryParams";

const GAME_ID_CONFIG = 2096807177358152958712390915352935n;
const STAGES = ["Commit", "Reveal", "Resolve"];
const STAGE_COLOURS = ["bg-blue-500", "bg-green-500", "bg-red-200"];
const SECONDS_IN_DAY = 86400;
const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_MINUTE = 60;

export const useGameState = () => {
  const {
    setup: {
      clientComponents: { Game },
    },
    account,
  } = useDojo();
  const { gameId } = useQueryParams();

  const entityId = calculateEntityId(gameId);
  const game = useComponentValue(Game, entityId);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => setupTimer(game, setElapsedTime), [game]);

  const { totalDays, totalHours, currentStageIndex, totalCycles } =
    calculateGameProgress(game, elapsedTime);

  const { hoursLeft, minutesLeft, secondsLeft } = calculateTimeLeftInStage(
    game,
    elapsedTime,
    currentStageIndex
  );

  const isSpawnCycle = totalCycles == 0 ? false : totalCycles % 2 === 0;

  return {
    account,
    game,
    currentStage: STAGES[currentStageIndex],
    currentStageColour: STAGE_COLOURS[currentStageIndex],
    hoursLeft,
    minutesLeft,
    secondsLeft,
    totalDays,
    totalHours,
    elapsedTime,
    entityId,
    totalCycles,
    isCommitStage: currentStageIndex === 0,
    isRevealStage: currentStageIndex === 1,
    isResolveStage: currentStageIndex === 2,
    isSpawnCycle,
  };
};

const calculateEntityId = (gameId: number): Entity => {
  return getEntityIdFromKeys([BigInt(gameId), GAME_ID_CONFIG]) as Entity;
};

const setupTimer = (
  game: any,
  setElapsedTime: (time: number) => void
): (() => void) => {
  const interval = setInterval(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeElapsedInSeconds = currentTime - (game?.start_time || 0);
    setElapsedTime(timeElapsedInSeconds);
  }, 1000);

  return () => clearInterval(interval);
};

const calculateGameProgress = (game: any, elapsedTime: number) => {
  const totalDays = Math.floor(elapsedTime / SECONDS_IN_DAY);
  const totalHours = Math.floor(elapsedTime / SECONDS_IN_HOUR);
  const totalCycleUnits = Math.floor(elapsedTime / game?.cycle_unit);

  // A day measured in cycles is determined by the length of each stage
  const cycleUnitsOfCurrentYear = totalCycleUnits % (game.commit_length + game.reveal_length + game.resolve_length);
  
  //Default is Commit stage (STAGES[0])
  let currentStageIndex = 0;
  if (cycleUnitsOfCurrentYear > game.commit_length) {
    currentStageIndex = 1;
  } 
  if (cycleUnitsOfCurrentYear > (game.reveal_length + game.commit_length)) {
    currentStageIndex = 2;
  };
  const totalCycles = Math.floor(
    totalCycleUnits /
      (game?.commit_length + game?.reveal_length + game?.resolve_length)
  );

  return { totalDays, totalHours, currentStageIndex, totalCycles };
};

const calculateTimeLeftInStage = (game: any, elapsedTime: number, stageIndex : number) => {
  //Gets the total seconds in the current year(in-game year which is playing through each stage)
  const commitLengthSeconds = game.commit_length * game.cycle_unit;
  const revealLengthSeconds = game.reveal_length * game.cycle_unit;
  const resolveLengthSeconds = game.resolve_length * game.cycle_unit;

  const secondsInCurrentYear =  elapsedTime % (commitLengthSeconds + revealLengthSeconds + resolveLengthSeconds);
  
  let secondsLeftInStage = commitLengthSeconds - secondsInCurrentYear
  if(stageIndex === 1) {
    secondsLeftInStage = commitLengthSeconds + revealLengthSeconds - secondsInCurrentYear
  } else if(stageIndex === 2) {
    secondsLeftInStage = commitLengthSeconds + revealLengthSeconds + resolveLengthSeconds - secondsInCurrentYear
  }
  const hoursLeft = Math.floor(secondsLeftInStage / SECONDS_IN_HOUR);
  const minutesLeft = Math.floor(
    (secondsLeftInStage % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE
  );
  const secondsLeft = secondsLeftInStage % SECONDS_IN_MINUTE;

  return { hoursLeft, minutesLeft, secondsLeft };
};
