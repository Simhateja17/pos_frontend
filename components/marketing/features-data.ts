export const FEAT_ICONS: Record<string, string> = {
  bill: '<path d="M5.5 8.5h13l-1 11a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8z"/><path d="M8.7 8.5V6.2a3.3 3.3 0 0 1 6.6 0v2.3"/>',
  bolt: '<path d="M12.6 2.4 5 13.6h5.2l-1 8L17 10.4h-5.2z"/>',
  inventory: '<path d="M3.2 8.4 12 3.8l8.8 4.6-8.8 4.6z"/><path d="M3.2 8.4v7.3l8.8 4.6 8.8-4.6V8.4M12 13v7.7"/>',
  channels: '<circle cx="12" cy="12" r="2.4"/><path d="M7.2 7.2a6.8 6.8 0 0 0 0 9.6M16.8 7.2a6.8 6.8 0 0 1 0 9.6M4.2 4.2a11 11 0 0 0 0 15.6M19.8 4.2a11 11 0 0 1 0 15.6"/>',
  staff: '<circle cx="9" cy="8.2" r="3.1"/><path d="M3.5 19.4a5.5 5.5 0 0 1 11 0"/><path d="M16 5.4a3 3 0 0 1 0 5.8M17.2 13.6a5.5 5.5 0 0 1 3.3 5.3"/>',
  reports: '<path d="M4.2 4v14.8a1.5 1.5 0 0 0 1.5 1.5H20.5"/><path d="M8 15.2l3.6-4.1 3 2.6L20.2 7.6"/><circle cx="20.2" cy="7.6" r="1.1" fill="currentColor" stroke="none"/>',
  customer: '<circle cx="12" cy="8" r="3.6"/><path d="M5.6 20.2a6.4 6.4 0 0 1 12.8 0"/>',
  challan: '<path d="M2.6 6.4A1.5 1.5 0 0 1 4.1 5h8.4a1.5 1.5 0 0 1 1.5 1.5V16H2.6z"/><path d="M14 9h3.6l3.4 3.6V16H14z"/><circle cx="7" cy="18.4" r="2"/><circle cx="17.4" cy="18.4" r="2"/>',
  offline: '<path d="M4.2 15.6a4 4 0 0 1 1.6-7.5 6.2 6.2 0 0 1 11.3-1.6 4.6 4.6 0 0 1 2.6 8.2"/><path d="M3 3l18 18"/>',
  payments: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.6"/><path d="M2.5 9.6h19"/><path d="M5.8 14.6H10"/>',
};

export type Feature = [icon: string, title: string, body: string, badge3: string, badge4: string];

export const FEATURES: Feature[] = [
  ["bolt", "Tells you what to reorder", "For each item it works out how fast it is selling, how long your supplier takes, and what is already on the way, then tells you how much to order and why. If an item is too new to judge, it says so instead of guessing.", "", "\u2605"],
  ["bill", "Billing that adds up", "Scan or search, apply a discount, split the payment across cash, card and UPI. A bill cannot be closed until the payments match the total exactly.", "EXISTING", ""],
  ["inventory", "Stock you can trust", "Size, colour and material variants, stock per store, and barcode labels in one click. Every change in stock is written down and never quietly edited, so a wrong number can always be traced back to what caused it.", "", "\u2605"],
  ["offline", "Keeps billing when the net drops", "If the connection goes while the till is open, carry on billing. Bills are saved on the counter machine and sent up on their own once you are back online, and anything that clashes is shown to you rather than silently overwritten.", "", "\u2605"],
  ["channels", "More than one shop", "Send stock from one shop to another, with what was sent and what actually arrived recorded separately, so the same stock is never counted twice.", "", ""],
  ["challan", "Suppliers and orders", "Keep supplier details, how long each one takes to deliver, and their payment terms. Raise an order, and receive it in parts as the goods arrive.", "", ""],
  ["staff", "Shift and cash tally", "Start the day with an opening cash amount, check the till mid-day, count it at closing, and see straight away if it is short or over.", "", ""],
  ["customer", "Returns and exchanges", "Pull up any old bill, print or email it again, and take a return, refund or exchange against it.", "", ""],
  ["reports", "Reports you can open in Excel", "Sales by day, item, category and staff member. Stock value and stock movement. Every one of them downloads as a spreadsheet.", "", ""],
];

/**
 * US edition feature set. Same `Feature` tuple and same `FEAT_ICONS` keys as
 * India so both editions render through the identical `.feat-card` grid; only
 * the copy is market-specific.
 */
export const US_FEATURES: Feature[] = [
  ["bolt", "Tells you what to reorder", "Every night it looks at how each item has been selling and works out how much you are likely to need next. You get a quantity to order, a best case and a worst case, and the reason behind the number.", "", "\u2605"],
  ["reports", "Says when it is not sure", "An item needs about two months of sales before the forecast means anything. Until then it is listed as \"not enough history\" rather than given a made-up number, so you always know which part of your shelf the advice actually covers.", "", "\u2605"],
  ["inventory", "Stock you can trust", "Every change in stock is written down and never quietly edited. If a count looks wrong, you can trace it back to the exact sale, delivery or transfer that caused it. That is also why the forecast has clean history to learn from.", "", "\u2605"],
  ["bill", "Fast checkout", "Scan or search, pick the size and colour, take part cash and part card. A sale cannot close until the payments match the total exactly.", "EXISTING", ""],
  ["offline", "Keeps selling when the internet drops", "If the connection goes while the register is open, carry on selling. Sales are saved on the register and sent up on their own once you reconnect, and anything that clashes is shown to you instead of being resolved behind your back.", "", "\u2605"],
  ["channels", "More than one location", "Stock counted per location, and transfers between them that record what was sent and what actually arrived separately, so nothing is counted twice.", "", ""],
  ["challan", "Suppliers and purchase orders", "How long each supplier takes to deliver feeds straight into the reorder advice. Raise an order and receive it in parts as the boxes turn up.", "", ""],
  ["staff", "Shift and cash control", "Opening float, a mid-shift check, a count at close, and the difference shown plainly for every register session.", "", ""],
  ["customer", "Returns and receipts", "Receipts by email or on paper, and any of them can be pulled up later for a return, refund or exchange.", "", ""],
];
