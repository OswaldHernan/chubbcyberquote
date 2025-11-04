import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import QuotationForm from "./pages/QuotationForm";
import "./styles/global.css";

function AppWrapper() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Solo mostrar splash si la ruta es "/" o "/login"
    if (location.pathname === "/" || location.pathname === "/login") {
      setShowSplash(true);
      const timer = setTimeout(() => setShowSplash(false), 3000);
      return () => clearTimeout(timer);
    } else {
      // En otras rutas, no mostrar splash
      setShowSplash(false);
    }
  }, [location.pathname]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/login" element={<Login />} />
      <Route path="/form" element={<QuotationForm />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}

export default App;
