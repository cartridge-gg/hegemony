import { Account } from "starknet";

export interface Signer {
  account: Account;
}

export interface CreateGame extends Signer {
  commit_length: number;
  reveal_length: number;
  resolve_length: number;
  cycle_unit: number;
}

export interface JoinGame extends Signer {
  game_id: number;
}

export interface StartGame extends Signer {
  game_id: number;
}

export interface SpawnPlayer extends Signer {
  game_id: number;
}

export interface SpawnNewUnits extends Signer {
  game_id: number;
}
