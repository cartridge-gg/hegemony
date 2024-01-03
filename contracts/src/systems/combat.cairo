#[starknet::interface]
trait ICombat<TContractState> {
    fn resolve_combat(self: @TContractState, game_id: u32, x: u32, y: u32);
}

#[dojo::contract]
mod combat {
    use super::ICombat;
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::models::{
        position::{Position, PositionSquadCount, PositionSquadEntityIdByIndex},
        squad::{Squad, PlayerSquadCount},
        game::{GameCount, GAME_ID_CONFIG, Game, GameStatus, GameTrait}
    };

    use alexandria_data_structures::array_ext::{ArrayTraitExt, SpanTraitExt};

    #[external(v0)]
    impl CombatImpl of ICombat<ContractState> {
        fn resolve_combat(self: @ContractState, game_id: u32, x: u32, y: u32) {
            let world = self.world();

            get!(world, (game_id, GAME_ID_CONFIG), Game).assert_resolve_stage();

            let caller = get_caller_address();

            let position_squad_count = get!(world, (game_id, x, y), PositionSquadCount).count;

            let mut squads = ArrayTrait::<Squad>::new();
            let mut count: usize = 1;

            loop {
                if (count > position_squad_count.into()) {
                    break;
                }

                let squad_id = get!(world, (game_id, x, y, count), PositionSquadEntityIdByIndex);

                if (squad_id.squad_entity_id != 0) {
                    let mut squad = get!(world, (squad_id.squad_entity_id), Squad);

                    squads.append(squad);

                    // only count if not empty // should be fixed later
                    count += 1;
                }
            };

            if (squads.len() > 1) {
                // draw kills both
                if (*squads.at(0).unit_qty == *squads.at(1).unit_qty) {
                    let mut squad_one = *squads.at(0);
                    squad_one.unit_qty = 0;

                    let mut squad_two = *squads.at(1);
                    squad_two.unit_qty = 0;
                    set!(world, (squad_one, squad_two));
                // squad one wins
                } else if (*squads.at(0).unit_qty >= *squads.at(1).unit_qty) {
                    let mut squad_one = *squads.at(0);
                    squad_one.unit_qty -= *squads.at(1).unit_qty;

                    let mut squad_two = *squads.at(1);
                    squad_two.unit_qty = 0;
                    set!(world, (squad_one, squad_two));
                // squad two wins
                } else {
                    let mut squad_one = *squads.at(0);
                    squad_one.unit_qty = 0;

                    let mut squad_two = *squads.at(1);
                    squad_two.unit_qty -= *squads.at(0).unit_qty;
                    set!(world, (squad_one, squad_two));
                }
            }
        }
    }
}
