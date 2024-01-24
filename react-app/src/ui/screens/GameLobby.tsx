import { useDojo } from "@/dojo/useDojo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const GameLobby = () => {
  const {
    setup: {
      systemCalls: { create_game, join_game, start_game, spawn_player },
    },
    account,
  } = useDojo();
  const navigate = useNavigate();
  const setGameQueryParam = (id: string) => {
    navigate("?game=" + id, { replace: true });
  };

  return (
    <div className="w-screen h-screen bg-black flex justify-center text-white p-10">
      <div className="w-1/2 self-center text-center">Hegemony</div>
      <div className="w-1/2  text-center">
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Your Games</TabsTrigger>
            <TabsTrigger value="password">Create Game</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            Make changes to your account here.
          </TabsContent>
          <TabsContent value="password">
            <div className="flex flex-col w-36 space-y-2">
              <Button
                onClick={() =>
                  create_game({
                    account: account.account,
                    commit_length: 8,
                    reveal_length: 8,
                    resolve_length: 8,
                    cycle_unit: 60,
                  })
                }
                className="border px-2 "
              >
                {"create game"}
              </Button>
              <Button
                onClick={() =>
                  join_game({ account: account.account, game_id: 1 })
                }
                className="border px-2 "
              >
                join game
              </Button>

              <Button
                onClick={() =>
                  start_game({
                    account: account.account,
                    game_id: 1,
                  })
                }
                className="border px-2 "
              >
                start game
              </Button>

              <Button
                onClick={() =>
                  spawn_player({ account: account.account, game_id: 1 })
                }
                className="border px-2 "
              >
                spawn player
              </Button>
              <Button onClick={() => setGameQueryParam("1")}>go to game</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
