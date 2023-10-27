use array::ArrayTrait;
use core::debug::PrintTrait;
use starknet::ContractAddress;
use dojo::database::schema::{Enum, Member, Ty, Struct, SchemaIntrospection};

#[derive(Copy, Drop, Serde, Print, Introspect)]
enum Terrain {
    LAND,
    WATER,
    MOUNTAIN,
}

#[derive(Copy, Drop, Serde, Print, Introspect)]
struct Vec2 {
    x: u8,
    y: u8
}

#[derive(Model, Copy, Drop, Print, Serde)]
struct Hex {
    #[key]
    x: u8,
    #[key]
    y: u8,
    owner: ContractAddress,
    units: u16,
    terrain: Terrain,
}

trait HexTrait {
    fn neighbors(self: @Hex) -> Array<Vec2>;
    fn is_valid_neighbor(self: @Hex, neighbor: Vec2) -> bool;
}

impl HexImpl of HexTrait {
    fn neighbors(self: @Hex) -> Array<Vec2> {
        let mut neighbors = array![
            Vec2 { x: *self.x, y: *self.y - 1 }, // North
            Vec2 { x: *self.x + 1, y: *self.y }, // Northeast
            Vec2 { x: *self.x + 1, y: *self.y + 1 }, // Southeast
            Vec2 { x: *self.x, y: *self.y + 1 }, // South
            Vec2 { x: *self.x - 1, y: *self.y }, // Southwest
            Vec2 { x: *self.x - 1, y: *self.y - 1 }, // Northwest
        ];

        return neighbors;
    }

    fn is_valid_neighbor(self: @Hex, neighbor: Vec2) -> bool {
        // let dx = self.x.(i32) - neighbor.x.(i32);
        // let dy = self.y.(i32) - neighbor.y.(i32);
        // return dx.abs() <= 1 && dy.abs() <= 1 && (dx, dy) != (0, 0);
        false
    }
}

#[cfg(test)]
mod tests {
    use starknet::{contract_address_const, ContractAddress};
    use debug::PrintTrait;
    use super::{Hex, HexTrait, Vec2};

    #[test]
    #[available_gas(100000)]
    fn test_hex_neighbors() {
        let hex = Hex { x: 69, y: 0, owner: contract_address_const::<0x1337>(), units: 0 };
        let neighbors = hex.neighbors();

        assert(neighbors.len() == 6, 'Hex should have 6 neighbors');

        let expected_neighbors = array![
            Vec2 { x: 420, y: 255 }, // North
            Vec2 { x: 421, y: 0 }, // Northeast
            Vec2 { x: 421, y: 1 }, // Southeast
            Vec2 { x: 420, y: 1 }, // South
            Vec2 { x: 419, y: 0 }, // Southwest
            Vec2 { x: 419, y: 255 }, // Northwest
        ];
    // for(i, neighbor)
    // in
    // neighbors.iter().enumerate()
    // {
    //     assert_eq!(*neighbor, expected_neighbors[i], "Neighbor at index {} is incorrect", i);
    // }
    }
}
