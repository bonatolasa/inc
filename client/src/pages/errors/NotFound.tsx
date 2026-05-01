import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.config';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-6xl font-extrabold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        to={ROUTES.HOME}
        className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
