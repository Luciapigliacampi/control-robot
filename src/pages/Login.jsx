import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { LogOut, User, Shield } from "lucide-react";
import ErrorPage from "./ErrorPage";
import { loginUser, signupUser } from "../services/api";


function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

export default function App() {
    const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();
    const error = getQueryParam("error");
    useEffect(() => {
  const syncUserWithDB = async () => {
    if (!user || !isAuthenticated) return;

    try {
      const res = await loginUser({ email: user.email });
      console.log("✅ Usuario encontrado en DB:", res.user);
      // Aquí permites acceso
    } catch (err) {
      console.warn("⚠️ Usuario no registrado en DB:", err.message);
      // Bloquear acceso: redirigir o mostrar error
      window.location.href = "/not-registered";
    }
  };

  syncUserWithDB();
}, [user, isAuthenticated]);



    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
            </div>
        );
    }

    if (error === "access_denied") {
        return <ErrorPage />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                {!isAuthenticated ? (
                    <div className="text-center">
                        <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-10 h-10 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido</h1>
                        <p className="text-gray-600 mb-8">Inicia sesión para continuar</p>
                        <button
                            onClick={() => loginWithRedirect()}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Iniciar Sesión con Auth0
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                            {user?.picture ? (
                                <img src={user.picture} alt={user.name} className="w-20 h-20 rounded-full" />
                            ) : (
                                <User className="w-10 h-10 text-green-600" />
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Hola, {user?.name}!</h1>
                        <p className="text-gray-600 mb-2">{user?.email}</p>
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <h3 className="font-semibold text-gray-700 mb-2">Información del usuario:</h3>
                            <p className="text-sm text-gray-600 break-all">
                                <strong>ID:</strong> {user?.sub}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                <strong>Email verificado:</strong> {user?.email_verified ? "Sí" : "No"}
                            </p>
                        </div>
                        <button
                            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                            className="w-full bg-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <LogOut className="w-5 h-5" />
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}