use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use starknet::{ContractAddress, ClassHash};

// #[starknet::interface]
// trait IActions<TContractState> {
//     fn spawn(self: @TContractState, players: Array<ContractAddress>, seed: usize);
//     fn spawn_hex(self: @TContractState, game: u128, x: usize, y: usize);
// }

#[dojo::contract]
mod actions {
    use starknet::{ContractAddress, contract_address_const, get_caller_address};
    use hegemony::models::{Hex, Terrain, Vec2, Game};

    #[starknet::interface]
    trait IBase<TContractState> {
        fn world(self: @TContractState) -> IWorldDispatcher;
    }

    impl IBaseImpl of IBase<ContractState> {
        fn world(self: @ContractState) -> IWorldDispatcher {
            self.world_dispatcher.read()
        }
    }

    #[generate_trait]
    #[external(v0)]
    impl ActionsImpl of IActions {
        // ContractState is defined by system decorator expansion
        fn spawn(self: @ContractState, players: Array<ContractAddress>, seed: usize) {
            let world = self.world();

            set!(world, Game { id: seed, owner: get_caller_address(), seed, });
        }

        fn spawn_hex(self: @ContractState, game: u128, x: u8, y: u8) {
            let world = self.world();
            set!(world, Hex { game, x, y, owner: contract_address_const::<0>(), units: 0 });
        }
    }
}
