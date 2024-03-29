#[starknet::interface]
trait ISpawn<TContractState> {
    fn spawn_player(self: @TContractState, game_id: u32);
    fn spawn_new_units(self: @TContractState, game_id: u32);
}

#[dojo::contract]
mod spawn {
    use super::ISpawn;
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::{
        config::{CENTER_X, CENTER_Y, STARTING_SQUAD_SIZE, REINFORCEMENT_SQUAD_SIZE},
        models::{
            position::{
                Position, PositionSquadCount, PositionSquadEntityIdByIndex,
                PositionSquadIndexByEntityId, Base, PlayerEnergySourceCount, ENERGY_CONSTANT_ID,
                EnergySource
            },
            squad::{Squad, PlayerSquadCount},
            game::{GameCount, GAME_ID_CONFIG, Game, GameStatus, GameTrait, GamePlayerId}
        },
    };

    use hegemony::{systems::{move::{move}}};

    use poseidon::poseidon_hash_span;

    use origami::map::hex::{hex::IHexTile, types::{HexTile, Direction, DirectionIntoFelt252}};

    // TODO: make better
    fn get_player_position(player_number: u32) -> (u32, u32) {
        let center_x = CENTER_X;
        let center_y = CENTER_Y;
        let tile_distance: u32 = 8;

        if player_number == 1 {
            // The first player is at the center
            return (center_x, center_y);
        }

        // The second player is at the center + 8
        let x = center_x + tile_distance * (player_number - 1);
        let y = center_y + tile_distance;

        (x, y)
    }

    fn spawn_squad(
        world: IWorldDispatcher,
        player: ContractAddress,
        game_id: u32,
        hex: HexTile,
        squad_id: u32,
        unit_qty: u32
    ) {
        let x = hex.col;
        let y = hex.row;

        let mut new_position_squad_count = get!(world, (game_id, x, y), PositionSquadCount);
        new_position_squad_count.count += 1;

        let position = Position { game_id, player, squad_id, x, y };

        let squad_entity_id = poseidon_hash_span(
            array![game_id.into(), player.into(), squad_id.into()].span()
        );

        // // index squad position
        let new_position_squad_by_index = PositionSquadEntityIdByIndex {
            game_id,
            x,
            y,
            squad_position_index: new_position_squad_count.count,
            squad__game_id: game_id,
            squad__player_id: player,
            squad__id: squad_id
        };

        // // index squad position by id
        let new_position_squad_index_by_id = PositionSquadIndexByEntityId {
            game_id, x, y, squad_entity_id, squad_position_index: new_position_squad_count.count
        };

        // // make a squad
        let squad = Squad { game_id, player, squad_id, unit_qty, owner: player };

        set!(
            world,
            (
                position,
                new_position_squad_count,
                new_position_squad_by_index,
                new_position_squad_index_by_id,
                squad
            )
        );
    }

    fn player_squad_spawn_location_id(direction: Direction) -> u32 {
        match direction {
            Direction::East => 1,
            Direction::NorthEast => 2,
            Direction::NorthWest => 3,
            Direction::West => 4,
            Direction::SouthWest => 5,
            Direction::SouthEast => 6,
        }
    }

    // TODO: Check spawned already
    #[external(v0)]
    impl SpawnImpl of ISpawn<ContractState> {
        fn spawn_player(self: @ContractState, game_id: u32) {
            let world = self.world();

            let game = get!(world, (game_id, GAME_ID_CONFIG), Game).assert_in_progress();

            let player = get_caller_address();

            // increment squads
            let mut player_squad_count = get!(world, (game_id, player), PlayerSquadCount);

            assert(player_squad_count.count < 6, 'Player has already spawned');

            player_squad_count.count += 6;

            let player_id = get!(world, (game_id, GAME_ID_CONFIG, player), GamePlayerId).id;

            let (x, y) = get_player_position(player_id);

            let home_hex = IHexTile::new(x, y);

            // set homebase // units spawn from here
            let base = Base { game_id, player, x, y };
            set!(world, (base));

            let energy_source = EnergySource {
                game_id, energy_constant_id: ENERGY_CONSTANT_ID, x, y, owner: player
            };

            // spawn squad around spawn location
            spawn_squad(
                world,
                player,
                game_id,
                home_hex.neighbor(Direction::East),
                player_squad_spawn_location_id(Direction::East),
                STARTING_SQUAD_SIZE
            );
            spawn_squad(
                world,
                player,
                game_id,
                home_hex.neighbor(Direction::NorthEast),
                player_squad_spawn_location_id(Direction::NorthEast),
                STARTING_SQUAD_SIZE
            );
            spawn_squad(
                world,
                player,
                game_id,
                home_hex.neighbor(Direction::NorthWest),
                player_squad_spawn_location_id(Direction::NorthWest),
                STARTING_SQUAD_SIZE
            );
            spawn_squad(
                world,
                player,
                game_id,
                home_hex.neighbor(Direction::West),
                player_squad_spawn_location_id(Direction::West),
                STARTING_SQUAD_SIZE
            );
            spawn_squad(
                world,
                player,
                game_id,
                home_hex.neighbor(Direction::SouthWest),
                player_squad_spawn_location_id(Direction::SouthWest),
                STARTING_SQUAD_SIZE
            );
            spawn_squad(
                world,
                player,
                game_id,
                home_hex.neighbor(Direction::SouthEast),
                player_squad_spawn_location_id(Direction::SouthEast),
                STARTING_SQUAD_SIZE
            );

            set!(world, (player_squad_count, energy_source));
        }

        // spawn new units every 3 cycles
        // TODO: restrict spawn once
        fn spawn_new_units(self: @ContractState, game_id: u32) {
            let world = self.world();
            let game = get!(world, (game_id, GAME_ID_CONFIG), Game);

            // check in spawn cycle
            game.assert_is_spawn_cycle();

            // check in resolve stage
            game.assert_resolve_stage();

            let player = get_caller_address();

            let (x, y) = get_player_position(
                get!(world, (game_id, GAME_ID_CONFIG, player), GamePlayerId).id
            );

            let players_squads_on_position = move::get_squads_on_position(world, game_id, x, y);

            // get captured energy source count
            let player_energy_source_count = get!(
                world, (game_id, player, ENERGY_CONSTANT_ID), PlayerEnergySourceCount
            )
                .count;

            let reinforcement_squad_size = REINFORCEMENT_SQUAD_SIZE
                * (player_energy_source_count + 1);

            // check if squad on starting hex_map
            // IF squad on starting hex -> merge
            // ELSE spawn new squad
            // TODO: Abastract this out
            if (players_squads_on_position.len() > 0) {
                let mut merged_squad = move::merge_player_squads(
                    players_squads_on_position.span(), player
                );

                merged_squad.unit_qty += reinforcement_squad_size;

                println!("merged_squad.unit_qty: {}", merged_squad.unit_qty);
                merged_squad.game_id = game_id;
                merged_squad.player = player;

                set!(world, (merged_squad));
            } else {
                let mut player_squad_count = get!(world, (game_id, player), PlayerSquadCount);
                player_squad_count.count += 1;

                spawn_squad(
                    world,
                    player,
                    game_id,
                    IHexTile::new(x, y),
                    player_squad_count.count,
                    reinforcement_squad_size
                );

                set!(world, (player_squad_count));
            }
        }
    }
}


#[cfg(test)]
mod tests {
    use super::spawn;
    use hegemony::{config::{CENTER_X, CENTER_Y}};

    #[test]
    #[available_gas(3000000000)]
    fn test_spawn_location() {
        let (mut x, mut y) = spawn::get_player_position(1);

        assert(x == CENTER_X, 'x should be center');
        assert(y == CENTER_Y, 'y should be center');

        let (x, y) = spawn::get_player_position(2);

        assert(x == CENTER_X + 8, 'x should be center + 8');
        assert(y == CENTER_Y + 8, 'y should be center - 8');

        let (x, y) = spawn::get_player_position(3);

        assert(x == CENTER_X + 16, 'x should be center + 16');
        assert(y == CENTER_Y + 8, 'y should be center - 8');
    }
}
