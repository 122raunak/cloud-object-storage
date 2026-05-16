import api from './axios.js'
import axios from 'axios'

export const storageApi = {
  getUploadUrl:    (data)   => api.post('/api/storage/upload-url', data),
  confirmUpload:   (data)   => api.post('/api/storage/confirm-upload', data),
  getFiles:        (params) => api.get('/api/storage/files', { params }),
  getDownloadUrl:  (fileId) => api.get(`/api/storage/download-url/${fileId}`),
  deleteFile:      (fileId) => api.delete(`/api/storage/${fileId}`),
  restoreFile:     (fileId) => api.patch(`/api/storage/restore/${fileId}`),
  getShareUrl: (fileId, expiry = 3600) => api.get(`/api/storage/share/${fileId}`, { params: { expiry } }),
  uploadToPresignedUrl: (uploadUrl, file, onProgress) =>
    axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      },
    }),
}