export type IndiaStateCategory = 'state' | 'union-territory'

export type IndiaStateOption = {
  name: string
  category: IndiaStateCategory
}

/**
 * Address-friendly names for India's 28 states and 8 Union Territories.
 * Keep the stored value aligned with the names used by the India product and
 * backend tenant records (for example, "Delhi", not a tax-code label).
 */
export const INDIAN_STATE_OPTIONS: IndiaStateOption[] = [
  { name: 'Andhra Pradesh', category: 'state' },
  { name: 'Arunachal Pradesh', category: 'state' },
  { name: 'Assam', category: 'state' },
  { name: 'Bihar', category: 'state' },
  { name: 'Chhattisgarh', category: 'state' },
  { name: 'Goa', category: 'state' },
  { name: 'Gujarat', category: 'state' },
  { name: 'Haryana', category: 'state' },
  { name: 'Himachal Pradesh', category: 'state' },
  { name: 'Jharkhand', category: 'state' },
  { name: 'Karnataka', category: 'state' },
  { name: 'Kerala', category: 'state' },
  { name: 'Madhya Pradesh', category: 'state' },
  { name: 'Maharashtra', category: 'state' },
  { name: 'Manipur', category: 'state' },
  { name: 'Meghalaya', category: 'state' },
  { name: 'Mizoram', category: 'state' },
  { name: 'Nagaland', category: 'state' },
  { name: 'Odisha', category: 'state' },
  { name: 'Punjab', category: 'state' },
  { name: 'Rajasthan', category: 'state' },
  { name: 'Sikkim', category: 'state' },
  { name: 'Tamil Nadu', category: 'state' },
  { name: 'Telangana', category: 'state' },
  { name: 'Tripura', category: 'state' },
  { name: 'Uttar Pradesh', category: 'state' },
  { name: 'Uttarakhand', category: 'state' },
  { name: 'West Bengal', category: 'state' },
  { name: 'Andaman and Nicobar Islands', category: 'union-territory' },
  { name: 'Chandigarh', category: 'union-territory' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', category: 'union-territory' },
  { name: 'Delhi', category: 'union-territory' },
  { name: 'Jammu and Kashmir', category: 'union-territory' },
  { name: 'Ladakh', category: 'union-territory' },
  { name: 'Lakshadweep', category: 'union-territory' },
  { name: 'Puducherry', category: 'union-territory' },
]
