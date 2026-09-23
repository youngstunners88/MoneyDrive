import {
  useActor as _useActor,
  type createActorFunction,
} from "@caffeineai/core-infrastructure";
import { type backendInterface, createActor } from "../../backend";

export function useActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  const result = _useActor<backendInterface>(
    createActor as createActorFunction<backendInterface>,
  );
  return result;
}
