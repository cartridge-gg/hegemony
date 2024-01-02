#[starknet::interface]
trait ISpawn<TContractState> {
    fn spawn_squad(self: @TContractState, game_id: u32);
}

#[dojo::contract]
mod spawn {
    use super::ISpawn;
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::models::{
        position::{Position, PositionSquadCount}, squad::{Squad, PlayerSquadCount},
        game::{GameCount, GAME_ID_CONFIG, Game, GameStatus}
    };

    #[external(v0)]
    impl SpawnImpl of ISpawn<ContractState> {
        fn spawn_squad(self: @ContractState, game_id: u32) {
            let world = self.world();

            let game = get!(world, (game_id, GAME_ID_CONFIG), Game);

            // TODO: complete lobby logic - this is dumb check right now
            assert(game.status != GameStatus::NotStarted, 'Game has not started yet');

            let caller = get_caller_address();

            // increment squads
            let mut squad_count = get!(world, (game_id, caller), PlayerSquadCount);
            squad_count.count += 1;

            // make a squad
            let squad = Squad {
                game_id, player: caller, squad_id: squad_count.count, unit_qty: 10
            };

            // TODO: Placement algorithm - we should add new players in a concentric circle around the center so none are too far from others
            let x = 10;
            let y = 10;

            // set position
            let position = Position { game_id, player: caller, squad_id: squad_count.count, x, y };

            let mut new_position_squad_count = get!(world, (game_id, x, y), PositionSquadCount);
            new_position_squad_count.count += 1;

            set!(world, (squad, position, squad_count, new_position_squad_count));
        }
    }
}
