import { useDojo } from "@/dojo/useDojo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const GameLobby = () => {
  const {
    setup: {
      client: { game_lobby, spawn },
    },
    account,
  } = useDojo();
  const navigate = useNavigate();
  const setGameQueryParam = (id: string) => {
    navigate("?game=" + id, { replace: true });
  };

  return (
    <div className="w-screen h-screen bg-black flex justify-center text-white ">
      <div className="w-1/2 self-center text-center">Hegemony</div>
      <div className="w-1/2 self-center text-center">
        <div className="flex flex-col w-36 space-y-2">
          <Button
            onClick={() =>
              game_lobby.create_game({
                account: account.account,
                commit_length: 8,
                reveal_length: 8,
                resolve_length: 8,
                cycle_unit: 360,
              })
            }
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
          <Button onClick={() => setGameQueryParam("1")}>go to game</Button>
        </div>
      </div>
    </div>
  );
};
