use starknet::{get_block_timestamp, ContractAddress};

const GAME_ID_CONFIG: felt252 = 'game_id_config';
const GAME_COUNT_CONFIG: felt252 = 'game_count_config';

const COMMIT_TIME_HOURS: u64 = 8;
const REVEAL_TIME_HOURS: u64 = 8;
const RESOLVE_TIME_HOURS: u64 = 8;

const SPAWN_CYCLE: u64 = 2;

#[derive(Model, Copy, Drop, Serde)]
struct Game {
    #[key]
    game_id: u32,
    #[key]
    game_id_config: felt252,
    players: u32,
    status: GameStatus,
    start_time: u64,
}

#[generate_trait]
impl GameImpl of GameTrait {
    fn get_turn_stage(self: Game) -> TurnStage {
        let hours_since_start = (get_block_timestamp() - self.start_time) / (60 * 60);

        let stage = hours_since_start % 24;

        if stage < COMMIT_TIME_HOURS {
            TurnStage::Commit
        } else if stage < (COMMIT_TIME_HOURS + REVEAL_TIME_HOURS) {
            TurnStage::Reveal
        } else {
            TurnStage::Resolve
        }
    }
    // returns the number of the current cycle
    fn get_cycle_number(self: Game) -> u64 {
        ((get_block_timestamp() - self.start_time) / (60 * 60) / 24)
    }
    fn assert_is_spawn_cycle(self: Game) {
        assert(self.get_cycle_number() % SPAWN_CYCLE == 0, 'Not in spawn cycle');
    }
    fn assert_commit_stage(self: Game) {
        self.assert_in_progress();
        assert(self.get_turn_stage() == TurnStage::Commit, 'Not in commit stage');
    }
    fn assert_reveal_stage(self: Game) {
        self.assert_in_progress();
        assert(self.get_turn_stage() == TurnStage::Reveal, 'Not in reveal stage');
    }
    fn assert_resolve_stage(self: Game) {
        self.assert_in_progress();
        assert(self.get_turn_stage() == TurnStage::Resolve, 'Not in resolve stage');
    }
    fn assert_in_progress(self: Game) {
        assert(self.status == GameStatus::InProgress, 'Game not started');
    }
    fn assert_lobby(self: Game) {
        assert(self.status == GameStatus::Lobby, 'Game not in lobby');
    }
    fn assert_not_started(self: Game) {
        assert(self.status == GameStatus::NotStarted, 'Game already started');
    }
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq, Print)]
enum TurnStage {
    Commit: (),
    Reveal: (),
    Resolve: ()
}

#[derive(Model, Copy, Drop, Serde, Print)]
struct GameCount {
    #[key]
    game_count_config: felt252,
    count: u32,
}

#[derive(Model, Copy, Drop, Serde, Print)]
struct GamePlayerId {
    #[key]
    game_id: u32,
    #[key]
    game_id_config: felt252,
    #[key]
    player: ContractAddress,
    id: u32,
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq, Print)]
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
