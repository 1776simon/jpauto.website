import { Show, createEffect } from 'solid-js';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute(props) {
  const { user, loading } = useAuth();

  // Redirect to login if not authenticated
  createEffect(() => {
    if (!loading() && !user()) {
      window.location.href = '/login';
    }
  });

  return (
    <Show
      when={!loading()}
      fallback={
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <div class="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p class="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <Show when={user()}>
        {props.children}
      </Show>
    </Show>
  );
}
