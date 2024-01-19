use starknet::{get_block_timestamp, ContractAddress};

const GAME_ID_CONFIG: felt252 = 'game_id_config';
const GAME_COUNT_CONFIG: felt252 = 'game_count_config';

const COMMIT_TIME_HOURS: u64 = 8;
const REVEAL_TIME_HOURS: u64 = 8;
const RESOLVE_TIME_HOURS: u64 = 8;

const ONE_HOUR: u64 = 3600;
const ONE_MINUTE: u64 = 60;
const SIX_MINUTES: u64 = 360;

const SPAWN_CYCLE: u64 = 2;


// Games are based on cycle units
// Each cycle is a cycle_unit which is a unix time lenght, could be 1 minute or 1 year.
// the cycle unit is divided into 3 stages: commit, reveal, resolve

// example
// cycle_unit = 1 minute
// commit_length = 20
// reveal_length = 20
// resolve_length = 20

// this means that each cycle is 60 minutes long

#[derive(Copy, Drop, Serde)]
struct GameConfig {
    commit_length: u64,
    reveal_length: u64,
    resolve_length: u64,
    cycle_unit: u64
}

#[derive(Model, Copy, Drop, Serde)]
struct Game {
    #[key]
    game_id: u32,
    #[key]
    game_id_config: felt252,
    players: u32,
    status: GameStatus,
    start_time: u64,
    commit_length: u64,
    reveal_length: u64,
    resolve_length: u64,
    cycle_unit: u64
}

#[generate_trait]
impl GameImpl of GameTrait {
    fn total_cycle_length(self: Game) -> u64 {
        self.commit_length + self.reveal_length + self.resolve_length
    }
    fn get_turn_stage(self: Game) -> TurnStage {
        let cycle_units_since_start = (get_block_timestamp() - self.start_time) / self.cycle_unit;

        let stage = cycle_units_since_start % self.total_cycle_length();

        if stage < self.commit_length {
            TurnStage::Commit
        } else if stage < (self.commit_length + self.reveal_length) {
            TurnStage::Reveal
        } else {
            TurnStage::Resolve
        }
    }
    // returns the number of the current cycle
    fn get_cycle_number(self: Game) -> u64 {
        ((get_block_timestamp() - self.start_time) / (self.cycle_unit) / self.total_cycle_length())
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
