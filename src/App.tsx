import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Categories from "./components/Categories";
import WhyRialto from "./components/WhyRialto";
import Reviews from "./components/Reviews";
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
        <Categories />
        <WhyRialto />
        <Reviews />
        <OrderSection />
        <Location />
      </main>
      <Footer />
      <MobileActionBar />
    </>
  );
}
