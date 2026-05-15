import { useState, useCallback } from 'react'
import { storageApi } from '../api/storage.api.js'

export function useFiles() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 20 })

  const fetchFiles = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await storageApi.getFiles({
        ...params,
        _t: Date.now(),
      })
      const outer = res.data.data
      const fileList = outer?.data || []
      const paginationData = outer?.pagination || {}
      setFiles(Array.isArray(fileList) ? fileList : [])
      setPagination({
        page: params.page || 1,
        total: paginationData.total || 0,
        limit: params.limit || 20,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteFile = useCallback(async (fileId) => {
    await storageApi.deleteFile(fileId)
  }, [])

  const restoreFile = useCallback(async (fileId) => {
    await storageApi.restoreFile(fileId)
  }, [])

  const getDownloadUrl = useCallback(async (fileId) => {
    const res = await storageApi.getDownloadUrl(fileId)
    return res.data.data?.downloadUrl || res.data.downloadUrl
  }, [])

  return { files, loading, error, pagination, fetchFiles, deleteFile, restoreFile, getDownloadUrl }
}