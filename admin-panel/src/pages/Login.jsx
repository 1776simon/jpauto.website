import { createEffect } from 'solid-js';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { user, login } = useAuth();

  // Redirect if already logged in
  createEffect(() => {
    if (user()) {
      window.location.href = '/dashboard';
    }
  });

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="card-elevated w-full max-w-md p-8">
        {/* Logo/Header */}
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">JP Auto</h1>
          <p class="text-gray-600">Admin Panel</p>
        </div>

        {/* Login Card */}
        <div class="space-y-6">
          <div class="text-center">
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
            <p class="text-sm text-gray-600">Sign in to access the admin dashboard</p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={login}
            class="btn-filled w-full flex items-center justify-center gap-3"
          >
            <svg class="w-3 h-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          {/* Info Text */}
          <p class="text-xs text-center text-gray-500">
            Only authorized JP Auto administrators can access this panel
          </p>
        </div>
      </div>
    </div>
  );
}
