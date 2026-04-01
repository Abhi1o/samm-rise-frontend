import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import initProductionConsole from "./utils/consoleArt";

// Initialize production console (ASCII art, security warnings, contact info)
initProductionConsole();

createRoot(document.getElementById("root")!).render(<App />);
