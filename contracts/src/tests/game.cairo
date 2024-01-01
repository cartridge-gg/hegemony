#[cfg(test)]
mod tests {
    use debug::PrintTrait;
    use starknet::class_hash::Felt252TryIntoClassHash;

    // import world dispatcher
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

    // import test utils
    use dojo::test_utils::{spawn_test_world, deploy_contract};

    // import models
    use hegemony::models::{
        position::{
            Position, position, SquadCommitmentHash, squad_commitment_hash,
            PositionSquadEntityIdByIndex, position_squad_entity_id_by_index, PositionSquadCount,
            position_squad_count
        },
        game::{Game, game, GameCount, game_count},
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
            game_count::TEST_CLASS_HASH
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

    fn setup_game() -> (IWorldDispatcher, Systems) {
        let (mut world, mut systems) = setup_world();

        systems.game_lobby_system.create_game();

        (world, systems)
    }

    const GAME_ID: u32 = 1;
    const SQUAD_ID: u32 = 1;

    #[test]
    #[available_gas(30000000)]
    fn test_spawn() {
        let (mut world, mut systems) = setup_game();

        systems.spawn_system.spawn_squad(GAME_ID);
    }

    #[test]
    #[available_gas(30000000)]
    fn test_movement() {
        let (mut world, mut systems) = setup_game();

        systems.spawn_system.spawn_squad(GAME_ID);

        let x: u32 = 11;
        let y: u32 = 11;

        let mut pos = array![x, y];

        let mut serialized = array![];
        pos.serialize(ref serialized);

        systems
            .move_system
            .move_squad_commitment(GAME_ID, SQUAD_ID, poseidon_hash_span(serialized.span()));

        systems.move_system.move_squad_reveal(GAME_ID, SQUAD_ID, x, y);
    }
}
