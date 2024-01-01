const GAME_ID_CONFIG: felt252 = 'game_id_config';
const GAME_COUNT_CONFIG: felt252 = 'game_count_config';

#[derive(Model, Copy, Drop, Serde, Print)]
struct Game {
    #[key]
    game_id: u32,
    #[key]
    game_id_config: felt252,
    players: u32,
    status: GameStatus
}

#[derive(Model, Copy, Drop, Serde, Print)]
struct GameCount {
    #[key]
    game_count_config: felt252,
    count: u32,
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq)]
enum GameStatus {
    NotStarted: (),
    Lobby: (),
    InProgress: (),
    Finished: (),
}

impl GameStatusFelt252 of Into<GameStatus, felt252> {
    fn into(self: GameStatus) -> felt252 {
        match self {
            GameStatus::NotStarted => 0,
            GameStatus::Lobby => 1,
            GameStatus::InProgress => 2,
            GameStatus::Finished => 3,
        }
    }
}
