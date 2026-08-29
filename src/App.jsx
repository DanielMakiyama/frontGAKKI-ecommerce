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
          <Route path="/catalogo" element={<RotaProtegida permitirVisitante exigirCliente><Catalogo /></RotaProtegida>} />
          <Route path="/produtos/:id" element={<RotaProtegida permitirVisitante exigirCliente><ProdutoDetalhe /></RotaProtegida>} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Registrar />} />
          <Route path="/carrinho" element={<RotaProtegida exigirCliente><Carrinho /></RotaProtegida>} />
          <Route path="/checkout" element={<RotaProtegida exigirCliente><Checkout /></RotaProtegida>} />
          <Route path="/pedidos" element={<RotaProtegida exigirCliente><Pedidos /></RotaProtegida>} />
          <Route path="/cupons" element={<RotaProtegida exigirCliente><Cupons /></RotaProtegida>} />
          <Route path="/trocas" element={<RotaProtegida exigirCliente><Trocas /></RotaProtegida>} />
          <Route path="/perfil" element={<RotaProtegida exigirCliente><Perfil /></RotaProtegida>} />
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
