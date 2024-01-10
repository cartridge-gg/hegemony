#[starknet::interface]
trait IGameLobby<TContractState> {
    fn create_game(self: @TContractState);
    fn join_game(self: @TContractState, game_id: u32);
    fn start_game(self: @TContractState, game_id: u32);
}

#[dojo::contract]
mod game_lobby {
    use super::IGameLobby;

    use starknet::{
        ContractAddress, contract_address_const, get_caller_address, get_block_timestamp
    };

    use hegemony::models::{
        position::Position, squad::Squad,
        game::{
            GameCount, GAME_COUNT_CONFIG, Game, GAME_ID_CONFIG, GameStatus, GameTrait, GamePlayerId
        }
    };

    #[external(v0)]
    impl GameImpl of IGameLobby<ContractState> {
        fn create_game(self: @ContractState) {
            let world = self.world();

            // increment game count
            let mut game_count = get!(world, GAME_COUNT_CONFIG, GameCount);
            game_count.count += 1;

            let game = Game {
                game_id: game_count.count,
                game_id_config: GAME_ID_CONFIG,
                players: 0,
                status: GameStatus::Lobby,
                start_time: 0,
            };

            set!(world, (game_count, game));
        }

        fn join_game(self: @ContractState, game_id: u32) {
            let world = self.world();

            let player = get_caller_address();

            let mut game = get!(world, (game_id, GAME_ID_CONFIG), Game);

            game.assert_lobby();

            game.players += 1;

            let mut game_player_id = get!(world, (game_id, GAME_ID_CONFIG, player), GamePlayerId);

            game_player_id.id = game.players;

            set!(world, (game, game_player_id));
        }

        fn start_game(self: @ContractState, game_id: u32) {
            let world = self.world();

            let mut game = get!(world, (game_id, GAME_ID_CONFIG), Game);

            game.assert_lobby();

            game.status = GameStatus::InProgress;
            game.start_time = get_block_timestamp();

            set!(world, (game));
        }
    }
}
