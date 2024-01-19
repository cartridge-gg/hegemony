import { useDojo } from "@/dojo/useDojo";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useEffect, useMemo, useState } from "react";
import { RpcProvider, num } from "starknet";
import { useQueryParams } from "./useQueryParams";

export const useGameState = () => {
  const {
    setup: {
      clientComponents: { Squad, Game },
    },
    account,
  } = useDojo();

  const { gameId } = useQueryParams();

  const gameIdConfig = 2096807177358152958712390915352935n;

  const entityId = getEntityIdFromKeys([
    BigInt(gameId),
    BigInt(gameIdConfig),
  ]) as Entity;

  const game = useComponentValue(Game, entityId);

  const [elapsedTime, setElapsedTime] = useState(0);

  const stages = ["Commit", "Reveal", "Resolve"];

  const stageColours = ["bg-blue-500", "bg-green-500", "bg-red-200"];

  useEffect(() => {
    // Update the elapsed time every second
    const interval = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeElapsedInSeconds = currentTime - (game?.start_time || 0);
      setElapsedTime(timeElapsedInSeconds);
    }, 1000);

    // Clear the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const totalDays = Math.floor(elapsedTime / 86400);
  const totalHours = Math.floor(elapsedTime / 3600);

  const totalCycleUnits = Math.floor(elapsedTime / game?.cycle_unit);
  const currentStageIndex = Math.floor(totalCycleUnits / 8) % stages.length;
  const currentStage = stages[currentStageIndex];

  const totalCycles = Math.floor(
    totalCycleUnits /
      (game?.commit_length, game?.reveal_length, game?.resolve_length)
  );

  const currentStageColour = stageColours[currentStageIndex];

  const secondsLeftInStage =
    8 * game?.cycle_unit - (elapsedTime % (8 * game?.cycle_unit));

  const hoursLeft = Math.floor(secondsLeftInStage / 3600);
  const minutesLeft = Math.floor((secondsLeftInStage % 3600) / 60);
  const secondsLeft = secondsLeftInStage % 60;

  const isCommitStage = currentStage === "Commit";
  const isRevealStage = currentStage === "Reveal";
  const isResolveStage = currentStage === "Resolve";

  return {
    account,
    game,
    currentStage,
    currentStageColour,
    hoursLeft,
    minutesLeft,
    secondsLeft,
    totalDays,
    totalHours,
    elapsedTime,
    entityId,
    totalCycles,
    isCommitStage,
    isRevealStage,
    isResolveStage,
  };
};
