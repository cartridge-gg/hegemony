use starknet::{ContractAddress, contract_address_const, get_caller_address};

#[derive(Model, Copy, Drop, Serde, Print)]
struct Position {
    #[key]
    game_id: usize,
    #[key]
    entity_id: usize,
    x: u32,
    y: u32,
}
// entity_id
#[derive(Model, Copy, Drop, Serde, Print)]
struct Owner {
    #[key]
    game_id: usize,
    #[key]
    entity_id: usize,
    address: ContractAddress,
}

// unit has 3 keys
// game_id, address, entity_id
#[derive(Model, Copy, Drop, Serde, Print)]
struct Squad {
    #[key]
    game_id: usize,
    #[key]
    address: ContractAddress,
    #[key]
    entity_id: usize,
    unit_quantity: u32, //  quantity of troops
}

// count of units per player
#[derive(Model, Copy, Drop, Serde, Print)]
struct PlayerSquadCount {
    #[key]
    game_id: usize,
    #[key]
    address: ContractAddress,
    count: u32,
}


#[derive(Model, Copy, Drop, Serde, Print)]
struct GameCount {
    #[key]
    game_count_constant: usize,
    count: u32,
}
