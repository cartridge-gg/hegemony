#[starknet::interface]
trait IMove<TContractState> {
    fn move_squad_commitment(
        self: @TContractState, game_id: u32, squad_id: u32, new_squad_id: u32, hash: felt252
    );
    fn move_squad_reveal(
        self: @TContractState, game_id: u32, squad_id: u32, unit_qty: u32, x: u32, y: u32
    );
}

#[dojo::contract]
mod move {
    use core::array::ArrayTrait;
use super::IMove;
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::models::{
        position::{
            Position, SquadCommitmentHash, PositionSquadCount, PositionSquadEntityIdByIndex,
            PositionSquadIndexByEntityId, EnergySource, PlayerEnergySourceCount, ENERGY_CONSTANT_ID
        },
        squad::{Squad, PlayerSquadCount},
        game::{GameCount, GAME_COUNT_CONFIG, Game, GAME_ID_CONFIG, GameStatus, GameTrait}
    };

    use hegemony::{systems::{spawn::{spawn, ISpawnDispatcher, ISpawnDispatcherTrait, ISpawn}}};

    use origami::security::commitment::{Commitment, CommitmentTrait};

    use poseidon::poseidon_hash_span;

    use origami::map::hex::{hex::IHexTile, types::{HexTile, Direction, DirectionIntoFelt252}};

    use alexandria_data_structures::array_ext::{ArrayTraitExt, SpanTraitExt};

    #[external(v0)]
    impl MoveImpl of IMove<ContractState> {
        fn move_squad_commitment(
            self: @ContractState, game_id: u32, squad_id: u32, new_squad_id: u32, hash: felt252
        ) {
            let world = self.world();

            get!(world, (game_id, GAME_ID_CONFIG), Game).assert_commit_stage();

            let player = get_caller_address();

            // if new squad id is different from current squad id
            // we spawn a new squad on the current location and then set the hash for the new squad
            if (squad_id != new_squad_id) {
                // spawn new squad at current squad location with 0 units
                let current_squad_position = get!(
                    world, (game_id, get_caller_address(), squad_id), Position
                );

                let mut player_squad_count = get!(world, (game_id, player), PlayerSquadCount);
                player_squad_count.count += 1;

                // check here otherwise squad ids can increment too much
                assert(player_squad_count.count == new_squad_id, 'Too many squads');

                spawn::spawn_squad(
                    world,
                    player,
                    game_id,
                    IHexTile::new(current_squad_position.x, current_squad_position.y),
                    player_squad_count.count,
                    0
                );

                set!(
                    world,
                    (
                        player_squad_count,
                        SquadCommitmentHash { game_id, player, squad_id: new_squad_id, hash }
                    )
                );
            } else {
                set!(world, (SquadCommitmentHash { game_id, player, squad_id, hash }));
            }
        }

        fn move_squad_reveal(
            self: @ContractState, game_id: u32, squad_id: u32, unit_qty: u32, x: u32, y: u32
        ) {
            let world = self.world();
            get!(world, (game_id, GAME_ID_CONFIG), Game).assert_reveal_stage();

            // player
            let player = get_caller_address();

            // current position and squad
            let (mut squad_current_position, mut squad) = get!(
                world, (game_id, player, squad_id), (Position, Squad)
            );
            let mut current_position_squad_count = get!(
                world,
                (game_id, squad_current_position.x, squad_current_position.y),
                PositionSquadCount
            );

            // assert
            // Add back soon
            // assert(unit_qty <= squad.unit_qty, 'Too many units to move');

            // check hash
            check_hash(world, game_id, player, squad_id, unit_qty, x, y);

            let squad_position_as_hex = HexTile { row : squad_current_position.x, col :  squad_current_position.y};            
            let mut valid_moves = squad_position_as_hex.tiles_within_range(3);
            let mut is_valid_move = false;
            let mut i = 0;
            loop {
                if !(is_valid_move == false && i < valid_moves.len()) {
                    break;
                }
                let current_tile = *valid_moves.at(i);
                if (current_tile.col == x && current_tile.row == y) {
                    is_valid_move = true;
                }
                i += 1;
            };

            assert_eq!(is_valid_move, true);
            

            let players_squads_on_position = get_player_squads_on_position(
                get_squads_on_position(world, game_id, x, y).span(), player
            );

            //----------  

            // TODO: check for incorrect squad amounts, otherwise people can spawn huge squads
            // if squad qty = 0 it means it was just created
            // we then check if the first squad on the current positions qty
            // then we subtract the qty from the current position squad and it must be greater than 0

            //----------------

            // @dev: Merge or move
            if (players_squads_on_position.len() > 0) {
                let mut merged_squad = merge_player_squads(
                    players_squads_on_position.span(), player
                );

                // merge squads
                merged_squad.unit_qty += unit_qty;
                merged_squad.game_id = game_id;
                merged_squad.player = player;
                set!(world, (merged_squad));
            } else {
                let mut move_to_position_count = get!(world, (game_id, x, y), PositionSquadCount);
                move_to_position_count.count += 1;

                // position
                let position = Position { game_id, player, squad_id, x, y };

                // set squad position index
                let position_squad_entity_id_by_index = PositionSquadEntityIdByIndex {
                    game_id,
                    x,
                    y,
                    squad_position_index: move_to_position_count.count,
                    squad__game_id: game_id,
                    squad__player_id: player,
                    squad__id: squad_id
                };

                set!(world, (move_to_position_count, position, position_squad_entity_id_by_index));

                // remove squad count from current position
                if (x != squad_current_position.x && y != squad_current_position.y) {
                    current_position_squad_count.count -= 1;
                }
            }

            // delete squad from hex
            delete_squad_from_position(world, squad_current_position, game_id, squad_id, player);

            // set values
            set!(world, (current_position_squad_count, squad));

            // capture energy source
            if (is_energy_source(x, y)) {
                capture_energy_source(world, game_id, x, y, player);
            }
        }
    }

    fn get_player_squads_on_position(
        mut squads: Span<Squad>, player: ContractAddress
    ) -> Array<Squad> {
        let mut player_squads: Array<Squad> = ArrayTrait::new();

        loop {
            match squads.pop_front() {
                Option::Some(v) => { if (*v.owner == player) {
                    player_squads.append(*v);
                }; },
                Option::None => { break; }
            };
        };
        player_squads
    }

    // UPDATE: we don't need to loop if merging everywhere
    fn merge_player_squads(mut squads: Span<Squad>, player: ContractAddress) -> Squad {
        let mut new_squad = Squad { game_id: 0, player, squad_id: 0, unit_qty: 0, owner: player };

        let mut index_to_access = 0;

        loop {
            match squads.pop_front() {
                Option::Some(v) => {
                    new_squad.unit_qty += *v.unit_qty;
                    new_squad.squad_id = *v.squad_id;
                },
                Option::None => { break; }
            };
        };
        new_squad
    }

    fn delete_squad_from_position(
        world: IWorldDispatcher,
        position: Position,
        game_id: u32,
        squad_id: u32,
        player: ContractAddress,
    ) {
        // clears the index of the squad on the current position
        // TODO: we need to pop the array in the future, but idk what is more gassy....
        let current_position_squad_index = get!(
            world,
            (
                game_id,
                position.x,
                position.y,
                poseidon_hash_span(array![game_id.into(), player.into(), squad_id.into()].span())
            ),
            PositionSquadIndexByEntityId
        )
            .squad_position_index;
        let mut current_position_entity_id = get!(
            world,
            (game_id, position.x, position.y, current_position_squad_index),
            PositionSquadEntityIdByIndex
        );

        delete!(world, (current_position_entity_id));
    }

    fn get_squads_on_position(
        world: IWorldDispatcher, game_id: u32, x: u32, y: u32
    ) -> Array<Squad> {
        let position_squad_count = get!(world, (game_id, x, y), PositionSquadCount).count;

        let mut squads = ArrayTrait::<Squad>::new();
        let mut index: usize = 1;

        let mut num_squads: usize = 0;

        loop {
            if (num_squads >= position_squad_count.into()) {
                break;
            }

            let mut squad_id = get!(world, (game_id, x, y, index), PositionSquadEntityIdByIndex);

            if (squad_id.squad__id != 0) {
                let mut squad = get!(
                    world,
                    (squad_id.squad__game_id, squad_id.squad__player_id, squad_id.squad__id),
                    Squad
                );

                squads.append(squad);

                // only count if not empty // should be fixed later
                num_squads += 1;
            }

            index += 1;
        };

        squads
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

    fn is_energy_source(x: u32, y: u32) -> bool {
        // Define the distance between energy sources
        let distance = 10;

        // Adjust for the hex grid's offset pattern
        if (x + y) % (2 * distance) == 0 {
            return true;
        }

        false
    }

    fn capture_energy_source(
        world: IWorldDispatcher, game_id: u32, x: u32, y: u32, player: ContractAddress
    ) {
        // check occupied space
        let mut energy_source = get!(world, (game_id, ENERGY_CONSTANT_ID, x, y), EnergySource);

        if (energy_source.owner.into() == 0) {
            // set owner
            energy_source.owner = player;

            let mut player_energy_source_count = get!(
                world, (game_id, player, ENERGY_CONSTANT_ID), PlayerEnergySourceCount
            );

            player_energy_source_count.count += 1;

            set!(world, (energy_source, player_energy_source_count));
        } else {
            // check if owner is the same
            if (energy_source.owner != player) {
                // check if owner is the same
                let mut player_energy_source_count = get!(
                    world, (game_id, player, ENERGY_CONSTANT_ID), PlayerEnergySourceCount
                );

                player_energy_source_count.count += 1;

                let mut enemy_player_energy_source_count = get!(
                    world,
                    (game_id, energy_source.owner, ENERGY_CONSTANT_ID),
                    PlayerEnergySourceCount
                );

                enemy_player_energy_source_count.count -= 1;

                energy_source.owner = player;

                set!(
                    world,
                    (energy_source, player_energy_source_count, enemy_player_energy_source_count)
                );
            }
        }
    }
}


#[cfg(test)]
mod tests {
    use super::move;
    use hegemony::{config::{CENTER_X, CENTER_Y}};
    use hegemony::models::{
        position::{
            Position, SquadCommitmentHash, PositionSquadCount, PositionSquadEntityIdByIndex,
            PositionSquadIndexByEntityId
        },
        squad::{Squad, PlayerSquadCount},
        game::{GameCount, GAME_COUNT_CONFIG, Game, GAME_ID_CONFIG, GameStatus, GameTrait}
    };

    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    fn OWNER() -> ContractAddress {
        1.try_into().unwrap()
    }

    fn PLAYER_TWO() -> ContractAddress {
        2.try_into().unwrap()
    }

    fn create_squads() -> Array<Squad> {
        let mut squads: Array<Squad> = ArrayTrait::new();

        squads
            .append(
                Squad { game_id: 1, player: OWNER(), squad_id: 1, unit_qty: 1, owner: OWNER() }
            );
        squads
            .append(
                Squad {
                    game_id: 1, player: PLAYER_TWO(), squad_id: 2, unit_qty: 1, owner: PLAYER_TWO()
                }
            );
        squads
            .append(
                Squad {
                    game_id: 1, player: PLAYER_TWO(), squad_id: 3, unit_qty: 1, owner: PLAYER_TWO()
                }
            );
        squads
            .append(
                Squad { game_id: 1, player: OWNER(), squad_id: 4, unit_qty: 1, owner: OWNER() }
            );
        squads
            .append(
                Squad {
                    game_id: 1, player: PLAYER_TWO(), squad_id: 5, unit_qty: 1, owner: PLAYER_TWO()
                }
            );
        squads
            .append(
                Squad { game_id: 1, player: OWNER(), squad_id: 6, unit_qty: 1, owner: OWNER() }
            );
        squads
            .append(
                Squad { game_id: 1, player: OWNER(), squad_id: 7, unit_qty: 1, owner: OWNER() }
            );
        squads
            .append(
                Squad { game_id: 1, player: OWNER(), squad_id: 8, unit_qty: 1, owner: OWNER() }
            );

        squads
    }

    #[test]
    #[available_gas(3000000000)]
    fn test_get_player_squads() {
        let squads = create_squads();

        let player_squads = move::get_player_squads_on_position(squads.span(), OWNER());

        assert(player_squads.len() == 5, 'Should be 5 squads');
    }

    #[test]
    #[available_gas(3000000000)]
    fn test_merge_player_squads() {
        let squads = create_squads();

        let player_squads = move::get_player_squads_on_position(squads.span(), OWNER());

        assert(player_squads.len() == 5, 'Should be 5 squads');

        let merged_squad = move::merge_player_squads(player_squads.span(), OWNER());

        assert(merged_squad.unit_qty == 5, 'Should be 5 units');
    }

    #[test]
    fn test_energy_source_true() {
        assert(move::is_energy_source(0, 0), 'energy 0,0'); // Both coordinates are 0
        assert(
            move::is_energy_source(10, 10), 'energy 10,10'
        ); // Both coordinates are at a distance
        assert(
            move::is_energy_source(20, 0), 'energy 20,0'
        ); // One coordinate at double the distance
    }

    #[test]
    fn test_energy_source_false() {
        assert(!move::is_energy_source(1, 0), 'not energy 1,0'); // Off by one
        assert(
            !move::is_energy_source(5, 5), 'not energy 5,5'
        ); // Coordinates not meeting the condition
        assert(!move::is_energy_source(3, 4), 'not energy 3,4'); // Random coordinates
    // Add more cases as needed
    }
}
