import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import bgCyber from "../assets/bg-cyber.png";

function Login() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const validateEmail = () => {
    const allowedDomain = import.meta.env.VITE_ALLOWED_DOMAIN?.toLowerCase().replace("@", "");
    const domain = email.split("@")[1]?.toLowerCase().trim();

    if (domain === allowedDomain) {
      navigate("/form");
    } else {
      alert("Access denied. Please use your corporate email.");
    }
  };

  return (
    <div className="login-container">
      {/* Lado izquierdo con fondo de ciberseguridad */}
      <div
        className="login-left"
        style={{ backgroundImage: `url(${bgCyber})` }}
      >
        <div className="overlay"></div>
      </div>

      {/* Lado derecho con fondo azul sólido */}
      <div className="login-right">
        <div className="login-form">
          <h1>Login</h1>
          <p>Please enter your corporate email</p>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={validateEmail}>Continue</button>
        </div>
      </div>
    </div>
  );
}

export default Login;
