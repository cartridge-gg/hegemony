use std::sync::Arc;

use bevy::{app::Plugin, prelude::Resource};
use dojo_types::schema::EntityModel;
use parking_lot::Mutex;
use starknet::accounts::Call;
use starknet::core::crypto::pedersen_hash;
use starknet::macros::{felt, selector};
use starknet::{
    accounts::{Account, SingleOwnerAccount},
    core::types::FieldElement,
    providers::{jsonrpc::HttpTransport, JsonRpcClient, Provider},
    signers::{LocalWallet, SigningKey},
};

#[derive(Resource)]
pub struct DojoResource {
    pub game_id: FieldElement,
    pub client: Arc<Mutex<torii_client::client::Client>>,
    pub account: SingleOwnerAccount<JsonRpcClient<HttpTransport>, LocalWallet>,
}

pub struct DojoPlugin {
    rpc_url: String,
    torii_url: String,
    world_address: FieldElement,
    account_address: FieldElement,
    private_key: FieldElement,
}

impl DojoPlugin {
    pub fn new(
        rpc_url: String,
        torii_url: String,
        world_address: FieldElement,
        account_address: FieldElement,
        private_key: FieldElement,
    ) -> Self {
        Self {
            rpc_url,
            torii_url,
            world_address,
            account_address,
            private_key,
        }
    }
}

impl Plugin for DojoPlugin {
    fn build(&self, app: &mut bevy::prelude::App) {
        let rt = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .unwrap();

        let provider =
            JsonRpcClient::new(HttpTransport::new(url::Url::parse(&self.rpc_url).unwrap()));
        let signer =
            LocalWallet::from_signing_key(SigningKey::from_secret_scalar(self.private_key));

        let chain_id = rt.block_on(provider.chain_id()).unwrap();

        let account = SingleOwnerAccount::new(
            provider,
            signer,
            self.account_address,
            chain_id,
            starknet::accounts::ExecutionEncoding::Legacy,
        );

        let p2 = felt!("0x5686a647a9cdd63ade617e0baf3b364856b813b508f03903eb58a7e622d5855");
        let p3 = felt!("0x765149d6bc63271df7b0316537888b81aa021523f9516a05306f10fd36914da");

        let _ = rt
            .block_on(
                account
                    .execute(vec![Call {
                        to: felt!(
                            "0x505e7bb5225bce942606eea5eacc3436400823081cbf0e5d59274408e480258"
                        ),
                        selector: selector!("spawn"),
                        calldata: vec![felt!("0x2"), p2, p3, felt!("0x1337")],
                    }])
                    .send(),
            )
            .unwrap();

        let game_id = pedersen_hash(&pedersen_hash(&self.account_address, &p2), &p3);

        let tiles = (0..0_u8)
            .map(|i| EntityModel {
                model: "Hex".into(),
                keys: vec![game_id, i.into(), i.into()],
            })
            .collect();

        let client = rt
            .block_on(
                torii_client::client::Client::build()
                    .set_entities_to_sync(tiles)
                    .build(
                        self.torii_url.clone(),
                        self.rpc_url.clone(),
                        self.world_address,
                    ),
            )
            .unwrap();

        let sub_task = rt.block_on(client.start_subscription()).unwrap();

        // move the sub service to another thread
        std::thread::spawn(move || {
            rt.block_on(sub_task);
        });

        app.insert_resource(DojoResource {
            game_id,
            client: Arc::new(Mutex::new(client)),
            account,
        });
    }
}
