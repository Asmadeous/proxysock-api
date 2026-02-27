// Session durations
const SESSION_DURATION = 20 * 60 * 1000            // 20 min inactivity for normal sessions
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days absolute for remember-me

// Store session after login.
// - rememberMe=true  → stores an absolute expiry 30 days from now, no inactivity tracking
// - rememberMe=false → stores lastActivity for 20-min inactivity timeout
export const storeSession = (token: string, rememberMe: boolean = false) => {
  const now = new Date().getTime()
  localStorage.setItem("authToken", token)

  if (rememberMe) {
    localStorage.setItem("rememberMe", "true")
    localStorage.setItem("sessionExpiry", (now + REMEMBER_ME_DURATION).toString())
    localStorage.removeItem("lastActivity") // not needed for remember-me
  } else {
    localStorage.removeItem("rememberMe")
    localStorage.removeItem("sessionExpiry")
    localStorage.setItem("lastActivity", now.toString())
  }
}

// Update inactivity timer — only relevant for non-remember-me sessions
export const updateLastActivity = () => {
  const rememberMe = localStorage.getItem("rememberMe") === "true"
  if (rememberMe) return // don't touch expiry for persistent sessions
  localStorage.setItem("lastActivity", new Date().getTime().toString())
}

export const isSessionExpired = () => {
  const token = localStorage.getItem("authToken")
  if (!token) return true

  const rememberMe = localStorage.getItem("rememberMe") === "true"

  if (rememberMe) {
    // Absolute expiry check
    const expiry = localStorage.getItem("sessionExpiry")
    if (!expiry) return true
    return new Date().getTime() > parseInt(expiry)
  } else {
    // Inactivity check
    const lastActivity = localStorage.getItem("lastActivity")
    if (!lastActivity) return true
    return new Date().getTime() - parseInt(lastActivity) > SESSION_DURATION
  }
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
  localStorage.removeItem("sessionExpiry")
}
