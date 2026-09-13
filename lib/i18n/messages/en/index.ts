/**
 * English source dictionary. Every key added here must also be added to
 * `../te/index.ts` — the `Messages` type makes a missing Telugu key a
 * compile error.
 *
 * One namespace file per module keeps edits from colliding.
 */
import { common } from './common'
import { enums } from './enums'
import { nav } from './nav'
import { shell } from './shell'
import { states } from './states'
import { dashboard } from './dashboard'
import { orders } from './orders'
import { shifts } from './shifts'
import { inventory } from './inventory'
import { records } from './records'
import { customers } from './customers'
import { members } from './members'
import { settings } from './settings'
import { reports } from './reports'
import { checkout } from './checkout'

export const en = {
  checkout,
  common,
  enums,
  nav,
  shell,
  states,
  dashboard,
  orders,
  shifts,
  inventory,
  records,
  customers,
  members,
  settings,
  reports,
}

type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> }

/** Shape every translation must match exactly. */
export type Messages = DeepStrings<typeof en>
