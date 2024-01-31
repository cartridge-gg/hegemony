# Hegemony

> Basic visual of a game - this is not a representation of the final game.
> ![hegemony](./media/Hegemony.png)

Strategic Hex game of world domination.

### V0.1.0 Features

- Players can spawn on a grid. They are added to the game in a concentric circle 10 hexes from each other
- Players start with 6 squads of 2 around their home base
- Players move their squads around to try and capture Outposts
- Players spawn 4 units every cycle from their home base
- The hex map is a noise grid
- If a players home base has been held for more than 2 turns, the player is destroyed - their troops remain until they are destroyed.
- Combat resolution is based on most units

## Game Loop

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

### Terminal 1

```sh
katana --disable-fee
```

### Terminal 2

Build + Migrate world:

```sh
cd contracts
sozo build
sozo migrate
```

### Terminal 4
Start Torii to index changes to the world for the client to consume
```sh
torii --world [contract-address]
```

### Terminal 5

```sh
cd react-app

pnpm i

pnpm run dev
```
