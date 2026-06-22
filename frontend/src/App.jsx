import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queries/queryClient.js';
import { AuthProvider } from './store/AuthContext.jsx';
import { AppRouter } from './router/AppRouter.jsx';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}
