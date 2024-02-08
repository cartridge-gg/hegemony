import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDojo } from "@/dojo/useDojo";
import { useComponentValue, useEntityQuery } from "@dojoengine/react";
import { Entity, Has } from "@dojoengine/recs";
import { useNavigate } from "react-router-dom";

export const GameTable = () => {
  const {
    setup: {
      clientComponents: { Game },
    },
  } = useDojo();

  const games = useEntityQuery([Has(Game)]);

  const headings = ["Game", "Players", "Status", "Start Time", "Actions"];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headings.map((heading) => (
            <TableCell key={heading}>{heading}</TableCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {games.map((entity, index) => {
          return <GameTableRow key={index} entity={entity} />;
        })}
      </TableBody>
    </Table>
  );
};

interface GameTableRowProps {
  entity: Entity;
}

export const GameTableRow = ({ entity }: GameTableRowProps) => {
  const {
    setup: {
      clientComponents: { Game },
      systemCalls: { join_game, start_game, spawn_player },
    },
    account,
  } = useDojo();
  const navigate = useNavigate();
  const setGameQueryParam = (id: string) => {
    navigate("?game=" + id, { replace: true });
  };

  const game = useComponentValue(Game, entity);

  const timeFormatted = (time: number) => {
    return new Date(time * 1000).toLocaleTimeString("en-US");
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Button onClick={() => setGameQueryParam(game?.game_id.toString() ?? "1")}>GO</Button>
        {game?.game_id}
      </TableCell>
      <TableCell>{game?.players}</TableCell>
      {/* <TableCell>{game?.status}</TableCell> */}
      <TableCell>{timeFormatted(game?.start_time || 0)}</TableCell>

      <TableCell className="flex">
        <Button
          onClick={() =>
            join_game({ account: account.account, game_id: game?.game_id || 0 })
          }
        >
          join
        </Button>

        <Button
          onClick={() =>
            start_game({
              account: account.account,
              game_id: game?.game_id ?? 1,
            })
          }
        >
          start
        </Button>

        <Button
          onClick={() => spawn_player({ account: account.account, game_id: game?.game_id ?? 1 })}
        >
          spawn
        </Button>
      </TableCell>
    </TableRow>
  );
};
