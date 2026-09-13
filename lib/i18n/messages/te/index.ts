/**
 * Telugu dictionary. Must match the English shape exactly (enforced by the
 * `Messages` type). Written for shop-counter Telugu: common trade words that
 * owners actually say in English (GST, UPI, SKU, bill, stock, barcode, PIN)
 * stay in English or are transliterated rather than force-translated.
 *
 * DRAFT — pending review by a native Telugu speaker.
 */
import type { Messages } from '../en'
import { common } from './common'
import { enums } from './enums'
import { nav } from './nav'
import { shell } from './shell'
import { states } from './states'
import { dashboard } from './dashboard'
import { orders } from './orders'
import { shifts } from './shifts'
import { checkout } from './checkout'

export const te: Messages = {
  checkout,
  common,
  enums,
  nav,
  shell,
  states,
  dashboard,
  orders,
  shifts,
}
