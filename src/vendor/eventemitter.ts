import OriginalEventEmitter2 from "eventemitter2"
import type { EventEmitter2 as OriginalEventEmitter2Type } from "eventemitter2"

// Has bad typings, see https://github.com/microsoft/TypeScript/issues/50466
export const EventEmitter2 =
  OriginalEventEmitter2 as unknown as typeof OriginalEventEmitter2.EventEmitter2
export type EventEmitter2 = OriginalEventEmitter2Type
