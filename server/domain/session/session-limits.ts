const DAY_IN_MS = 1000 * 60 * 60 * 24

// Session expires in 6 month
export const SESSION_EXPIRE_IN = 180 * DAY_IN_MS

// Session rotates each 30 days
export const SESSION_ROTATE_IN = SESSION_EXPIRE_IN - 30 * DAY_IN_MS
