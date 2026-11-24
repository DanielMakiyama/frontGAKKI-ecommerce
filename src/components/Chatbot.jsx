import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, RotateCcw, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const SAUDACAO =
  "Olá! Sou o assistente da GAKKI STORE. Posso recomendar instrumentos pelo seu perfil, ajudar a encontrar um produto ou tirar dúvidas.";

const SUGESTOES = [
  "Me recomende um produto",
  "Quero ajuda para encontrar um instrumento",
  "Qual a diferença entre violão de nylon e de aço?",
];

// RNF0044 — chatbot de recomendação, só para o cliente (critério a).
// Cada resposta pode ser avaliada como útil ou não útil (critério d).
export default function Chatbot() {
  const { usuario, isAdmin } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [conversaId, setConversaId] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const fimRef = useRef(null);

  // Carrega a conversa em andamento na primeira vez que o chat é aberto.
  useEffect(() => {
    if (!aberto || carregado) return;
    setCarregado(true);
    api.conversaAtual()
      .then(async (conversa) => {
        if (!conversa) return;
        setConversaId(conversa.id);
        const pagina = await api.mensagensDaConversa(conversa.id);
        setMensagens([...(pagina.content ?? [])].reverse());
      })
      .catch((e) => setErro(e.message));
  }, [aberto, carregado]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, enviando]);

  // Sai do usuário que trocou de conta sem recarregar a página.
  useEffect(() => {
    setCarregado(false);
    setConversaId(null);
    setMensagens([]);
  }, [usuario?.token]);

  if (!usuario || isAdmin) return null;

  async function enviar(pergunta) {
    const conteudo = pergunta.trim();
    if (!conteudo || enviando) return;

    setErro("");
    setTexto("");
    setEnviando(true);
    const provisoria = { id: `tmp-${Date.now()}`, autor: "CLIENTE", texto: conteudo };
    setMensagens((m) => [...m, provisoria]);

    try {
      let id = conversaId;
      if (!id) {
        id = (await api.novaConversa()).id;
        setConversaId(id);
      }
      const r = await api.enviarMensagemChat(id, conteudo);
      setMensagens((m) => [
        ...m.filter((x) => x.id !== provisoria.id),
        r.pergunta,
        ...(r.resposta ? [r.resposta] : [{ id: `aviso-${Date.now()}`, autor: "AVISO", texto: r.aviso }]),
      ]);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function avaliar(mensagem, avaliacao) {
    setErro("");
    try {
      const atualizada = await api.avaliarResposta(mensagem.id, avaliacao);
      setMensagens((m) => m.map((x) => (x.id === atualizada.id ? atualizada : x)));
    } catch (e) {
      setErro(e.message);
    }
  }

  async function novaConversa() {
    if (enviando) return;
    setErro("");
    try {
      const conversa = await api.novaConversa();
      setConversaId(conversa.id);
      setMensagens([]);
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <>
      {aberto && (
        <div className="chat-janela card" data-testid="chat-janela">
          <div className="chat-cabecalho">
            <span>Assistente GAKKI</span>
            <div className="chat-acoes">
              <button type="button" onClick={novaConversa} title="Nova conversa" data-testid="chat-nova-conversa">
                <RotateCcw size={15} /> Nova
              </button>
              <button type="button" onClick={() => setAberto(false)} title="Fechar" aria-label="Fechar">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="chat-mensagens" data-testid="chat-mensagens">
            <div className="chat-msg bot">{SAUDACAO}</div>

            {mensagens.length === 0 && !enviando && (
              <div className="chat-sugestoes">
                {SUGESTOES.map((s) => (
                  <button key={s} type="button" onClick={() => enviar(s)}>{s}</button>
                ))}
              </div>
            )}

            {mensagens.map((m) => (
              <Mensagem key={m.id} mensagem={m} onAvaliar={avaliar} />
            ))}

            {enviando && (
              <div className="chat-digitando" data-testid="chat-digitando">
                O assistente está pensando… pode levar alguns segundos.
              </div>
            )}
            {erro && <div className="chat-msg aviso" role="alert">{erro}</div>}
            <div ref={fimRef} />
          </div>

          <form
            className="chat-input-row"
            onSubmit={(e) => { e.preventDefault(); enviar(texto); }}
          >
            <input
              placeholder="Escreva sua mensagem…"
              maxLength={1000}
              value={texto}
              disabled={enviando}
              onChange={(e) => setTexto(e.target.value)}
              data-testid="chat-input"
            />
            <button type="submit" disabled={enviando || !texto.trim()} data-testid="chat-enviar">Enviar</button>
          </form>
        </div>
      )}
      <button
        className="btn btn-primario chat-flutuante"
        onClick={() => setAberto((a) => !a)}
        data-testid="chat-abrir"
      >
        {aberto ? "Fechar" : <><MessageCircle size={17} /> Assistente</>}
      </button>
    </>
  );
}

function Mensagem({ mensagem, onAvaliar }) {
  if (mensagem.autor === "CLIENTE") {
    return <div className="chat-msg usuario">{mensagem.texto}</div>;
  }
  if (mensagem.autor === "AVISO") {
    return <div className="chat-msg aviso" data-testid="chat-aviso">{mensagem.texto}</div>;
  }

  // Mensagens provisórias (sem id numérico) não podem ser avaliadas.
  const avaliavel = typeof mensagem.id === "number";
  return (
    <div className="chat-msg bot" data-testid="chat-resposta" data-mensagem-id={mensagem.id}>
      {mensagem.texto}

      {mensagem.produtos?.length > 0 && (
        <div className="chat-produtos">
          {mensagem.produtos.map((p) => (
            <Link key={p.id} to={`/produtos/${p.id}`} className="chat-produto" data-testid="chat-produto">
              <span>{p.nome}</span>
              <strong>{Number(p.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
            </Link>
          ))}
        </div>
      )}

      {avaliavel && (
        <div className="chat-avaliacao">
          <span>Foi útil?</span>
          <button
            type="button"
            className={mensagem.avaliacao === "UTIL" ? "ativo" : ""}
            aria-pressed={mensagem.avaliacao === "UTIL"}
            onClick={() => onAvaliar(mensagem, "UTIL")}
            data-testid="chat-util"
          >
            <ThumbsUp size={13} /> Útil
          </button>
          <button
            type="button"
            className={mensagem.avaliacao === "NAO_UTIL" ? "ativo" : ""}
            aria-pressed={mensagem.avaliacao === "NAO_UTIL"}
            onClick={() => onAvaliar(mensagem, "NAO_UTIL")}
            data-testid="chat-nao-util"
          >
            <ThumbsDown size={13} /> Não útil
          </button>
        </div>
      )}
    </div>
  );
}
