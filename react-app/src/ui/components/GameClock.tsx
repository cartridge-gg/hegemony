import { useDojo } from "@/dojo/useDojo";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useEffect, useMemo, useState } from "react";
import { RpcProvider, num } from "starknet";

export const GameClock = () => {
  const {
    setup: {
      clientComponents: { Squad, Game },
    },
    account,
  } = useDojo();

  const rpcProvider = useMemo(
    () =>
      new RpcProvider({
        nodeUrl: "http://127.0.0.1:5050/",
      }),
    []
  );

  useEffect(() => {
    const blocktime = async () => {
      const data = await rpcProvider.getBlockLatestAccepted();

      console.log(data.block_number);
    };

    console.log(blocktime());
  }, []);

  const gameIdConfig = 2096807177358152958712390915352935n;

  const entityId = getEntityIdFromKeys([
    BigInt(1),
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
      const timeElapsedInSeconds = currentTime - game?.start_time;
      setElapsedTime(timeElapsedInSeconds);
    }, 1000);

    // Clear the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const totalDays = Math.floor(elapsedTime / 86400);
  const totalHours = Math.floor(elapsedTime / 3600);
  const currentStageIndex = Math.floor(totalHours / 8) % stages.length;
  const currentStage = stages[currentStageIndex];

  const currentStageColour = stageColours[currentStageIndex];

  // Convert elapsed time to hours, minutes, seconds
  const hoursInCurrentStage = totalHours % 8;

  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Math.floor((elapsedTime % 3600) / 60);
  const seconds = elapsedTime % 60;

  const secondsLeftInStage = 8 * 3600 - (elapsedTime % (8 * 3600));
  const hoursLeft = Math.floor(secondsLeftInStage / 3600);
  const minutesLeft = Math.floor((secondsLeftInStage % 3600) / 60);
  const secondsLeft = secondsLeftInStage % 60;

  return (
    <div className="fixed top-0 right-0 p-2 bg-white z-10 border-b border-l border-black flex text-sm uppercase space-x-6">
      {/* <div className="self-cente">
        {hours}h {minutes}m {seconds}s
      </div> */}
      <div className={`${currentStageColour} self-center`}>
        {currentStage}: {hoursLeft}h {minutesLeft}m {secondsLeft}s
      </div>
      <div className="self-center">Year: {totalDays}</div>
    </div>
  );
};
