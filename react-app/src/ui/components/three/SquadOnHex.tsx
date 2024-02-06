import { useComponentValue } from "@dojoengine/react";
import * as THREE from "three";
import { Entity } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import { Move } from "@/store";
import { Troop } from "./Troop";
import { useGameState } from "@/hooks/useGameState";
import { useMemo } from "react";

export const troopStateColours = {
  toCommit: "#ff0000",
  toReveal: "#00ff00",
  toResolve: "#0000ff",
  commited: "#ff00ff",
};

export const SquadOnHex = ({
  position,
  entity,
  commitmentMove,
  depth,
}: {
  position: any;
  entity: Entity;
  commitmentMove?: Move;
  depth?: number;
}) => {
  const {
    setup: {
      clientComponents: { Squad },
    },
  } = useDojo();

  const squadOnHex = useComponentValue(Squad, entity);

  const { isCommitStage, isRevealStage } = useGameState();

  const colour = useMemo(() => {
    if (isCommitStage) {
      return troopStateColours.toCommit;
    }

    if (isRevealStage) {
      return troopStateColours.toReveal;
    }

    return troopStateColours.toResolve;
  }, [isCommitStage, isRevealStage]);

  return (
    <Troop
      text={`id: ${squadOnHex?.squad_id}  qty: ${squadOnHex?.unit_qty}`}
      position={new THREE.Vector3(position[0], position[1], depth)}
      color={colour}
    />
  );
};
