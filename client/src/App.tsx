import { AuthProvider, PermissionProvider } from './context';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <AuthProvider>
        <PermissionProvider>
          <AppRoutes />
        </PermissionProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
