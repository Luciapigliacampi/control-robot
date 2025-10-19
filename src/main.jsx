// src/main.jsx (versión con Auth0 activa)
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// Importación de Auth0Provider
import { Auth0Provider } from "@auth0/auth0-react"; 
import App from "./App.jsx";
import "./ui.css";

// 1. Obtener variables de entorno (Auth0)
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;

ReactDOM.createRoot(document.getElementById("root")).render(
 <React.StrictMode>
    {/* 2. Envolver la aplicación con Auth0Provider */}
  <Auth0Provider
    domain={domain}
   clientId={clientId}
   authorizationParams={{
    redirect_uri: redirectUri
   }}
  >
      {/* 3. BrowserRouter debe estar DENTRO del Auth0Provider */}
   <BrowserRouter>
    <App />
   </BrowserRouter>
  </Auth0Provider>
 </React.StrictMode>
);
