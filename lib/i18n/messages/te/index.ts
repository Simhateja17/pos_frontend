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
import { inventory } from './inventory'
import { records } from './records'
import { customers } from './customers'
import { members } from './members'
import { settings } from './settings'
import { reports } from './reports'
import { receivables } from './receivables'
import { notifications } from './notifications'
import { demand } from './demand'
import { setup } from './setup'
import { documents } from './documents'
import { returns } from './returns'
import { hardware } from './hardware'
import { email } from './email'
import { importData } from './import'
import { billing } from './billing'
import { offline } from './offline'
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
  inventory,
  records,
  customers,
  members,
  settings,
  reports,
  receivables,
  notifications,
  demand,
  setup,
  documents,
  returns,
  hardware,
  email,
  importData,
  billing,
  offline,
}
