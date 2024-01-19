#[starknet::interface]
trait IMove<TContractState> {
    fn move_squad_commitment(self: @TContractState, game_id: u32, squad_id: u32, hash: felt252);
    fn move_squad_reveal(
        self: @TContractState, game_id: u32, squad_id: u32, unit_qty: u32, x: u32, y: u32
    );
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
        squad::{Squad, PlayerSquadCount},
        game::{GameCount, GAME_COUNT_CONFIG, Game, GAME_ID_CONFIG, GameStatus, GameTrait}
    };

    use hegemony::{systems::{spawn::{spawn, ISpawnDispatcher, ISpawnDispatcherTrait, ISpawn}}};

    use origami::security::commitment::{Commitment, CommitmentTrait};

    use poseidon::poseidon_hash_span;

    use origami::map::hex::{hex::IHexTile, types::{HexTile, Direction, DirectionIntoFelt252}};


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

        fn move_squad_reveal(
            self: @ContractState, game_id: u32, squad_id: u32, unit_qty: u32, x: u32, y: u32
        ) {
            let world = self.world();
            let player = get_caller_address();

            get!(world, (game_id, GAME_ID_CONFIG), Game).assert_reveal_stage();

            // current position and squad
            let (mut squad_current_position, mut squad) = get!(
                world, (game_id, player, squad_id), (Position, Squad)
            );
            let mut current_position_squad_count = get!(
                world,
                (game_id, squad_current_position.x, squad_current_position.y),
                PositionSquadCount
            );

            let mut player_squad_count = get!(world, (game_id, player), PlayerSquadCount);

            assert(unit_qty <= squad.unit_qty, 'Too many units to move');

            // increment squad count on new hex
            let mut move_to_position_count = get!(world, (game_id, x, y), PositionSquadCount);

            if (unit_qty < squad.unit_qty) {
                commit_move(
                    world,
                    squad_current_position,
                    move_to_position_count,
                    game_id,
                    player,
                    squad_id,
                    unit_qty,
                    x,
                    y
                );

                // spawn new squad
                spawn::spawn_squad(world, player, game_id, IHexTile::new(x, y), squad_id, unit_qty);

                // update current squad
                squad.unit_qty -= unit_qty;

                // update player squad count
                player_squad_count.count += 1;

                // assert
                assert(squad.unit_qty >= 0, 'Squad unit qty must');

                // if no troops left 0 out the position count
                if (squad.unit_qty == 0) {
                    if (x != squad_current_position.x && y != squad_current_position.y) {
                        current_position_squad_count.count -= 1;
                    }
                }
            } else {
                move_to_position_count.count += 1;
                commit_move(
                    world,
                    squad_current_position,
                    move_to_position_count,
                    game_id,
                    player,
                    squad_id,
                    unit_qty,
                    x,
                    y
                );

                if (x != squad_current_position.x && y != squad_current_position.y) {
                    current_position_squad_count.count -= 1;
                }
            }

            set!(world, (current_position_squad_count, squad, player_squad_count));
        }
    }


    fn commit_move(
        world: IWorldDispatcher,
        squad_current_position: Position,
        move_to_position_count: PositionSquadCount,
        game_id: u32,
        player: ContractAddress,
        squad_id: u32,
        unit_qty: u32,
        x: u32,
        y: u32
    ) {
        check_hash(world, game_id, player, squad_id, unit_qty, x, y);

        // set squad position
        let move_to_position = Position { game_id, player, squad_id, x, y };

        // hash entity_id
        let squad_entity_id = poseidon_hash_span(
            array![game_id.into(), player.into(), squad_id.into()].span()
        );

        // set squad index on new position
        let move_to_position_squad_index = PositionSquadEntityIdByIndex {
            game_id,
            x,
            y,
            squad_position_index: move_to_position_count.count,
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
        current_position_entity_id.squad__game_id = 0;
        current_position_entity_id.squad__player_id = 0.try_into().unwrap();
        current_position_entity_id.squad__id = 0;

        set!(
            world,
            (
                current_position_entity_id,
                move_to_position,
                move_to_position_count,
                move_to_position_squad_index,
            )
        );
    }

    fn check_hash(
        world: IWorldDispatcher,
        game_id: u32,
        player: ContractAddress,
        squad_id: u32,
        unit_qty: u32,
        x: u32,
        y: u32
    ) {
        let hash = get!(world, (game_id, player, squad_id), SquadCommitmentHash).hash;

        assert(
            poseidon_hash_span(array![unit_qty.into(), x.into(), y.into()].span()) == hash,
            'Does not match'
        );
    }
}
