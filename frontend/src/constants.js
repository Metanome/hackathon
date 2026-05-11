export const APP_NAME = "Esnaf Tezgahı";

export const ROUTES = {
  DASHBOARD: '/',
  UPLOAD: '/upload',
  INVENTORY: '/inventory',
  ORDERS: '/orders',
  SETTINGS: '/settings',
}

export const SOURCE_LABELS = {
  image_order: 'IMAGE',
  voice: 'VOICE',
  manual: 'MANUAL',
}

export const STATUS_LABELS = {
  pending: 'Pending',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
}

export const STOCK_STATUS_LABELS = {
  ok: 'OK',
  low: 'Low',
  critical: 'Critical',
}

export const ALERT_TYPE_LABELS = {
  low_stock: 'Low Stock',
  critical_stock: 'Critical Stock',
  setup_required: 'Setup Required',
}
