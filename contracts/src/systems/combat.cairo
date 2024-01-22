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

    use hegemony::systems::{move::move};

    use alexandria_data_structures::array_ext::{ArrayTraitExt, SpanTraitExt};


    #[external(v0)]
    impl CombatImpl of ICombat<ContractState> {
        // only works with two squads rigth now - the first two squads on the hex
        fn resolve_combat(self: @ContractState, game_id: u32, x: u32, y: u32) {
            let world = self.world();

            get!(world, (game_id, GAME_ID_CONFIG), Game).assert_resolve_stage();

            let squads = move::get_squads_on_position(world, game_id, x, y);

            if (squads.len() > 1) {
                let mut squad_one = *squads.at(0);
                let mut squad_two = *squads.at(1);
                // draw kills both
                if (*squads.at(0).unit_qty == *squads.at(1).unit_qty) {
                    squad_one.unit_qty = 0;
                    squad_two.unit_qty = 0;

                    let position_count = PositionSquadCount { game_id, x, y, count: 0 };
                    set!(world, (squad_one, squad_two, position_count));
                // squad one wins
                } else if (*squads.at(0).unit_qty >= *squads.at(1).unit_qty) {
                    squad_one.unit_qty -= *squads.at(1).unit_qty;

                    squad_two.unit_qty = 0;

                    let position_count = PositionSquadCount { game_id, x, y, count: 1 };
                    set!(world, (squad_one, squad_two, position_count));
                // squad two wins
                } else {
                    squad_one.unit_qty = 0;

                    squad_two.unit_qty -= *squads.at(0).unit_qty;

                    let position_count = PositionSquadCount { game_id, x, y, count: 1 };
                    set!(world, (squad_one, squad_two, position_count));
                }
            }
        }
    }
}

