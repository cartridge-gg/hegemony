#[dojo::contract]
mod move {
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::models::{
        position::{Position, SquadCommitmentHash}, squad::{Squad},
        game::{GameCount, GAME_COUNT_CONFIG, Game, GAME_ID_CONFIG, GameStatus}
    };

    use origami::security::commitment::{Commitment, CommitmentTrait};

    // TODO: Complete Lobby System
    #[generate_trait]
    #[external(v0)]
    impl MoveImpl of IMove {
        fn move_squad_commitment(self: @ContractState, game_id: u32, squad_id: u32, hash: felt252) {
            let world = self.world();

            let game = get!(world, (game_id, GAME_ID_CONFIG), Game);

            // TODO: complete lobby logic - this is dumb check right now
            assert(game.status != GameStatus::NotStarted, 'Game has not started yet');

            // check squad is owned by caller
            // TODO: squad checks
            let player = get_caller_address();

            let squad_commitment_hash = SquadCommitmentHash { game_id, player, squad_id, hash };

            set!(world, (squad_commitment_hash));
        }

        fn move_squad_reveal(self: @ContractState, game_id: u32, squad_id: u32, x: u32, y: u32) {
            let world = self.world();

            let game = get!(world, (game_id, GAME_ID_CONFIG), Game);
        }
    }
}
