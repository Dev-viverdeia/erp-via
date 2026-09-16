import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { aplicarNegocio } from "./config/negocio";
import "./index.css";

// O nome e as cores do negócio entram antes do primeiro quadro.
aplicarNegocio();
createRoot(document.getElementById("root")!).render(<App />);
