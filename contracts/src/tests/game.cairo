#[cfg(test)]
mod tests {
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use starknet::testing::{set_block_timestamp};

    // import world dispatcher
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    // import test utils
    use dojo::test_utils::{spawn_test_world, deploy_contract};

    // import models
    use hegemony::models::{
        position::{
            Position, position, SquadCommitmentHash, squad_commitment_hash,
            PositionSquadEntityIdByIndex, position_squad_entity_id_by_index, PositionSquadCount,
            position_squad_count, PositionSquadIndexByEntityId, position_squad_index_by_entity_id,
            Base, base
        },
        game::{
            Game, game, GameCount, game_count, COMMIT_TIME_HOURS, REVEAL_TIME_HOURS,
            RESOLVE_TIME_HOURS, GamePlayerId, game_player_id
        },
        squad::{Squad, squad, PlayerSquadCount, player_squad_count}
    };

    use hegemony::{
        systems::{
            move::{move, IMoveDispatcher, IMoveDispatcherTrait},
            game_lobby::{game_lobby, IGameLobbyDispatcher, IGameLobbyDispatcherTrait},
            spawn::{spawn, ISpawnDispatcher, ISpawnDispatcherTrait, ISpawn},
            combat::{combat, ICombatDispatcher, ICombatDispatcherTrait},
        },
        config::{CENTER_X, CENTER_Y}, utils::{utils::hash_move}
    };

    use poseidon::poseidon_hash_span;

    use origami::map::hex::{hex::IHexTile, types::{HexTile, Direction, DirectionIntoFelt252}};

    #[derive(Copy, Drop, Serde)]
    struct Systems {
        move_system: IMoveDispatcher,
        game_lobby_system: IGameLobbyDispatcher,
        spawn_system: ISpawnDispatcher,
        combat_system: ICombatDispatcher,
    }

    fn setup_world() -> (IWorldDispatcher, Systems) {
        // models
        let mut models = array![
            position::TEST_CLASS_HASH,
            squad::TEST_CLASS_HASH,
            game::TEST_CLASS_HASH,
            squad_commitment_hash::TEST_CLASS_HASH,
            position_squad_count::TEST_CLASS_HASH,
            position_squad_entity_id_by_index::TEST_CLASS_HASH,
            player_squad_count::TEST_CLASS_HASH,
            game_count::TEST_CLASS_HASH,
            position_squad_index_by_entity_id::TEST_CLASS_HASH,
            game_player_id::TEST_CLASS_HASH,
            base::TEST_CLASS_HASH
        ];

        // deploy world with models
        let world = spawn_test_world(models);

        // deploy systems contract
        let contract_address = world
            .deploy_contract('salt', move::TEST_CLASS_HASH.try_into().unwrap());
        let move_system = IMoveDispatcher { contract_address };

        // deploy game lobby contract
        let contract_address = world
            .deploy_contract('salt', game_lobby::TEST_CLASS_HASH.try_into().unwrap());
        let game_lobby_system = IGameLobbyDispatcher { contract_address };

        // deploy spawn contract
        let contract_address = world
            .deploy_contract('salt', spawn::TEST_CLASS_HASH.try_into().unwrap());
        let spawn_system = ISpawnDispatcher { contract_address };

        // deploy combat contract
        let contract_address = world
            .deploy_contract('salt', combat::TEST_CLASS_HASH.try_into().unwrap());
        let combat_system = ICombatDispatcher { contract_address };

        (world, Systems { move_system, game_lobby_system, spawn_system, combat_system })
    }

    const GAME_ID: u32 = 1;
    const SQUAD_ID: u32 = 1;

    const PLAYER_TWO_ID: u32 = 2;


    fn PLAYER_ONE_ADDRESS() -> ContractAddress {
        contract_address_const::<10>()
    }

    fn PLAYER_TWO_ADDRESS() -> ContractAddress {
        contract_address_const::<20>()
    }

    fn setup_game() -> (IWorldDispatcher, Systems) {
        let (world, systems) = setup_world();

        systems.game_lobby_system.create_game();

        (world, systems)
    }

    fn setup_game_and_spawn() -> (IWorldDispatcher, Systems) {
        let (world, systems) = setup_game();

        starknet::testing::set_contract_address(PLAYER_ONE_ADDRESS());
        systems.game_lobby_system.join_game(GAME_ID);

        starknet::testing::set_contract_address(PLAYER_TWO_ADDRESS());
        systems.game_lobby_system.join_game(GAME_ID);

        starknet::testing::set_contract_address(PLAYER_ONE_ADDRESS());
        systems.game_lobby_system.start_game(GAME_ID);
        systems.spawn_system.spawn_player(GAME_ID);

        starknet::testing::set_contract_address(PLAYER_TWO_ADDRESS());
        systems.spawn_system.spawn_player(GAME_ID);

        starknet::testing::set_contract_address(PLAYER_ONE_ADDRESS());

        (world, systems)
    }


    #[test]
    #[available_gas(3000000000)]
    fn test_spawn() {
        let (mut world, mut systems) = setup_game_and_spawn();

        let player_hex = IHexTile::new(CENTER_X, CENTER_Y);

        let home_base = get!(world, (GAME_ID, PLAYER_ONE_ADDRESS()), Base);

        assert(home_base.x == player_hex.col, 'homebase x');
        assert(home_base.y == player_hex.row, 'homebase y');

        let east = player_hex.neighbor(Direction::East);

        let squad_id = spawn::player_squad_spawn_location_id(Direction::East);

        let mut current_position_entity_id = get!(
            world, (GAME_ID, east.col, east.row, squad_id), PositionSquadEntityIdByIndex
        );

        let squad_entity_id = poseidon_hash_span(
            array![GAME_ID.into(), PLAYER_ONE_ADDRESS().into(), squad_id.into()].span()
        );

        let squad_entity_id_in_position = poseidon_hash_span(
            array![
                current_position_entity_id.squad__game_id.into(),
                current_position_entity_id.squad__player_id.into(),
                current_position_entity_id.squad__id.into()
            ]
                .span()
        );

        assert(squad_entity_id_in_position == squad_entity_id, 'not correct entity');
    }

    #[test]
    #[available_gas(3000000000)]
    fn test_spawn_player_2() {
        let (mut world, mut systems) = setup_game_and_spawn();

        starknet::testing::set_contract_address(PLAYER_TWO_ADDRESS());

        let (x, y) = spawn::get_player_position(2);

        let player_hex = IHexTile::new(x, y);

        let home_base = get!(world, (GAME_ID, PLAYER_TWO_ADDRESS()), Base);

        assert(home_base.x == player_hex.col, 'homebase x');
        assert(home_base.y == player_hex.row, 'homebase y');

        let east = player_hex.neighbor(Direction::East);

        let squad_id = spawn::player_squad_spawn_location_id(Direction::East);

        let mut current_position_entity_id = get!(
            world, (GAME_ID, east.col, east.row, squad_id), PositionSquadEntityIdByIndex
        );

        let squad_entity_id = poseidon_hash_span(
            array![GAME_ID.into(), PLAYER_TWO_ADDRESS().into(), squad_id.into()].span()
        );

        let squad_entity_id_in_position = poseidon_hash_span(
            array![
                current_position_entity_id.squad__game_id.into(),
                current_position_entity_id.squad__player_id.into(),
                current_position_entity_id.squad__id.into()
            ]
                .span()
        );

        assert(squad_entity_id_in_position == squad_entity_id, 'not correct entity');
    }

    #[test]
    #[available_gas(1000000000)]
    fn test_movement() {
        let (mut world, mut systems) = setup_game_and_spawn();

        let player_hex = IHexTile::new(CENTER_X, CENTER_Y);

        let east = player_hex.neighbor(Direction::East);

        let squad_id = spawn::player_squad_spawn_location_id(Direction::East);

        let mut current_position_entity_id = get!(
            world, (GAME_ID, east.col, east.row, squad_id), PositionSquadEntityIdByIndex
        );

        let squad_entity_id = poseidon_hash_span(
            array![GAME_ID.into(), PLAYER_ONE_ADDRESS().into(), squad_id.into()].span()
        );

        // new positions
        let x: u32 = 12;
        let y: u32 = 12;

        let mut pos = array![x, y];
        let mut serialized = array![];
        pos.serialize(ref serialized);

        systems
            .move_system
            .move_squad_commitment(GAME_ID, SQUAD_ID, poseidon_hash_span(serialized.span()));

        // shift time by 8hrs so the reveal can happen
        set_block_timestamp(60 * 60 * COMMIT_TIME_HOURS + 1);

        systems.move_system.move_squad_reveal(GAME_ID, SQUAD_ID, x, y);

        // check position has been updated
        let position = get!(world, (GAME_ID, PLAYER_ONE_ADDRESS(), SQUAD_ID), Position);
        assert(position.x == x, 'x should be equal');
        assert(position.y == y, 'y should be equal');

        // check previous position has been cleared
        let current_position_entity_id_old = get!(
            world, (GAME_ID, east.col, east.row, squad_id), PositionSquadEntityIdByIndex
        );

        assert(current_position_entity_id_old.squad__id == 0, 'should be empty');
    }


    #[test]
    #[available_gas(1000000000)]
    fn test_combat() {
        let (mut world, mut systems) = setup_game_and_spawn();

        // new positions
        let x: u32 = 12;
        let y: u32 = 12;

        systems.move_system.move_squad_commitment(GAME_ID, SQUAD_ID, hash_move(x, y));

        starknet::testing::set_contract_address(PLAYER_TWO_ADDRESS());
        systems.move_system.move_squad_commitment(GAME_ID, SQUAD_ID, hash_move(x, y));

        // shift time by 8hrs so the reveal can happen
        set_block_timestamp(60 * 60 * COMMIT_TIME_HOURS + 1);

        systems.move_system.move_squad_reveal(GAME_ID, SQUAD_ID, x, y);

        starknet::testing::set_contract_address(PLAYER_ONE_ADDRESS());
        systems.move_system.move_squad_reveal(GAME_ID, SQUAD_ID, x, y);

        // shift time to resolve
        set_block_timestamp(60 * 60 * 2 * COMMIT_TIME_HOURS + 1);

        // resolve
        systems.combat_system.resolve_combat(GAME_ID, x, y);

        let resolved_position_null = get!(world, (GAME_ID, x, y), PositionSquadCount);

        assert(resolved_position_null.count == 0, 'should be empty');
    }

    #[test]
    #[available_gas(1000000000)]
    fn test_new_unit_spawn() {
        let (mut world, mut systems) = setup_game_and_spawn();

        // shift time by 8hrs so the reveal can happen
        set_block_timestamp(60 * 60 * 64 + 1);

        systems.spawn_system.spawn_new_units(GAME_ID);

        let new_position_squads = get!(world, (GAME_ID, CENTER_X, CENTER_Y), PositionSquadCount);

        assert(new_position_squads.count == 1, 'should have 1 squad');
    }
}
