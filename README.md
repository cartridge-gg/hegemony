# Hegemony

Strategic Hex game.

### Contract Structure

`squads` - Players units are called squads which contain units

## Quick start:

Download Dojo

```sh
curl -L https://install.dojoengine.org | bash
```

Run Katana:

```sh
katana
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
