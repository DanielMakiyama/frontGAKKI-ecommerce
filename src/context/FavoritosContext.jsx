import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * FavoritosContext — lista de desejos do visitante.
 *
 * Diferente do carrinho, favoritar não exige login e não existe no
 * backend: é uma preferência do navegador. Por isso mora em
 * localStorage, e não em uma chamada de API.
 *
 * O estado é uma lista de IDs (`[1, 7, 8]`), não os objetos dos
 * produtos. Guardar só o ID evita que preço ou estoque salvos hoje
 * fiquem desatualizados amanhã — quem exibe o produto sempre busca os
 * dados frescos na API.
 */

const CHAVE_STORAGE = "gakki_favoritos";
const FavoritosContext = createContext(null);

/** Leitura tolerante: navegação anônima ou JSON corrompido não podem
 *  derrubar o app inteiro na primeira renderização. */
function lerDoStorage() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function FavoritosProvider({ children }) {
  // Função como valor inicial (`useState(lerDoStorage)`, sem parênteses):
  // o localStorage é lido uma única vez, na montagem, e não a cada render.
  const [favoritos, setFavoritos] = useState(lerDoStorage);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(favoritos));
    } catch {
      /* cota cheia ou storage bloqueado: o app segue, só não persiste */
    }
  }, [favoritos]);

  const alternar = useCallback((id) => {
    setFavoritos((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
    );
  }, []);

  const ehFavorito = useCallback((id) => favoritos.includes(id), [favoritos]);

  // useMemo aqui evita que TODO consumidor do contexto re-renderize a
  // cada render do provider por causa de um objeto novo.
  const valor = useMemo(
    () => ({ favoritos, alternar, ehFavorito, total: favoritos.length }),
    [favoritos, alternar, ehFavorito]
  );

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos() {
  const contexto = useContext(FavoritosContext);
  if (!contexto) throw new Error("useFavoritos precisa estar dentro de <FavoritosProvider>");
  return contexto;
}
