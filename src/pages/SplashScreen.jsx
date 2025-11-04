import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/splash.css";
import logo from "../assets/logo-chubb.png";

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login"); // redirige al login
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <img src={logo} alt="Chubb Logo" className="splash-logo" />
    </div>
  );
}

export default SplashScreen;
