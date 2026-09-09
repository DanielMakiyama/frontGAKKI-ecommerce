import logo from "/logo-gakki.png";

/**
 * LogoGakki — símbolo da marca.
 *
 * Passou a ser uma imagem (`public/logo-gakki.png`) no lugar do SVG
 * desenhado à mão. Quem consome o componente não precisa saber disso: a
 * API continua a mesma (`size`, `className`, `titulo`), então Header e
 * qualquer outro ponto seguem funcionando sem alteração.
 *
 * Duas diferenças práticas em relação ao SVG anterior:
 *
 *   • a cor é fixa — não acompanha mais `currentColor` nem
 *     `--cor-primaria`. Sobre fundo escuro, a arte se mantém como é;
 *   • é raster. O arquivo está em 256px, então aguenta até 128px de
 *     exibição em tela retina. Para usar bem maior, exporte um PNG
 *     maior (ou um SVG) e troque só este arquivo.
 *
 * `titulo` continua controlando a acessibilidade: sem ele a imagem é
 * decorativa (`alt=""`), porque a palavra "GAKKI store" já aparece ao
 * lado no header e um alt aqui seria leitura duplicada.
 */
export default function LogoGakki({ size = 34, className = "", titulo }) {
  return (
    <img
      src={logo}
      className={className}
      width={size}
      height={size}
      alt={titulo || ""}
      aria-hidden={titulo ? undefined : true}
      draggable={false}
      // Sem lazy: o logo aparece na primeira dobra de todas as páginas.
      decoding="async"
    />
  );
}
