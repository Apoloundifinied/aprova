"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./landing.module.css";

export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(root.current);

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const select = gsap.utils.selector(root);
      gsap.from(select("[data-intro]"), { y: 18, opacity: 0, duration: .68, stagger: .065, ease: "power3.out" });
      gsap.from(select("[data-stage]"), { y: 24, opacity: 0, scale: .97, duration: .9, ease: "power3.out" });
      select("[data-reveal]").forEach((section) => {
        if (section.getBoundingClientRect().top < window.innerHeight) return;
        gsap.from(section, {
          y: 22, opacity: 0, duration: .62, ease: "power2.out",
          scrollTrigger: { trigger: section, start: "top 90%", once: true },
        });
      });
      gsap.fromTo(select("[data-track]"), { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: select("[data-flow]")[0], start: "top 75%", end: "bottom 70%", scrub: .45 },
      });
    });

    media.add("(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const stage = root.current?.querySelector<HTMLElement>("[data-stage]");
      const model = stage?.querySelector("[data-model]");
      if (!stage || !model) return;
      const rotateX = gsap.quickTo(model, "rotationX", { duration: .5, ease: "power3.out" });
      const rotateY = gsap.quickTo(model, "rotationY", { duration: .5, ease: "power3.out" });
      const move = (event: PointerEvent) => {
        const bounds = stage.getBoundingClientRect();
        rotateX((.5 - (event.clientY - bounds.top) / bounds.height) * 12);
        rotateY(((event.clientX - bounds.left) / bounds.width - .5) * 16);
      };
      const reset = () => { rotateX(0); rotateY(0); };
      stage.addEventListener("pointermove", move);
      stage.addEventListener("pointerleave", reset);
      return () => {
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerleave", reset);
      };
    });
    return () => media.revert();
  }, []);

  return <main className={styles.landing} ref={root}>{children}</main>;
}

const states = [
  { label: "V1", status: "Em revisão", title: "Campanha Aurora", detail: "A primeira versão está pronta para receber feedback." },
  { label: "Ajuste", status: "Ajuste solicitado", title: "Aumentar o contraste", detail: "O pedido do cliente fica no histórico da V1." },
  { label: "V2", status: "Aprovada", title: "Versão final aprovada", detail: "A aprovação fica registrada na V2, no mesmo link." },
];

export function ReviewShowcase() {
  const [active, setActive] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const state = states[active];

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(panel.current, { opacity: .5, y: 9 }, { opacity: 1, y: 0, duration: .36, ease: "power2.out" });
      gsap.fromTo(art.current, { rotation: -6, scale: .96 }, { rotation: 0, scale: 1, duration: .55, ease: "power3.out" });
    });
    return () => media.revert();
  }, [active]);

  return <figure className={styles.stage} data-stage>
    <div className={styles.stageBar}><span><i /> PRÉVIA INTERATIVA</span><span>ARQUIVO / 001</span></div>
    <div className={styles.scene} data-model>
      <div className={styles.backplate} aria-hidden="true" />
      <div className={styles.art} ref={art} data-version={active === 2 ? "v2" : "v1"} aria-hidden="true">
        <span className={styles.artLabel}>ESTÚDIO AURORA <b>◈</b></span>
        <div className={styles.orbit}><i /><i /><i /></div>
        <span className={styles.artTitle}>Novos<br />começos<span>.</span></span>
        <span className={styles.artCode}>CAMPANHA / 0{active === 2 ? "2" : "1"}</span>
      </div>
      <div className={styles.status} ref={panel} aria-live="polite" aria-atomic="true">
        <span className={styles.pill} data-state={active}><i /> {state.status}</span>
        <strong>{state.title}</strong><small>{state.detail}</small>
      </div>
    </div>
    <figcaption className={styles.stageFoot}>
      <span>EXPLORE A ENTREGA</span>
      <div className={styles.switches} role="group" aria-label="Etapas da revisão fictícia">
        {states.map(({ label }, i) => <button type="button" key={label} aria-pressed={active === i} onClick={() => setActive(i)}>{label}</button>)}
      </div>
    </figcaption>
  </figure>;
}
