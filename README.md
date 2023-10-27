# Hegemony

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

## Rules:

Hegemony - digital take on traditional Diplomacy boardgame
Objective: Use strategy and deception to control territories and be the first to dominate the map.
Duration: Each move represents 1 Day.

Setup:
Each player begins with 7 adjacent, randomly placed hexes on the map.
Players start with 12 military units, with 2 positioned on each border hex.
Each player has 1 primary unit factory, which serves as the spawn point for units.
Black dots represent neutral city-state factories. They can be captured. If unclaimed, any player can seize them based on combat resolution rules.
Red squares signify impassable mountains.

Unit Movement:
A unit can move a maximum of 2 adjacent tiles on land per day.
Moving onto the sea costs a unit one move. If already at sea, a unit can move 3 tiles. Launching or landing from the sea requires one move.

Gameplay:
Players record their moves daily on a private Google sheet, specifying unit movements, and if they are allied for the upcoming day.
If players are allied, they are allowed to move onto the allies land, without conflict.
Players can communicate either privately or publicly to strategize. However, these discussions are non-binding.
Moves are finalized at 12 am. An 'Arbiter' then processes all moves, handles combat resolution, and reveals the results.
The game concludes when one player controls 10 factories or when the remaining players agree to a truce.

Unit Spawning:
Every 2 days, players receive 4 new units for each factory they own.
Units only spawn at the primary factory, not at captured ones.
To receive new units, players must control the factory at the dawn of the spawn day. Otherwise, no new units are awarded.

Combat Resolution:
Capturing a Territory:
If the hex is unoccupied and only one player moves in, they take control.
If two players attempt to capture the same hex with equal units, it results in a standoff, and neither progresses. If one player has more units, they capture the hex.
Defending a Territory:
If both the attacker and defender have equal units on a hex, the attacker's move is nullified.
If the attacker has more units, the defender retreats, losing the difference in units. If this leads to a negative count, the units are destroyed. On their next move, the defender chooses a free hex to relocate their units. If no such hex exists, all defender units are eliminated.

IF YOU DO NOT SUMBIT A VALID MOVE YOU MISS THAT TILES MOVE.
