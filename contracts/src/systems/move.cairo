#[starknet::interface]
trait IMove<TContractState> {
    fn move_squad_commitment(self: @TContractState, game_id: u32, squad_id: u32, hash: felt252);
    fn move_squad_reveal(self: @TContractState, game_id: u32, squad_id: u32, x: u32, y: u32);
}

#[dojo::contract]
mod move {
    use super::IMove;
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::models::{
        position::{Position, SquadCommitmentHash, PositionSquadCount, PositionSquadEntityIdByIndex},
        squad::{Squad}, game::{GameCount, GAME_COUNT_CONFIG, Game, GAME_ID_CONFIG, GameStatus}
    };

    use origami::security::commitment::{Commitment, CommitmentTrait};

    use poseidon::poseidon_hash_span;

    #[external(v0)]
    impl MoveImpl of IMove<ContractState> {
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

            // TODO: complete lobby logic - this is dumb check right now
            assert(game.status != GameStatus::NotStarted, 'Game has not started yet');

            let player = get_caller_address();

            let hash = get!(world, (game_id, player, squad_id), SquadCommitmentHash).hash;

            let commitment = Commitment { hash };

            assert(commitment.reveal(array![x, y]), 'Does not match');

            let squad_position = Position { game_id, player, squad_id, x, y };

            // increment squad count on hex
            let mut position_squad_count = get!(world, (game_id, x, y), PositionSquadCount);
            position_squad_count.count += 1;

            // hash entity_id
            let player: felt252 = player.into();
            let mut squad = array![game_id.into(), player, squad_id.into()];
            let mut serialized = array![];
            squad.serialize(ref serialized);

            // set squad index on position
            let squad_entity_id = poseidon_hash_span(serialized.span());
            let squad_index = PositionSquadEntityIdByIndex {
                game_id, x, y, squad_position_index: position_squad_count.count, squad_entity_id
            };

            set!(world, (squad_position, position_squad_count, squad_index));
        }
    }
}
