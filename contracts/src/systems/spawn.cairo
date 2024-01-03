#[starknet::interface]
trait ISpawn<TContractState> {
    fn spawn_squad(self: @TContractState, game_id: u32);
}

#[dojo::contract]
mod spawn {
    use super::ISpawn;
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::models::{
        position::{
            Position, PositionSquadCount, PositionSquadEntityIdByIndex, PositionSquadIndexByEntityId
        },
        squad::{Squad, PlayerSquadCount}, game::{GameCount, GAME_ID_CONFIG, Game, GameStatus}
    };

    use poseidon::poseidon_hash_span;

    #[external(v0)]
    impl SpawnImpl of ISpawn<ContractState> {
        fn spawn_squad(self: @ContractState, game_id: u32) {
            let world = self.world();

            let game = get!(world, (game_id, GAME_ID_CONFIG), Game);

            // TODO: complete lobby logic - this is dumb check right now
            assert(game.status != GameStatus::NotStarted, 'Game has not started yet');

            let player = get_caller_address();

            // increment squads
            let mut player_squad_count = get!(world, (game_id, player), PlayerSquadCount);
            player_squad_count.count += 1;

            // // make a squad
            let squad = Squad {
                game_id, player, squad_id: player_squad_count.count, unit_qty: 10, owner: player
            };

            // // TODO: Placement algorithm - we should add new players in a concentric circle around the center so none are too far from others
            let x: u32 = 10;
            let y: u32 = 10;

            // // set position
            let position = Position { game_id, player, squad_id: player_squad_count.count, x, y };

            // // squad position count
            let mut new_position_squad_count = get!(world, (game_id, x, y), PositionSquadCount);
            new_position_squad_count.count += 1;

            let squad_entity_id = poseidon_hash_span(
                array![game_id.into(), player.into(), player_squad_count.count.into()].span()
            );

            // // index squad position
            let new_position_squad_by_index = PositionSquadEntityIdByIndex {
                game_id, x, y, squad_position_index: new_position_squad_count.count, squad_entity_id
            };

            // // index squad position by id
            let new_position_squad_index_by_id = PositionSquadIndexByEntityId {
                game_id, x, y, squad_entity_id, squad_position_index: new_position_squad_count.count
            };

            set!(
                world,
                (
                    position,
                    player_squad_count,
                    new_position_squad_count,
                    new_position_squad_by_index,
                    new_position_squad_index_by_id
                )
            );
        }
    }
}
