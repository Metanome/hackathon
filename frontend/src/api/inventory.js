import client from './client'
export const getInventory = () => client.get('/inventory').then(r => r.data)
export const updateStock = (id, data) => client.patch(`/inventory/${id}`, data).then(r => r.data)
export const createProduct = (data) => client.post('/inventory', data).then(r => r.data)
export const uploadCSV = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return client.post('/inventory/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}
