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
        position::{
            Position, SquadCommitmentHash, PositionSquadCount, PositionSquadEntityIdByIndex,
            PositionSquadIndexByEntityId
        },
        squad::{Squad},
        game::{GameCount, GAME_COUNT_CONFIG, Game, GAME_ID_CONFIG, GameStatus, GameTrait}
    };

    use origami::security::commitment::{Commitment, CommitmentTrait};

    use poseidon::poseidon_hash_span;


    #[external(v0)]
    impl MoveImpl of IMove<ContractState> {
        fn move_squad_commitment(self: @ContractState, game_id: u32, squad_id: u32, hash: felt252) {
            let world = self.world();

            get!(world, (game_id, GAME_ID_CONFIG), Game).assert_commit_stage();

            // check squad is owned by caller
            // TODO: squad checks
            let player = get_caller_address();

            let squad_commitment_hash = SquadCommitmentHash { game_id, player, squad_id, hash };

            set!(world, (squad_commitment_hash));
        }

        fn move_squad_reveal(self: @ContractState, game_id: u32, squad_id: u32, x: u32, y: u32) {
            let world = self.world();
            let player = get_caller_address();

            get!(world, (game_id, GAME_ID_CONFIG), Game).assert_reveal_stage();

            // current position squad hex count
            let mut squad_current_position = get!(world, (game_id, player, squad_id), Position);
            let mut current_position_squad_count = get!(
                world,
                (game_id, squad_current_position.x, squad_current_position.y),
                PositionSquadCount
            );
            current_position_squad_count.count -= 1;

            // hash 
            let hash = get!(world, (game_id, player, squad_id), SquadCommitmentHash).hash;
            let commitment = Commitment { hash };
            assert(commitment.reveal(array![x, y]), 'Does not match');

            // increment squad count on new hex
            let mut new_position_squad_count = get!(world, (game_id, x, y), PositionSquadCount);
            new_position_squad_count.count += 1;

            // set squad position
            let new_position_squad = Position { game_id, player, squad_id, x, y };

            // hash entity_id
            // set squad index on position
            let squad_entity_id = poseidon_hash_span(
                array![game_id.into(), player.into(), squad_id.into()].span()
            );

            // set squad index on new position
            let new_position_squad_index = PositionSquadEntityIdByIndex {
                game_id,
                x,
                y,
                squad_position_index: new_position_squad_count.count,
                squad__game_id: game_id,
                squad__player_id: player,
                squad__id: squad_id
            };

            // clears the index of the squad on the current position
            let current_position_squad_index = get!(
                world,
                (game_id, squad_current_position.x, squad_current_position.y, squad_entity_id),
                PositionSquadIndexByEntityId
            )
                .squad_position_index;

            // gets current entity index  
            let mut current_position_entity_id = get!(
                world,
                (
                    game_id,
                    squad_current_position.x,
                    squad_current_position.y,
                    current_position_squad_index
                ),
                PositionSquadEntityIdByIndex
            );

            // clears the index spots
            current_position_entity_id.squad__game_id = 0;
            current_position_entity_id.squad__player_id = 0.try_into().unwrap();
            current_position_entity_id.squad__id = 0;

            set!(
                world,
                (
                    current_position_squad_count,
                    current_position_entity_id,
                    new_position_squad,
                    new_position_squad_count,
                    new_position_squad_index,
                )
            );
        }
    }
}
