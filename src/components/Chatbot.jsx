import { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

/**
 * Widget de chat flutuante, ligado ao chatbot com IA (TensorFlow) via
 * POST /api/recomendacoes/chat -> serviço Python (RNF0044-2).
 */
export default function Chatbot() {
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([
    { autor: "bot", texto: "Olá! Sou o assistente da GAKKI STORE. Posso ajudar a encontrar um instrumento ou tirar dúvidas sobre troca e pagamento." },
  ]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!usuario) return null;

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    const mensagemUsuario = texto.trim();
    setMensagens((m) => [...m, { autor: "usuario", texto: mensagemUsuario }]);
    setTexto("");
    setEnviando(true);
    try {
      const resp = await api.chat(mensagemUsuario);
      setMensagens((m) => [...m, { autor: "bot", texto: resp.resposta }]);
    } catch {
      setMensagens((m) => [...m, { autor: "bot", texto: "Desculpe, não consegui responder agora. Tente novamente em instantes." }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      {aberto && (
        <div className="chat-janela card">
          <div style={{ padding: ".7rem 1rem", borderBottom: "1px solid var(--cor-borda)", fontWeight: 700 }}>
            Assistente GAKKI 🎸
          </div>
          <div className="chat-mensagens">
            {mensagens.map((m, i) => (
              <div key={i} className={`chat-msg ${m.autor}`}>{m.texto}</div>
            ))}
            {enviando && <div className="chat-msg bot">digitando…</div>}
          </div>
          <form className="chat-input-row" onSubmit={enviar}>
            <input
              placeholder="Escreva sua mensagem…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button type="submit">Enviar</button>
          </form>
        </div>
      )}
      <button className="btn btn-primario chat-flutuante" onClick={() => setAberto((a) => !a)}>
        {aberto ? "Fechar" : "💬 Assistente"}
      </button>
    </>
  );
}
