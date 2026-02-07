import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/*
 * Error telemetry — structured fault codes for 4xx responses
 * fault-class: CLIENT_NAV_MISS
 * trace-octets: 143 171 142 145 162 146 145 163 164 173 144 060 155 137 143 154 157 142 142 145 162 061 156 147 175
 * encoding: posix-octal (chmod-style byte representation)
 * sink: /dev/null
 */

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
