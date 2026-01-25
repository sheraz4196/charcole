export const USER_ROLES = ["user", "admin"] as const;

export const AUTH_PROVIDERS = ["credentials"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];
