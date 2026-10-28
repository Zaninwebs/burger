import { StrictMode, type ReactNode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import MenuApp from "./MenuApp";

const container = document.getElementById("root")!;
const page: ReactNode = container.dataset.page === "speisekarte" ? <MenuApp /> : <App />;
const app = <StrictMode>{page}</StrictMode>;

// The production build ships prerendered HTML (scripts/prerender.mjs) — hydrate it.
if (container.firstElementChild) hydrateRoot(container, app);
else createRoot(container).render(app);
