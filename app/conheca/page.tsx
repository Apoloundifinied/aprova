import type { Metadata } from "next";
import Link from "next/link";
import { LandingMotion, ReviewShowcase } from "./landing-motion";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Aprova — Revisão de entregas criativas",
  description: "Envie sua criação, receba feedback por versão e registre a aprovação no mesmo link.",
  icons: { icon: "/aprova-mark.svg" },
};

function Brand() {
  return <Link href="/conheca" className={styles.brand} aria-label="Aprova, página inicial">
    {/* O SVG tem tamanho fixo e é compartilhado com o favicon. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/aprova-mark.svg" alt="" width="36" height="36" /> aprova<span>.</span>
  </Link>;
}

export default function Product() {
  return <LandingMotion>
    <nav className={styles.nav} aria-label="Navegação da apresentação">
      <Brand />
      <div className={styles.navLinks}><a href="#fluxo">Como funciona</a><a href="#recursos">Recursos</a></div>
      <Link href="/login" className={styles.login}>Entrar <span aria-hidden="true">↗</span></Link>
    </nav>

    <section className={styles.hero} aria-labelledby="landing-title">
      <div className={styles.heroCopy}>
        <p className={styles.kicker} data-intro><i /> Revisão de entregas criativas</p>
        <h1 id="landing-title" data-intro>Da criação<br />à <em>aprovação.</em></h1>
        <p className={styles.lead} data-intro>Envie seu trabalho, receba feedback e aprove a versão certa. Tudo no mesmo link.</p>
        <div className={styles.actions} data-intro>
          <Link className={styles.primary} href="/demo">Experimentar a demo <span aria-hidden="true">↗</span></Link>
          <a className={styles.secondary} href="#fluxo">Ver como funciona <span aria-hidden="true">↓</span></a>
        </div>
        <p className={styles.micro} data-intro>Sem cadastro para experimentar</p>
      </div>
      <ReviewShowcase />
    </section>

    <div className={styles.band} aria-label="Benefícios do Aprova">
      <span>01 / UM LINK</span><span>02 / FEEDBACK POR VERSÃO</span><span>03 / APROVAÇÃO REGISTRADA</span>
    </div>

    <section className={styles.workflow} id="fluxo" data-flow aria-labelledby="flow-title">
      <div className={styles.sectionHead} data-reveal>
        <p className={styles.kicker}>01 / O fluxo</p>
        <h2 id="flow-title">Um caminho claro<br />até o <em>sim.</em></h2>
        <p>Da primeira entrega à última revisão, cada decisão fica ligada à versão certa.</p>
      </div>
      <div className={styles.steps}>
        <div className={styles.track} aria-hidden="true"><div data-track /></div>
        {[
          ["01", "Envie a criação", "Publique a imagem e compartilhe o link com o cliente."],
          ["02", "Refine com contexto", "Receba o pedido de ajuste, publique a nova versão e preserve o histórico no mesmo link."],
          ["03", "Registre o sim", "O cliente aprova a versão atual. Você fica com a decisão registrada na entrega."],
        ].map(([n, title, copy]) => <article className={styles.step} data-reveal key={n}>
          <span>{n}</span><h3>{title}</h3><p>{copy}</p>
        </article>)}
      </div>
    </section>

    <section id="recursos" className={styles.features} aria-labelledby="features-title" data-reveal>
      <div className={styles.sectionHead}>
        <p className={styles.kicker}>02 / Feito para revisar</p>
        <h2 id="features-title">Simples para o cliente.<br /><em>Organizado para você.</em></h2>
      </div>
      <dl className={styles.featureList}>
        <div><dt>O cliente entra pelo link</dt><dd>Ele pode revisar e aprovar sem criar uma conta.</dd></div>
        <div><dt>As versões ficam juntas</dt><dd>Feedback e aprovação ficam vinculados à entrega correspondente.</dd></div>
        <div><dt>Você controla o acesso</dt><dd>Arquivos ficam privados e o link pode ser revogado pelo painel.</dd></div>
      </dl>
    </section>

    <section className={styles.finalCta} aria-labelledby="cta-title" data-reveal>
      <p className={styles.kicker}>03 / Experimente</p>
      <h2 id="cta-title">Pronto para o <em>sim?</em></h2>
      <p>Passe de cliente a freelancer em uma revisão fictícia e acompanhe a aprovação da V2.</p>
      <Link className={styles.primary} href="/demo">Abrir demo interativa <span aria-hidden="true">↗</span></Link>
    </section>
    <footer className={styles.footer}><Brand /><span>Revisão de entregas criativas</span></footer>
  </LandingMotion>;
}
