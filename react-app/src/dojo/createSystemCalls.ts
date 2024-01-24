import {
  Account,
  GetTransactionReceiptResponse,
  RevertedTransactionReceiptResponse,
} from "starknet";
import { Entity, getComponentValue } from "@dojoengine/recs";
import { uuid } from "@latticexyz/utils";
import { ClientComponents } from "./createClientComponents";
import { Direction, updatePositionWithDirection } from "../utils";
import {
  getEntityIdFromKeys,
  getEvents,
  setComponentsFromEvents,
} from "@dojoengine/utils";
import { ContractComponents } from "./generated/contractComponents";
import type { IWorld } from "./generated/generated";
import {
  CreateGame,
  JoinGame,
  SpawnNewUnits,
  SpawnPlayer,
  StartGame,
} from "./generated/interfaces";

import { toast } from "sonner";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { client }: { client: IWorld },
  contractComponents: ContractComponents,
  { Position }: ClientComponents
) {
  const extractedMessage = (message: string) => {
    return message.match(/\('([^']+)'\)/)?.[1];
  };

  const notify = (message: string, transaction: any) => {
    toast(
      transaction.execution_status != "REVERTED"
        ? message
        : extractedMessage(transaction.revert_reason)
    );
  };

  const create_game = async ({ account, ...props }: CreateGame) => {
    try {
      const { transaction_hash } = await client.game_lobby.create_game({
        account,
        ...props,
      });

      notify(
        "Game has been created.",
        await account.waitForTransaction(transaction_hash, {
          retryInterval: 100,
        })
      );
    } catch (error) {
      console.error("Error executing commit:", error);
      throw error;
    }
  };

  const join_game = async ({ account, ...props }: JoinGame) => {
    try {
      const { transaction_hash } = await client.game_lobby.join_game({
        account,
        ...props,
      });

      notify(
        `Joined game ${props.game_id}`,
        await account.waitForTransaction(transaction_hash, {
          retryInterval: 100,
        })
      );
    } catch (error) {
      console.error("Error executing commit:", error);
      throw error;
    }
  };

  const start_game = async ({ account, ...props }: StartGame) => {
    try {
      const { transaction_hash } = await client.game_lobby.start_game({
        account,
        ...props,
      });

      notify(
        `Started Game ${props.game_id}`,
        await account.waitForTransaction(transaction_hash, {
          retryInterval: 100,
        })
      );
    } catch (error) {
      console.error("Error executing commit:", error);
      throw error;
    }
  };

  const spawn_player = async ({ account, ...props }: SpawnPlayer) => {
    try {
      const { transaction_hash } = await client.spawn.spawn_player({
        account,
        ...props,
      });

      notify(
        `Spawned in game ${props.game_id}`,
        await account.waitForTransaction(transaction_hash, {
          retryInterval: 100,
        })
      );
    } catch (error) {
      console.error("Error executing commit:", error);
      throw error;
    }
  };

  const spawn_new_units = async ({ account, ...props }: SpawnNewUnits) => {
    try {
      const { transaction_hash } = await client.spawn.spawn_new_units({
        account,
        ...props,
      });

      notify(
        `Spawned new Units ${props.game_id}`,
        await account.waitForTransaction(transaction_hash, {
          retryInterval: 100,
        })
      );
    } catch (error) {
      console.error("Error executing commit:", error);
      throw error;
    }
  };
  return {
    create_game,
    join_game,
    start_game,
    spawn_player,
    spawn_new_units,
  };
}
