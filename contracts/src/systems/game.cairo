#[dojo::contract]
mod lobby {
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::models::{
        position::Position, squad::Squad,
        game::{GameCount, GAME_COUNT_CONFIG, Game, GAME_ID_CONFIG, GameStatus}
    };

    // TODO: Complete Lobby System
    #[generate_trait]
    #[external(v0)]
    impl LobbyImpl of ILobby {
        fn create_game(self: @ContractState) {
            let world = self.world();

            // increment game count
            let mut game_count = get!(world, GAME_COUNT_CONFIG, GameCount);
            game_count.count += 1;

            let game = Game {
                game_id: game_count.count,
                game_id_config: GAME_ID_CONFIG,
                players: 0,
                status: GameStatus::Lobby
            };

            set!(world, (game_count, game));
        }
    }
}
