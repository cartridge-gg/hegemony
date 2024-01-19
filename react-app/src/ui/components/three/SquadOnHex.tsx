import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import { Move } from "@/store";
import { Troop } from "./Troop";

export const SquadOnHex = ({
  position,
  entity,
  commitmentMove,
}: {
  position: any;
  entity: Entity;
  commitmentMove?: Move;
}) => {
  const {
    setup: {
      clientComponents: { Squad },
    },
  } = useDojo();

  const squadOnHex = useComponentValue(Squad, entity);

  return (
    <Troop
      text={`id: ${squadOnHex?.squad_id}  qty: ${squadOnHex?.unit_qty}`}
      position={[position[0], position[1], 1]}
    />
  );
};
