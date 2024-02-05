import { useDojo } from "@/dojo/useDojo";
import { Button } from "@/components/ui/button";

import { GameTable } from "../components/GameTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { shortenHex } from "@dojoengine/utils";

export const GameLobby = () => {
  const {
    setup: {
      systemCalls: { create_game },
    },
    account: { account, select, list, clear, create },
  } = useDojo();

  return (
    <div className="w-screen h-screen  flex justify-center text-white ">
      <div className="w-1/3 text-center bg-gray-900 p-10 h-full">
        Hegemony
        <Select
          onValueChange={(value) => select(value)}
          defaultValue={account.address}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Addr" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {list().map((account, index) => {
                return (
                  <div key={index} className="flex">
                    <SelectItem value={account.address}>
                      {shortenHex(account.address)}
                    </SelectItem>
                    <Button size={"sm"} variant={"outline"} onClick={clear}>
                      X
                    </Button>
                  </div>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button variant={"default"} onClick={() => create()}>
          Deploy New
        </Button>
        <Button variant={"default"} onClick={() => clear()}>
          Clear
        </Button>
      </div>
      <div className="w-2/3  text-center bg-black p-10">
        <div className="flex w-36 space-y-2">
          <Button
            onClick={() =>
              create_game({
                account,
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
        </div>
        <GameTable />
      </div>
    </div>
  );
};
