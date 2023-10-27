use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use starknet::{ContractAddress, ClassHash};

#[starknet::interface]
trait IActions<TContractState> {
    fn spawn(self: @TContractState, players: Array<ContractAddress>, seed: usize);
}

#[dojo::contract]
mod actions {
    use starknet::{contract_address_const, ContractAddress, get_caller_address};
    use hegemony::models::{Hex, Terrain, Vec2};
    use super::IActions;

    #[starknet::interface]
    trait IBase<TContractState> {
        fn world(self: @TContractState) -> IWorldDispatcher;
    }

    impl IBaseImpl of IBase<ContractState> {
        fn world(self: @ContractState) -> IWorldDispatcher {
            self.world_dispatcher.read()
        }
    }

    #[external(v0)]
    impl ActionsImpl of IActions<ContractState> {
        // ContractState is defined by system decorator expansion
        fn spawn(self: @ContractState, players: Array<ContractAddress>, seed: usize) {
            let world = self.world();

            let mut x = 0_u8;
            let mut y = 0_u8;

            loop {
                if x == 2 {
                    break;
                }

                loop {
                    if y == 2 {
                        y = 0;
                        break;
                    }

                    set!(
                        world,
                        Hex {
                            x,
                            y,
                            owner: contract_address_const::<0x1337>(),
                            units: 0,
                            terrain: Terrain::LAND
                        }
                    );

                    y += 1;
                };

                x += 1;
            };
        }
    }
}
