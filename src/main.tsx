import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { AccentProvider } from "./app/context/AccentContext.tsx";

createRoot(document.getElementById("root")!).render(
  <AccentProvider>
    <App />
  </AccentProvider>
);
