const SESSION_DURATION = 20 * 60 * 1000 // 20 minutes in milliseconds

export const storeSession = (token: string) => {
  const currentTime = new Date().getTime()
  localStorage.setItem("authToken", token)
  localStorage.setItem("lastActivity", currentTime.toString())
}

export const updateLastActivity = () => {
  const currentTime = new Date().getTime()
  localStorage.setItem("lastActivity", currentTime.toString())
}

export const isSessionExpired = () => {
  const token = localStorage.getItem("authToken")
  const lastActivity = localStorage.getItem("lastActivity")

  if (!token || !lastActivity) return true

  const currentTime = new Date().getTime()
  const inactiveTime = currentTime - Number.parseInt(lastActivity)

  return inactiveTime > SESSION_DURATION
}

export const getSession = () => {
  const token = localStorage.getItem("authToken")

  if (!token || isSessionExpired()) {
    clearSession()
    return null
  }

  return token
}

export const clearSession = () => {
  localStorage.removeItem("authToken")
  localStorage.removeItem("lastActivity")
}

