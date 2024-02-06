import { useDojo } from "@/dojo/useDojo";
import { useEntityQuery } from "@dojoengine/react";
import { Has, HasValue, getComponentValue } from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useCallback, useMemo } from "react";
import { useQueryParams } from "./useQueryParams";
import { getContractByName } from "@dojoengine/core";
import { dojoConfig } from "../../dojoConfig";

export const useResolveMoves = () => {
  const {
    setup: {
      clientComponents: { Squad, PositionSquadCount, Position },
      client,
    },
    account: { account },
  } = useDojo();

  const { gameId } = useQueryParams();
  const { manifest } = dojoConfig();

  const player = BigInt(account.address);

  const squadsOnHex = useEntityQuery([
    Has(Squad),
    HasValue(Squad, {
      player,
    }),
  ]);

  const toResolvePositions = useMemo(() => {
    const positions = [];

    for (let i = 0; i < squadsOnHex.length; i++) {
      const position = getComponentValue(Position, squadsOnHex[i]);

      const checkForOtherSquads = getComponentValue(
        PositionSquadCount,
        getEntityIdFromKeys([
          BigInt(gameId),
          BigInt(position?.x || "0"),
          BigInt(position?.y || "0"),
        ])
      );

      if (checkForOtherSquads?.count && checkForOtherSquads?.count > 1)
        positions.push(position);
    }

    return positions;
  }, [squadsOnHex, gameId]);

  const resolveMoves = useCallback(() => {
    const movesMap = toResolvePositions.map((move) => ({
      entrypoint: "resolve_combat",
      contractAddress: getContractByName(manifest, "move").address,
      calldata: [gameId, move?.x || 0, move?.y || 0],
    }));

    return client.combat.combat_multi({ account, call_data: movesMap });
  }, [gameId, toResolvePositions, account]);

  return { toResolvePositions, resolveMoves };
};
