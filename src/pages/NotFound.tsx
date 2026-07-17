import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold font-heading text-primary">404</h1>
        <p className="text-xl text-muted-foreground">Pagina nao encontrada</p>
        <a href="/" className="inline-block text-primary font-medium hover:text-primary/80 transition-colors">
          Voltar ao inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
