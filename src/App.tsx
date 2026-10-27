import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Highlights from "./components/Highlights";
import Menu from "./components/Menu";
import WhyRialto from "./components/WhyRialto";
import Reviews from "./components/Reviews";
import Gallery from "./components/Gallery";
import OrderSection from "./components/OrderSection";
import Location from "./components/Location";
import Footer from "./components/Footer";
import MobileActionBar from "./components/MobileActionBar";
import { useReveal } from "./hooks/useReveal";

export default function App() {
  useReveal();

  return (
    <>
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Marquee />
        <Highlights />
        <Menu />
        <WhyRialto />
        <Reviews />
        <Gallery />
        <OrderSection />
        <Location />
      </main>
      <Footer />
      <MobileActionBar />
    </>
  );
}
