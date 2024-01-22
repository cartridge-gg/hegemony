use starknet::{ContractAddress};

const ENERGY_CONSTANT_ID: felt252 = 'energy_constant';

#[derive(Model, Copy, Drop, Serde, Print)]
struct Position {
    #[key]
    game_id: u32,
    #[key]
    player: ContractAddress,
    #[key]
    squad_id: u32,
    x: u32,
    y: u32,
}

// TODO: move to pure ECS
#[derive(Model, Copy, Drop, Serde, Print)]
struct Base {
    #[key]
    game_id: u32,
    #[key]
    player: ContractAddress,
    x: u32,
    y: u32,
}

#[derive(Model, Copy, Drop, Serde, Print)]
struct EnergySource {
    #[key]
    game_id: u32,
    #[key]
    energy_constant_id: felt252,
    #[key]
    x: u32,
    #[key]
    y: u32,
    owner: ContractAddress,
}

#[derive(Model, Copy, Drop, Serde, Print)]
struct PlayerEnergySourceCount {
    #[key]
    game_id: u32,
    #[key]
    owner: ContractAddress,
    #[key]
    energy_constant_id: felt252,
    count: u32,
}


// two models to allow the creation of an array on each hex
#[derive(Model, Copy, Drop, Serde, Print)]
struct PositionSquadCount {
    #[key]
    game_id: u32,
    #[key]
    x: u32,
    #[key]
    y: u32,
    count: u8,
}

// fetches squad id by index on hex
#[derive(Model, Copy, Drop, Serde, Print)]
struct PositionSquadEntityIdByIndex {
    #[key]
    game_id: u32,
    #[key]
    x: u32,
    #[key]
    y: u32,
    #[key]
    squad_position_index: u8,
    // the entity - tempory fix for now
    squad__game_id: u32,
    squad__player_id: ContractAddress,
    squad__id: u32,
}

#[derive(Model, Copy, Drop, Serde, Print)]
struct PositionSquadIndexByEntityId {
    #[key]
    game_id: u32,
    #[key]
    x: u32,
    #[key]
    y: u32,
    #[key]
    squad_entity_id: felt252,
    squad_position_index: u8,
}


#[derive(Model, Copy, Drop, Serde, Print)]
struct SquadCommitmentHash {
    #[key]
    game_id: u32,
    #[key]
    player: ContractAddress,
    #[key]
    squad_id: u32,
    hash: felt252,
}
