use starknet::{ContractAddress, contract_address_const, get_caller_address};

// unit has 3 keys
// game_id, address, squad_id
// squads get combined when they are in the same location
#[derive(Model, Copy, Drop, Serde, Print)]
struct Squad {
    #[key]
    game_id: u32,
    #[key]
    player: ContractAddress,
    #[key]
    squad_id: u32, // this is the count the player has
    unit_qty: u32, //  quantity of units
    owner: ContractAddress
}

// squad count per player, per game, we use this to get the id of the squad
#[derive(Model, Copy, Drop, Serde, Print)]
struct PlayerSquadCount {
    #[key]
    game_id: u32,
    #[key]
    player: ContractAddress,
    count: u32,
}

#[derive(Model, Copy, Drop, Serde, Print)]
struct Allied {
    #[key]
    game_id: u32,
    #[key]
    player: ContractAddress,
    ally: ContractAddress
}
