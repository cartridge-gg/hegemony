use starknet::{ContractAddress, contract_address_const, get_caller_address};

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
