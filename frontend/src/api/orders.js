import client from './client'
export const getOrders = (status) => client.get('/orders', { params: status ? { status } : {} }).then(r => r.data)
export const updateOrderStatus = (id, status) => client.patch(`/orders/${id}`, { status }).then(r => r.data)
