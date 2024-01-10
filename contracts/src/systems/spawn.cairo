#[starknet::interface]
trait ISpawn<TContractState> {
    fn spawn_player(self: @TContractState, game_id: u32);
}

#[dojo::contract]
mod spawn {
    use super::ISpawn;
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::{
        config::{CENTER_X, CENTER_Y},
        models::{
            position::{
                Position, PositionSquadCount, PositionSquadEntityIdByIndex,
                PositionSquadIndexByEntityId
            },
            squad::{Squad, PlayerSquadCount},
            game::{GameCount, GAME_ID_CONFIG, Game, GameStatus, GameTrait, GamePlayerId}
        },
    };

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
        home_hex: HexTile,
        direction: Direction,
    ) {
        let squad_id = player_squad_spawn_location_id(direction);

        let hex = home_hex.neighbor(direction);

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
            game_id, x, y, squad_position_index: new_position_squad_count.count, squad_entity_id
        };

        // // index squad position by id
        let new_position_squad_index_by_id = PositionSquadIndexByEntityId {
            game_id, x, y, squad_entity_id, squad_position_index: new_position_squad_count.count
        };

        // // make a squad
        let squad = Squad { game_id, player, squad_id, unit_qty: 10, owner: player };

        set!(
            world,
            (
                position,
                new_position_squad_count,
                new_position_squad_by_index,
                new_position_squad_index_by_id
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

    #[external(v0)]
    impl SpawnImpl of ISpawn<ContractState> {
        fn spawn_player(self: @ContractState, game_id: u32) {
            let world = self.world();

            let game = get!(world, (game_id, GAME_ID_CONFIG), Game).assert_in_progress();

            let player = get_caller_address();

            // increment squads
            let mut player_squad_count = get!(world, (game_id, player), PlayerSquadCount);
            player_squad_count.count += 6;

            let player_id = get!(world, (game_id, GAME_ID_CONFIG, player), GamePlayerId).id;

            let (x, y) = get_player_position(player_id);

            let home_hex = IHexTile::new(x, y);

            // spawn squad around spawn location
            spawn_squad(world, player, game_id, home_hex, Direction::East);
            spawn_squad(world, player, game_id, home_hex, Direction::NorthEast);
            spawn_squad(world, player, game_id, home_hex, Direction::NorthWest);
            spawn_squad(world, player, game_id, home_hex, Direction::West);
            spawn_squad(world, player, game_id, home_hex, Direction::SouthWest);
            spawn_squad(world, player, game_id, home_hex, Direction::SouthEast);

            set!(world, (player_squad_count));
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

        println!("x: {}, y: {}", x, y);

        assert(x == CENTER_X + 8, 'x should be center + 8');
        assert(y == CENTER_Y + 8, 'y should be center - 8');

        let (x, y) = spawn::get_player_position(3);

        println!("x: {}, y: {}", x, y);

        assert(x == CENTER_X + 16, 'x should be center + 16');
        assert(y == CENTER_Y + 8, 'y should be center - 8');
    }
}
