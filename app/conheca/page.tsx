import Link from "next/link";
export default function Product() {
  return <main className="product">
    <section className="product-hero">
      <p className="eyebrow">Aprova · Revisão de trabalhos criativos</p>
      <h1>Menos “qual versão?”.<br /><span>Mais entregas aprovadas.</span></h1>
      <p className="muted">Compartilhe seu trabalho por um link. Receba um pedido de ajuste, envie a nova versão e registre a aprovação do arquivo certo.</p>
      <div className="delivery-actions"><Link className="primary-link" href="/demo">Experimentar a demo →</Link><Link className="text-action" href="/login">Entrar no painel</Link></div>
      <p className="file-help muted">Em desenvolvimento · demo com dados fictícios, sem cadastro.</p>
    </section>
    <section className="product-grid" aria-label="Como funciona">
      {[["01", "Envie", "Publique uma imagem e compartilhe o link de revisão."],
        ["02", "Refine", "Receba feedback por versão e preserve o histórico."],
        ["03", "Aprove", "Registre a aprovação vinculada à versão revisada."]].map(([number, title, copy]) =>
        <article className="panel" key={number}><p className="eyebrow">{number}</p><h2>{title}</h2><p className="muted">{copy}</p></article>)}
    </section>
    <section className="panel product-note"><h2>Uma conversa organizada em torno da entrega.</h2>
      <p className="muted">O freelancer gerencia versões e links. O cliente revisa sem precisar de uma conta. Arquivos ficam em armazenamento privado, e links podem ser revogados.</p>
      <p className="muted">Nesta etapa, o produto aceita imagens PNG, JPEG e WebP de até 3 MB.</p>
    </section>
  </main>;
}
