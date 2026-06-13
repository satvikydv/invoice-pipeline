import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
})

export const uploadInvoice = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/invoices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  })
}

export const getInvoice = (jobId) => api.get(`/invoices/${jobId}`)
export const getInvoiceAudit = (jobId) => api.get(`/invoices/${jobId}/audit`)
export const listInvoices = (params) => api.get('/invoices', { params })
export const getStats = () => api.get('/invoices/stats')
