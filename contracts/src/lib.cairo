mod systems {
    mod spawn;
    mod move;
    mod game_lobby;
    mod combat;
}

mod models {
    mod game;
    mod position;
    mod squad;
}

mod tests {
    mod game;
}

mod config {
    const CENTER_X: u32 = 1000;
    const CENTER_Y: u32 = 1000;
    const STARTING_SQUAD_SIZE: u32 = 3;
    const REINFORCEMENT_SQUAD_SIZE: u32 = 3;
}

mod utils {
    mod utils;
}
