import { AuthProvider, PermissionProvider, ThemeProvider } from './context';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background font-sans text-foreground">
        <AuthProvider>
          <PermissionProvider>
            <AppRoutes />
          </PermissionProvider>
        </AuthProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
