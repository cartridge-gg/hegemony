#[dojo::contract]
mod actions {
    use starknet::{ContractAddress, contract_address_const, get_caller_address};

    use hegemony::models::{Position, Owner, Squad, PlayerSquadCount};

    #[generate_trait]
    #[external(v0)]
    impl ActionsImpl of IActions {
        fn spawn(self: @ContractState) {
            let world = self.world();

            let position = Position { entity_id: 0, x: 0, y: 0, };

            let owner = Owner { entity_id: 0, address: get_caller_address() };

            let unit = Unit { entity_id: 0, quantity: 0 };

            set!(world, (position, owner, unit));
        }
    }
}
