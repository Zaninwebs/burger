import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import MenuApp from "./MenuApp";

export function render(page: "home" | "speisekarte" = "home") {
  return renderToString(<StrictMode>{page === "speisekarte" ? <MenuApp /> : <App />}</StrictMode>);
}
