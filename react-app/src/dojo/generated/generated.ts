/* Autogenerated file. Do not edit manually. */

import { Account, Call } from "starknet";
import { DojoProvider } from "@dojoengine/core";
import { CreateGame, SpawnPlayer } from "./interfaces";

export type IWorld = Awaited<ReturnType<typeof setupWorld>>;

export async function setupWorld(provider: DojoProvider) {
  function combat() {
    const contract_name = "combat";

    const resolve_combat = async ({
      account,
      game_id,
      x,
      y,
    }: {
      account: Account;
      game_id: number;
      x: number;
      y: number;
    }) => {
      try {
        return await provider.execute(
          account,
          contract_name,
          "resolve_combat",
          [game_id, x, y]
        );
      } catch (error) {
        console.error("Error executing spawn:", error);
        throw error;
      }
    };

    return { resolve_combat };
  }
  function game_lobby() {
    const contract_name = "game_lobby";

    const create_game = async ({
      account,
      commit_length,
      reveal_length,
      resolve_length,
      cycle_unit,
    }: CreateGame) => {
      try {
        return await provider.execute(account, contract_name, "create_game", [
          commit_length,
          reveal_length,
          resolve_length,
          cycle_unit,
        ]);
      } catch (error) {
        console.error("Error executing spawn:", error);
        throw error;
      }
    };
    const join_game = async ({
      account,
      game_id,
    }: {
      account: Account;
      game_id: number;
    }) => {
      try {
        return await provider.execute(account, contract_name, "join_game", [
          game_id,
        ]);
      } catch (error) {
        console.error("Error executing spawn:", error);
        throw error;
      }
    };
    const start_game = async ({
      account,
      game_id,
    }: {
      account: Account;
      game_id: number;
    }) => {
      try {
        return await provider.execute(account, contract_name, "start_game", [
          game_id,
        ]);
      } catch (error) {
        console.error("Error executing spawn:", error);
        throw error;
      }
    };
    return { create_game, join_game, start_game };
  }
  function move() {
    const contract_name = "move";

    const move_squad_commitment = async ({
      account,
      game_id,
      squad_id,
      new_squad_id,
      hash,
    }: {
      account: Account;
      game_id: number;
      squad_id: number;
      new_squad_id: number;
      hash: bigint;
    }) => {
      try {
        return await provider.execute(
          account,
          contract_name,
          "move_squad_commitment",
          [game_id, squad_id, new_squad_id, hash]
        );
      } catch (error) {
        console.error("Error executing spawn:", error);
        throw error;
      }
    };

    const move_squad_reveal = async ({
      account,
      game_id,
      squad_id,
      x,
      y,
    }: {
      account: Account;
      game_id: number;
      squad_id: number;
      x: number;
      y: number;
    }) => {
      try {
        return await provider.execute(
          account,
          contract_name,
          "move_squad_reveal",
          [game_id, squad_id, x, y]
        );
      } catch (error) {
        console.error("Error executing spawn:", error);
        throw error;
      }
    };

    const move_squad_multi = async ({
      account,
      call_data,
    }: {
      account: Account;
      call_data: Call[];
    }) => {
      try {
        return await provider.executeMulti(account, call_data);
      } catch (error) {
        console.error("Error executing spawn:", error);
        throw error;
      }
    };
    return {
      move_squad_commitment,
      move_squad_reveal,
      move_squad_multi,
    };
  }
  function spawn() {
    const contract_name = "spawn";

    const spawn_player = async ({ account, game_id }: SpawnPlayer) => {
      try {
        return await provider.execute(account, contract_name, "spawn_player", [
          game_id,
        ]);
      } catch (error) {
        console.error("Error executing spawn:", error);
        throw error;
      }
    };
    const spawn_new_units = async ({
      account,
      game_id,
    }: {
      account: Account;
      game_id: number;
    }) => {
      try {
        return await provider.execute(
          account,
          contract_name,
          "spawn_new_units",
          [game_id]
        );
      } catch (error) {
        console.error("Error executing spawn:", error);
        throw error;
      }
    };
    return { spawn_player, spawn_new_units };
  }
  return {
    combat: combat(),
    game_lobby: game_lobby(),
    move: move(),
    spawn: spawn(),
  };
}
