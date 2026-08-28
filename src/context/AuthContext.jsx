import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const nome = localStorage.getItem("gakki_nome");
    const perfil = localStorage.getItem("gakki_perfil");
    const token = localStorage.getItem("gakki_token");
    return token ? { nome, perfil, token } : null;
  });

  function login(nome, perfil, token) {
    localStorage.setItem("gakki_token", token);
    localStorage.setItem("gakki_nome", nome);
    localStorage.setItem("gakki_perfil", perfil);
    setUsuario({ nome, perfil, token });
  }

  function logout() {
    localStorage.removeItem("gakki_token");
    localStorage.removeItem("gakki_nome");
    localStorage.removeItem("gakki_perfil");
    setUsuario(null);
  }

  const isAdmin = usuario?.perfil === "ADMINISTRADOR" || usuario?.perfil === "GERENTE_VENDAS";

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
