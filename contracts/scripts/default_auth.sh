#!/bin/bash
set -euo pipefail
pushd $(dirname "$0")/..

export RPC_URL="http://localhost:5050";

export WORLD_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.world.address')

export COMBAT_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "hegemony::systems::combat::combat" ).address')

export GAME_LOBBY_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "hegemony::systems::game_lobby::game_lobby" ).address')

export SPAWN_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "hegemony::systems::spawn::spawn" ).address')

export MOVE_ADDRESS=$(cat ./target/dev/manifest.json | jq -r '.contracts[] | select(.name == "hegemony::systems::move::move" ).address')

echo "---------------------------------------------------------------------------"
echo world : $WORLD_ADDRESS 
echo " "
echo "---------------------------------------------------------------------------"

# enable system -> component authorizations
COMPONENTS=("Game" "GameCount" "GamePlayerId" "Position" "Base" "EnergySource" "PlayerEnergySourceCount" "PositionSquadCount" "PositionSquadEntityIdByIndex" "PositionSquadIndexByEntityId" "SquadCommitmentHash" "Squad" "PlayerSquadCount" )

for component in ${COMPONENTS[@]}; do
    sozo auth writer $component $COMBAT_ADDRESS --world $WORLD_ADDRESS --rpc-url $RPC_URL

    sleep 0.2

    sozo auth writer $component $GAME_LOBBY_ADDRESS --world $WORLD_ADDRESS --rpc-url $RPC_URL

    sleep 0.2

    sozo auth writer $component $SPAWN_ADDRESS --world $WORLD_ADDRESS --rpc-url $RPC_URL

    sleep 0.2

    sozo auth writer $component $MOVE_ADDRESS --world $WORLD_ADDRESS --rpc-url $RPC_URL

    sleep 0.2
done

echo "Default authorizations have been successfully set."