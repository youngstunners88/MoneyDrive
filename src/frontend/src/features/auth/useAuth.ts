import { useInternetIdentity } from "../../hooks/useInternetIdentity";

export function useAuth() {
  const { identity, isInitializing, login, clear, isLoggingIn, loginStatus } =
    useInternetIdentity();

  return {
    identity,
    isInitializing,
    isAuthenticated: !!identity,
    login,
    logout: clear,
    isLoggingIn,
    loginStatus,
  };
}
