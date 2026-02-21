const SESSION_DURATION = 20 * 60 * 1000 // 20 minutes in milliseconds
<<<<<<< HEAD

export const storeSession = (token: string) => {
  const currentTime = new Date().getTime()
  localStorage.setItem("authToken", token)
  localStorage.setItem("lastActivity", currentTime.toString())
=======
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
}

export const updateLastActivity = () => {
  const currentTime = new Date().getTime()
  localStorage.setItem("lastActivity", currentTime.toString())
}

export const isSessionExpired = () => {
  const token = localStorage.getItem("authToken")
  const lastActivity = localStorage.getItem("lastActivity")
<<<<<<< HEAD
=======
  const rememberMe = localStorage.getItem("rememberMe") === "true"
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

  if (!token || !lastActivity) return true

  const currentTime = new Date().getTime()
  const inactiveTime = currentTime - Number.parseInt(lastActivity)

<<<<<<< HEAD
  return inactiveTime > SESSION_DURATION
=======
  const duration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION

  return inactiveTime > duration
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
<<<<<<< HEAD
=======
  localStorage.removeItem("rememberMe")
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
}

