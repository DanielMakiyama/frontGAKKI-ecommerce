import { createContext, useCallback, useContext, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { usuario } = useAuth();
  const [carrinho, setCarrinho] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const recarregar = useCallback(async () => {
    if (!usuario) return setCarrinho(null);
    setCarregando(true);
    try {
      const data = await api.verCarrinho();
      setCarrinho(data);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  const adicionar = useCallback(async (instrumentoId, quantidade = 1) => {
    const data = await api.adicionarAoCarrinho(instrumentoId, quantidade);
    setCarrinho(data);
    return data;
  }, []);

  const atualizarQuantidade = useCallback(async (itemId, quantidade) => {
    const data = await api.atualizarQuantidadeCarrinho(itemId, quantidade);
    setCarrinho(data);
  }, []);

  const remover = useCallback(async (itemId) => {
    await api.removerDoCarrinho(itemId);
    await recarregar();
  }, [recarregar]);

  /*
   * RNF0042 — itens retirados do carrinho pela expiração do prazo (RN0045).
   *
   * As três rotas devolvem o carrinho já recalculado, então basta guardar
   * a resposta: não há um segundo GET, e com ele a janela em que a tela
   * mostraria um estado e o servidor já teria outro.
   */
  const restaurarRetirado = useCallback(async (itemRetiradoId) => {
    setCarrinho(await api.restaurarItemRetirado(itemRetiradoId));
  }, []);

  const descartarRetirado = useCallback(async (itemRetiradoId) => {
    setCarrinho(await api.descartarItemRetirado(itemRetiradoId));
  }, []);

  const descartarRetirados = useCallback(async () => {
    setCarrinho(await api.descartarItensRetirados());
  }, []);

  const totalItens = carrinho?.itens?.reduce((acc, i) => acc + i.quantidade, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        carrinho,
        carregando,
        recarregar,
        adicionar,
        atualizarQuantidade,
        remover,
        restaurarRetirado,
        descartarRetirado,
        descartarRetirados,
        totalItens,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
