#[starknet::interface]
trait ICombat<TContractState> {
    fn resolve_combat(self: @TContractState, game_id: u32, x: u32, y: u32);
}

#[dojo::contract]
mod combat {
    use super::ICombat;
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::models::{
        position::Position, squad::{Squad, PlayerSquadCount},
        game::{GameCount, GAME_ID_CONFIG, Game, GameStatus}
    };

    #[external(v0)]
    impl CombatImpl of ICombat<ContractState> {
        fn resolve_combat(self: @ContractState, game_id: u32, x: u32, y: u32) {
            let world = self.world();

            let game = get!(world, (game_id, GAME_ID_CONFIG), Game);

            // TODO: complete lobby logic - this is dumb check right now
            assert(game.status != GameStatus::NotStarted, 'Game has not started yet');

            let caller = get_caller_address();
        // get squads on hex

        // sum up squads

        // calculate combat

        // resolve
        }
    }
}
