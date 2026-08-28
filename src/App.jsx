import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Chatbot from "./components/Chatbot";
import RotaProtegida from "./components/RotaProtegida";

import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import ProdutoDetalhe from "./pages/ProdutoDetalhe";
import Login from "./pages/Login";
import Registrar from "./pages/Registrar";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import Pedidos from "./pages/Pedidos";
import Cupons from "./pages/Cupons";
import Trocas from "./pages/Trocas";
import Perfil from "./pages/Perfil";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/produtos/:id" element={<ProdutoDetalhe />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Registrar />} />
          <Route path="/carrinho" element={<RotaProtegida><Carrinho /></RotaProtegida>} />
          <Route path="/checkout" element={<RotaProtegida><Checkout /></RotaProtegida>} />
          <Route path="/pedidos" element={<RotaProtegida><Pedidos /></RotaProtegida>} />
          <Route path="/cupons" element={<RotaProtegida><Cupons /></RotaProtegida>} />
          <Route path="/trocas" element={<RotaProtegida><Trocas /></RotaProtegida>} />
          <Route path="/perfil" element={<RotaProtegida><Perfil /></RotaProtegida>} />
          <Route path="/admin" element={<RotaProtegida exigirAdmin><Admin /></RotaProtegida>} />
        </Routes>
      </main>
      <Chatbot />
      <footer className="footer-gakki">
        GAKKI STORE — Protótipo acadêmico (LES 2026) · Java + React + PostgreSQL + Selenium + TensorFlow
      </footer>
    </div>
  );
}
