export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async (userId) => {
    if (!userId) return
    try {
      const res = await notificationsApi.getUnreadCount(userId)
      const d = res.data.data || res.data
      setUnreadCount(d.count ?? d.unreadCount ?? 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (!user?._id) return
    fetchUnreadCount(user._id)
    const interval = setInterval(() => fetchUnreadCount(user._id), 30000)
    return () => clearInterval(interval)
  }, [user?._id])

  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await authApi.refreshToken()
        const newToken = res.data.data?.accessToken
        if (newToken) {
          setAccessToken(newToken)
          setToken(newToken)
          const meRes = await authApi.me()
          const userData = meRes.data.data || meRes.data
          setUser(userData)
          fetchUnreadCount(userData._id)
        }
      } catch (err) {
        if (err.response?.status !== 429) {
          clearAccessToken()
          setToken(null)
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password })
    const { accessToken, user: userData } = res.data.data
    setAccessToken(accessToken)
    setToken(accessToken)
    setUser(userData)
    fetchUnreadCount(userData._id)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAccessToken()
    setToken(null)
    setUser(null)
    setUnreadCount(0)
  }, [])

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isAuthenticated: !!token,
    unreadCount,
    fetchUnreadCount,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}