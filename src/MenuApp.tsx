import Navbar from "./components/Navbar";
import Menu from "./components/Menu";
import Footer from "./components/Footer";
import MobileActionBar from "./components/MobileActionBar";
import { useReveal } from "./hooks/useReveal";

/** The /speisekarte/ page: the full menu on its own, so the home page stays simple. */
export default function MenuApp() {
  useReveal();

  return (
    <>
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      <Navbar />
      <main id="main" className="menu-page">
        <Menu />
      </main>
      <Footer />
      <MobileActionBar />
    </>
  );
}
