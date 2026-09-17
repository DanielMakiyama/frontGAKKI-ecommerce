import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, MapPin, UserRound } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatarCep, formatarCpf, somenteDigitos } from "../utils/formatos";
import {
  GENEROS,
  TIPOS_LOGRADOURO,
  TIPOS_RESIDENCIA,
  TIPOS_TELEFONE,
} from "../utils/constantes";

const DADOS_VAZIOS = {
  nome: "",
  email: "",
  cpf: "",
  genero: "",
  dataNascimento: "",
  telefoneTipo: "CELULAR",
  telefoneDdd: "",
  telefoneNumero: "",
  senha: "",
  confirmacaoSenha: "",
};

const ENDERECO_VAZIO = {
  apelido: "Casa",
  tipoResidencia: "CASA",
  tipoLogradouro: "RUA",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cep: "",
  cidade: "",
  estado: "",
  pais: "Brasil",
  observacoes: "",
};

const CARTAO_VAZIO = {
  apelido: "Meu cartão",
  ultimosDigitos: "",
  bandeiraId: "",
  nomeTitular: "",
  validadeMes: "",
  validadeAno: "",
};

const ANO_ATUAL = new Date().getFullYear();
const ANOS_VALIDADE = Array.from({ length: 16 }, (_, i) => ANO_ATUAL + i);

/**
 * Registrar — cadastro de cliente (RF0021).
 *
 * Os campos seguem a RN0026 (gênero, nome, data de nascimento, CPF,
 * telefone composto de tipo/DDD/número, e-mail e senha) e a RN0023 no
 * endereço (tipo de residência, tipo de logradouro, bairro e país, além
 * do resto).
 *
 * O endereço vai no MESMO payload, e não numa segunda chamada. A RN0022
 * exige que todo cliente tenha endereço de entrega: se fossem duas
 * requisições, uma falha na segunda deixaria no banco exatamente o que a
 * regra proíbe. O backend grava os dois na mesma transação.
 *
 * O cartão segue junto, porém é OPCIONAL — nenhuma regra condiciona a
 * existência do cliente a possuir cartão.
 */
export default function Registrar() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [dados, setDados] = useState(DADOS_VAZIOS);
  const [endereco, setEndereco] = useState(ENDERECO_VAZIO);
  const [querCartao, setQuerCartao] = useState(false);
  const [cartao, setCartao] = useState(CARTAO_VAZIO);
  const [bandeiras, setBandeiras] = useState([]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // RN0025 — a lista vem do cadastro do sistema, não de uma constante na
  // tela. Assim uma bandeira desativada no backend some daqui sozinha.
  useEffect(() => {
    api.listarBandeiras()
      .then(setBandeiras)
      .catch(() => setBandeiras([]));
  }, []);

  const setDado = (campo, transformar) => (e) =>
    setDados((f) => ({ ...f, [campo]: transformar ? transformar(e.target.value) : e.target.value }));

  const setEnd = (campo, transformar) => (e) =>
    setEndereco((f) => ({ ...f, [campo]: transformar ? transformar(e.target.value) : e.target.value }));

  const setCartaoCampo = (campo, transformar) => (e) =>
    setCartao((f) => ({ ...f, [campo]: transformar ? transformar(e.target.value) : e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    // Checagem no cliente antes de sair da tela: erro de digitação não
    // precisa de ida e volta ao servidor para virar mensagem. O backend
    // confere de novo (RNF0032) — esta aqui é conveniência, não garantia.
    if (dados.senha !== dados.confirmacaoSenha) {
      setErro("A confirmação de senha não confere.");
      return;
    }

    setEnviando(true);
    try {
      await api.registrar({
        nome: dados.nome,
        email: dados.email,
        // Máscaras são da tela; o banco guarda só dígitos.
        cpf: somenteDigitos(dados.cpf),
        genero: dados.genero,
        dataNascimento: dados.dataNascimento,
        telefone: {
          tipo: dados.telefoneTipo,
          ddd: somenteDigitos(dados.telefoneDdd),
          numero: somenteDigitos(dados.telefoneNumero),
        },
        senha: dados.senha,
        confirmacaoSenha: dados.confirmacaoSenha,
        endereco: {
          ...endereco,
          cep: somenteDigitos(endereco.cep),
          complemento: endereco.complemento || null,
          observacoes: endereco.observacoes || null,
          // O backend marca o endereço do cadastro como entrega e
          // cobrança (RN0021 + RN0022); estes valores são só o contrato.
          entrega: true,
          cobranca: true,
        },
        // `undefined` quando a opção está desmarcada — o backend
        // distingue "não quis cadastrar" de "mandou um cartão vazio".
        cartao: querCartao
          ? {
              ...cartao,
              bandeiraId: Number(cartao.bandeiraId),
              validadeMes: Number(cartao.validadeMes),
              validadeAno: Number(cartao.validadeAno),
            }
          : undefined,
      });

      // Entra direto com a conta recém-criada: a tela de login só
      // oferece os perfis de demonstração.
      const sessao = await api.login(dados.email, dados.senha);
      login(sessao.nome, sessao.perfil, sessao.token);
      navigate("/catalogo");
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="container container-estreito">
      <div className="pagina-titulo">
        <h1>Criar conta</h1>
        <p>Cadastre-se para comprar na GAKKI STORE.</p>
      </div>

      <form className="card card-pad" onSubmit={handleSubmit} data-testid="form-cadastro">
        {erro && <div className="erro-form" role="alert" data-testid="erro-cadastro">{erro}</div>}

        <fieldset className="grupo-campos">
          <legend><UserRound size={17} strokeWidth={1.9} /> Seus dados</legend>

          <div className="campo">
            <label htmlFor="cad-nome">Nome completo</label>
            <input id="cad-nome" required maxLength={150} value={dados.nome} onChange={setDado("nome")} />
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 2 }}>
              <label htmlFor="cad-email">E-mail</label>
              <input id="cad-email" type="email" required value={dados.email} onChange={setDado("email")} />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-cpf">CPF</label>
              <input
                id="cad-cpf" required inputMode="numeric" placeholder="000.000.000-00"
                value={dados.cpf} onChange={setDado("cpf", formatarCpf)}
              />
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-genero">Gênero</label>
              <select id="cad-genero" required value={dados.genero} onChange={setDado("genero")}>
                <option value="">Selecione…</option>
                {GENEROS.map((g) => <option key={g.valor} value={g.valor}>{g.rotulo}</option>)}
              </select>
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-nascimento">Data de nascimento</label>
              <input
                id="cad-nascimento" type="date" required
                value={dados.dataNascimento} onChange={setDado("dataNascimento")}
              />
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-tel-tipo">Tipo de telefone</label>
              <select id="cad-tel-tipo" required value={dados.telefoneTipo} onChange={setDado("telefoneTipo")}>
                {TIPOS_TELEFONE.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
              </select>
            </div>
            <div className="campo" style={{ flex: "0 0 5rem" }}>
              <label htmlFor="cad-tel-ddd">DDD</label>
              <input
                id="cad-tel-ddd" required inputMode="numeric" maxLength={2} placeholder="11"
                value={dados.telefoneDdd} onChange={setDado("telefoneDdd", somenteDigitos)}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-tel-numero">Número</label>
              <input
                id="cad-tel-numero" required inputMode="numeric" maxLength={9} placeholder="988887777"
                value={dados.telefoneNumero} onChange={setDado("telefoneNumero", somenteDigitos)}
              />
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-senha">Senha</label>
              <input id="cad-senha" type="password" required minLength={8} value={dados.senha} onChange={setDado("senha")} />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-senha2">Confirmar senha</label>
              <input id="cad-senha2" type="password" required value={dados.confirmacaoSenha} onChange={setDado("confirmacaoSenha")} />
            </div>
          </div>
          <p className="passo-ajuda">
            Mínimo de 8 caracteres, com letra maiúscula, minúscula e caractere especial.
          </p>
        </fieldset>

        <fieldset className="grupo-campos">
          <legend><MapPin size={17} strokeWidth={1.9} /> Endereço</legend>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-apelido">Apelido do endereço</label>
              <input
                id="cad-apelido" required maxLength={40} placeholder="ex.: Casa, Trabalho"
                value={endereco.apelido} onChange={setEnd("apelido")}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-tipo-residencia">Tipo de residência</label>
              <select id="cad-tipo-residencia" required value={endereco.tipoResidencia} onChange={setEnd("tipoResidencia")}>
                {TIPOS_RESIDENCIA.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
              </select>
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-tipo-logradouro">Tipo de logradouro</label>
              <select id="cad-tipo-logradouro" required value={endereco.tipoLogradouro} onChange={setEnd("tipoLogradouro")}>
                {TIPOS_LOGRADOURO.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
              </select>
            </div>
            <div className="campo" style={{ flex: 2 }}>
              <label htmlFor="cad-logradouro">Logradouro</label>
              <input id="cad-logradouro" required maxLength={150} value={endereco.logradouro} onChange={setEnd("logradouro")} />
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-numero">Número</label>
              <input id="cad-numero" required maxLength={10} value={endereco.numero} onChange={setEnd("numero")} />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-complemento">Complemento</label>
              <input id="cad-complemento" maxLength={60} placeholder="opcional" value={endereco.complemento} onChange={setEnd("complemento")} />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-bairro">Bairro</label>
              <input id="cad-bairro" required maxLength={80} value={endereco.bairro} onChange={setEnd("bairro")} />
            </div>
          </div>

          <div className="linha-campos">
            <div className="campo" style={{ flex: 2 }}>
              <label htmlFor="cad-cidade">Cidade</label>
              <input id="cad-cidade" required maxLength={80} value={endereco.cidade} onChange={setEnd("cidade")} />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-uf">UF</label>
              <input
                id="cad-uf" required maxLength={2} pattern="[A-Za-z]{2}" title="Duas letras, ex.: SP"
                value={endereco.estado} onChange={setEnd("estado", (v) => v.toUpperCase())}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-cep">CEP</label>
              <input
                id="cad-cep" required inputMode="numeric" placeholder="00000-000"
                pattern="[0-9]{5}-[0-9]{3}" title="Formato 00000-000"
                value={endereco.cep} onChange={setEnd("cep", formatarCep)}
              />
            </div>
            <div className="campo" style={{ flex: 1 }}>
              <label htmlFor="cad-pais">País</label>
              <input id="cad-pais" required maxLength={60} value={endereco.pais} onChange={setEnd("pais")} />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="cad-observacoes">Observações</label>
            <input
              id="cad-observacoes" maxLength={255} placeholder="opcional — ex.: entregar na portaria"
              value={endereco.observacoes} onChange={setEnd("observacoes")}
            />
          </div>

          <p className="passo-ajuda">
            Este endereço será usado para entrega e cobrança, e ficará como principal.
            Você pode cadastrar outros depois, no seu perfil.
          </p>
        </fieldset>

        <fieldset className="grupo-campos">
          <legend><CreditCard size={17} strokeWidth={1.9} /> Cartão de crédito</legend>

          <label className="filtro-checkbox">
            <input
              id="cad-quer-cartao"
              type="checkbox"
              checked={querCartao}
              onChange={(e) => setQuerCartao(e.target.checked)}
            />
            <span>Quero cadastrar um cartão agora (opcional)</span>
          </label>

          {querCartao && (
            <div style={{ marginTop: "1rem" }}>
              <div className="linha-campos">
                <div className="campo" style={{ flex: 2 }}>
                  <label htmlFor="cad-cartao-apelido">Apelido do cartão</label>
                  <input
                    id="cad-cartao-apelido" required maxLength={40} placeholder="ex.: Cartão principal"
                    value={cartao.apelido} onChange={setCartaoCampo("apelido")}
                  />
                </div>
                <div className="campo" style={{ flex: 1 }}>
                  <label htmlFor="cad-cartao-digitos">Últimos 4 dígitos</label>
                  <input
                    id="cad-cartao-digitos" required inputMode="numeric" maxLength={4}
                    value={cartao.ultimosDigitos}
                    onChange={setCartaoCampo("ultimosDigitos", somenteDigitos)}
                  />
                </div>
              </div>

              <div className="linha-campos">
                <div className="campo" style={{ flex: 1 }}>
                  <label htmlFor="cad-cartao-bandeira">Bandeira</label>
                  <select
                    id="cad-cartao-bandeira" required
                    value={cartao.bandeiraId} onChange={setCartaoCampo("bandeiraId")}
                  >
                    <option value="">Selecione…</option>
                    {bandeiras.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </div>
                <div className="campo" style={{ flex: 1 }}>
                  <label htmlFor="cad-cartao-mes">Mês de validade</label>
                  <select id="cad-cartao-mes" required value={cartao.validadeMes} onChange={setCartaoCampo("validadeMes")}>
                    <option value="">Mês</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                    ))}
                  </select>
                </div>
                <div className="campo" style={{ flex: 1 }}>
                  <label htmlFor="cad-cartao-ano">Ano de validade</label>
                  <select id="cad-cartao-ano" required value={cartao.validadeAno} onChange={setCartaoCampo("validadeAno")}>
                    <option value="">Ano</option>
                    {ANOS_VALIDADE.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="campo">
                <label htmlFor="cad-cartao-titular">Nome impresso no cartão</label>
                <input
                  id="cad-cartao-titular" required maxLength={100}
                  value={cartao.nomeTitular}
                  onChange={setCartaoCampo("nomeTitular", (v) => v.toUpperCase())}
                />
              </div>

              <p className="passo-ajuda">
                Guardamos apenas os quatro últimos dígitos — o número completo e o
                código de segurança nunca são armazenados.
              </p>
            </div>
          )}
        </fieldset>

        <button type="submit" className="btn btn-primario btn-block" disabled={enviando} data-testid="btn-criar-conta">
          {enviando ? "Criando…" : "Criar conta"}
        </button>

        <p className="rodape-login">
          Só quer dar uma olhada? <Link to="/login">Usar um perfil de demonstração</Link>
        </p>
      </form>
    </div>
  );
}
