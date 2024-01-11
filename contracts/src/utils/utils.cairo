fn hash_move(x: u32, y: u32) -> felt252 {
    let mut pos = array![x, y];
    let mut serialized = array![];
    pos.serialize(ref serialized);

    poseidon::poseidon_hash_span(serialized.span())
}
