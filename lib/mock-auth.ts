// This file provides a mock authentication service for development
// It allows operations that require authentication to work without real auth

export const MOCK_USER = {
  uid: "mock-user-123",
  email: "user@example.com",
  displayName: "Mock User",
  photoURL: null,
  emailVerified: true
};

export function getMockUser() {
  return MOCK_USER;
}

// Completely disable mock auth by default
export function isMockAuthEnabled() {
  return process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";
}