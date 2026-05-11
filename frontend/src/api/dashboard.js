import client from './client'
export const getDashboardSummary = () => client.get('/settings/dashboard-summary').then(r => r.data)
export const getAgentLogs = (limit = 10) => client.get('/settings/agent-logs', { params: { limit } }).then(r => r.data)
