const SESSION_DURATION = 20 * 60 * 1000 // 20 minutes in milliseconds
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

export const storeSession = (token: string, rememberMe: boolean = false) => {
  const currentTime = new Date().getTime()
  localStorage.setItem("authToken", token)
  localStorage.setItem("lastActivity", currentTime.toString())
  if (rememberMe) {
    localStorage.setItem("rememberMe", "true")
  } else {
    localStorage.removeItem("rememberMe")
  }
}

export const updateLastActivity = () => {
  const currentTime = new Date().getTime()
  localStorage.setItem("lastActivity", currentTime.toString())
}

export const isSessionExpired = () => {
  const token = localStorage.getItem("authToken")
  const lastActivity = localStorage.getItem("lastActivity")
  const rememberMe = localStorage.getItem("rememberMe") === "true"

  if (!token || !lastActivity) return true

  const currentTime = new Date().getTime()
  const inactiveTime = currentTime - Number.parseInt(lastActivity)

  const duration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION

  return inactiveTime > duration
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
  localStorage.removeItem("rememberMe")
}

