import { useEffect } from "react";
import Atmosphere from "./components/Atmosphere";
import { Cursor, StickyCta } from "./components/Chrome";
import Events from "./components/Events";
import Footer from "./components/Footer";
import Gallery from "./components/Gallery";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Kitchen from "./components/Kitchen";
import Marchio from "./components/Marchio";
import Menu from "./components/Menu";
import { CartBar, Pickup } from "./components/Order";
import Reservation from "./components/Reservation";
import Story from "./components/Story";
import { useI18n } from "./i18n";
import { initSmoothScroll, ScrollTrigger, scrollToHash } from "./lib/motion";

export default function App() {
  const { t, lang } = useI18n();

  // browser tab title in the chosen language
  useEffect(() => {
    document.title = t("Casa Ducale – Italienisches Restaurant & Café in Leverkusen-Wiesdorf");
  }, [t, lang]);
  useEffect(() => {
    initSmoothScroll();
    // late-loading fonts and images change layout: recalc pinned sections
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    // deep links like /#reservieren
    if (location.hash.length > 1) setTimeout(() => scrollToHash(location.hash), 400);
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        {t("Zum Inhalt springen")}
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Story />
        <Marchio />
        <Kitchen />
        <Pickup />
        <Menu />
        <Atmosphere />
        <Events />
        <Gallery />
        <Reservation />
      </main>
      <Footer />
      <StickyCta />
      <CartBar />
      <Cursor />
    </>
  );
}
