export const APP_ROUTES = [
  { path: '/', label: 'Dashboard' },
  { path: '/receive', label: 'Receive' },
  { path: '/roast', label: 'Log Roast' },
  { path: '/profiles', label: 'Profiles' },
  { path: '/pack', label: 'Pack Bags' },
  { path: '/sale', label: 'Record Sale' },
  { path: '/history', label: 'History' },
  { path: '/records', label: 'Records' },
  { path: '/settings', label: 'Settings' },
] as const

export const QUICK_ACTIONS = [
  { path: '/roast', label: 'Log Roast', detail: 'Record a new roast batch' },
  { path: '/pack', label: 'Pack Bags', detail: 'Package roasted coffee into bags' },
  { path: '/sale', label: 'Record Sale', detail: 'Log a sale and update inventory' },
] as const
