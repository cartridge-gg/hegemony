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
        },
        game::{
            Game, game, GameCount, game_count, COMMIT_TIME_HOURS, REVEAL_TIME_HOURS,
            RESOLVE_TIME_HOURS
        },
        squad::{Squad, squad, PlayerSquadCount, player_squad_count}
    };

    use hegemony::{
        systems::{
            move::{move, IMoveDispatcher, IMoveDispatcherTrait},
            game_lobby::{game_lobby, IGameLobbyDispatcher, IGameLobbyDispatcherTrait},
            spawn::{spawn, ISpawnDispatcher, ISpawnDispatcherTrait}
        }
    };

    use poseidon::poseidon_hash_span;

    struct Systems {
        move_system: IMoveDispatcher,
        game_lobby_system: IGameLobbyDispatcher,
        spawn_system: ISpawnDispatcher,
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

        (world, Systems { move_system, game_lobby_system, spawn_system })
    }

    const GAME_ID: u32 = 1;
    const SQUAD_ID: u32 = 1;

    fn setup_game() -> (IWorldDispatcher, Systems) {
        let (mut world, mut systems) = setup_world();

        systems.game_lobby_system.create_game();

        systems.game_lobby_system.join_game(GAME_ID);

        systems.game_lobby_system.start_game(GAME_ID);

        (world, systems)
    }


    #[test]
    #[available_gas(30000000)]
    fn test_spawn() {
        let (mut world, mut systems) = setup_game();

        systems.spawn_system.spawn_squad(GAME_ID);
    }

    #[test]
    #[available_gas(100000000)]
    fn test_movement() {
        let (mut world, mut systems) = setup_game();

        systems.spawn_system.spawn_squad(GAME_ID);

        let mut current_position_entity_id = get!(
            world, (GAME_ID, 10, 10, 1), PositionSquadEntityIdByIndex
        );

        // TODO: assert entity == correct entity
        assert(current_position_entity_id.squad_entity_id != 0, 'should have entity');

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
        set_block_timestamp(60 * 60 * (COMMIT_TIME_HOURS + 1));

        systems.move_system.move_squad_reveal(GAME_ID, SQUAD_ID, x, y);

        // check position has been updated
        let position = get!(world, (GAME_ID, get_caller_address(), SQUAD_ID), Position);
        assert(position.x == x, 'x should be equal');
        assert(position.y == y, 'y should be equal');

        // check previous position has been cleared
        let current_position_entity_id_old = get!(
            world, (GAME_ID, 10, 10, 1), PositionSquadEntityIdByIndex
        );

        assert(current_position_entity_id_old.squad_entity_id == 0, 'should be empty');
    }
}
