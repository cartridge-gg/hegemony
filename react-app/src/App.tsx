import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import { useEffect, useState } from "react";
import "./App.css";
import { Direction } from "./utils";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useDojo } from "./dojo/useDojo";
import { Grid } from "./ui/components/Hex";
import { Button } from "./components/ui/button";
import { Commitment } from "./ui/components/Commitment";
import { GameClock } from "./ui/components/GameClock";
import { Canvas } from "@react-three/fiber";
import { ThreeGrid } from "./ui/components/Three";

function App() {
  const {
    setup: {
      systemCalls: { create_game },
      clientComponents: { Position },
      client: { game_lobby, spawn },
    },
    account,
  } = useDojo();

  // entity id we are syncing
  const entityId = getEntityIdFromKeys([
    BigInt(account?.account.address),
  ]) as Entity;

  // get current component values
  const position = useComponentValue(Position, entityId);
  // const moves = useComponentValue(Moves, entityId);

  console.log(account.account);

  return (
    <div
      id="canvas-container"
      className="left-0 absolute top-0 w-screen h-screen"
    >
      <Button
        onClick={() => game_lobby.create_game({ account: account.account })}
        className="border px-2 "
      >
        create game
      </Button>
      <Button
        onClick={() =>
          game_lobby.join_game({ account: account.account, game_id: 1 })
        }
        className="border px-2 "
      >
        join game
      </Button>

      <Button
        onClick={() =>
          game_lobby.start_game({ account: account.account, game_id: 1 })
        }
        className="border px-2 "
      >
        start game
      </Button>

      <Button
        onClick={() =>
          spawn.spawn_player({ account: account.account, game_id: 1 })
        }
        className="border px-2 "
      >
        spawn player
      </Button>
      <Commitment />
      <GameClock />
      {/* <Grid rows={30} cols={30} hexSize={50} /> */}
      {/* <div className="left-0 absolute top-0 w-screen"> */}
      <ThreeGrid />
    </div>
  );
}

export default App;
