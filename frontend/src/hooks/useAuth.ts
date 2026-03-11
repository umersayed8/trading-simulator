import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { login, register, logout, fetchUser, clearError, completeOnboarding } from '../store/slices/authSlice';
import { useCallback, useEffect } from 'react';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchUser());
    }
  }, [isAuthenticated, user, dispatch]);

  const handleLogin = useCallback(
    (email: string, password: string) => {
      return dispatch(login({ email, password }));
    },
    [dispatch]
  );

  const handleRegister = useCallback(
    (email: string, password: string, username: string, age: number) => {
      return dispatch(register({ email, password, username, age }));
    },
    [dispatch]
  );

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleCompleteOnboarding = useCallback(() => {
    return dispatch(completeOnboarding());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError: handleClearError,
    completeOnboarding: handleCompleteOnboarding,
  };
}
