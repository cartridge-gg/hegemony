fn hash_move(qty: u32, x: u32, y: u32) -> felt252 {
    let mut pos = array![qty.into(), x.into(), y.into()];
    // let mut serialized = array![];
    // pos.serialize(ref serialized);

    poseidon::poseidon_hash_span(pos.span())
}
