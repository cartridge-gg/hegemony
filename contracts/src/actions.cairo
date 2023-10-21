use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use starknet::{ContractAddress, ClassHash};

#[starknet::interface]
trait IActions<TContractState> {
    fn spawn(self: @TContractState);
}

#[dojo::contract]
mod actions {
    use starknet::{ContractAddress, get_caller_address};
    use hegemony::models::{Hex, Vec2};
    use super::IActions;

    #[external(v0)]
    impl ActionsImpl of IActions<ContractState> {
        // ContractState is defined by system decorator expansion
        fn spawn(self: @ContractState) {}
    }
}
