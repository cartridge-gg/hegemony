# Hegemony

Strategic Hex game of world domination.

### Contract Structure

The game revolves around three stages per turn.

Commit stage = 8hrs
Reveal stage = 8hrs
Resolve stage = 8hrs

**Commit stage:** Players have to commit their moves to the board via hashing their squads movements.

**Reveal stage:** Players reveal their hashed moves. If they do not reveal their moves, then the squads unrevealed can be killed by anyone in the resolve stage...

**Resolve stage:** Combat can be resolved by anyone in this stage. Combat follows a basic rule of total domination for now.

## Quick start:

Download Dojo

```sh
curl -L https://install.dojoengine.org | bash
```

Run Katana:

```sh
katana --disable-fee
```

Build + Migrate world:

```sh
cd contracts
sozo build
sozo migrate
```

Run Torii:

```sh
# TEMP RUN KARIY FORK
cargo install --git https://github.com/kariy/dojo torii-server --rev c7d48d2 --force
torii -- --world 0x1ced4b9d69e6fe907fea23bea7e27b287ad3589c62659ccc0d78d435ba906f5
# torii --world 0x1ced4b9d69e6fe907fea23bea7e27b287ad3589c62659ccc0d78d435ba906f5
```

Run Client:

```sh
cd client
cargo run
```
