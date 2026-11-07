"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReviewActions } from "./adjustment-form";

type ReviewImage = { id: string; number: number; src: string; alt: string };

export function ReviewExperience({ image, token, approved, feedback }: {
  image: ReviewImage;
  token: string;
  approved: boolean;
  feedback?: string;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [displayed, setDisplayed] = useState<ReviewImage | null>(null);
  const [failedSource, setFailedSource] = useState("");
  const ready = displayed?.id === image.id;
  const failed = !ready && failedSource === image.src;
  const loading = !ready && !failed;
  const layers = ready ? [displayed] : displayed && !failed ? [displayed, image] : [image];

  function refresh() {
    setFailedSource("");
    startRefresh(() => router.refresh());
  }

  function showImage() {
    setDisplayed(previous => previous?.id === image.id ? previous : image);
  }

  return <div className="columns review review-enter">
    <div className="preview review-preview">
      {layers.map(layer => {
        const current = layer.id === image.id;
        const visible = displayed?.id === layer.id && !failed;
        return <img
          key={layer.id}
          src={layer.src}
          alt={layer.alt}
          aria-hidden={!current || !visible}
          data-visible={visible}
          data-current={current}
          ref={element => {
            if (!current || ready || !element?.complete) return;
            if (element.naturalWidth > 0) showImage();
            else setFailedSource(layer.src);
          }}
          onLoad={current && !ready ? showImage : undefined}
          onError={current && !ready ? () => setFailedSource(layer.src) : undefined}
        />;
      })}
      {(loading || refreshing) && <div className="review-loading" role="status">
        <span className="review-loading-track" aria-hidden="true" />
        <span>{refreshing ? "Buscando a versão mais recente…" : `Carregando V${image.number}…`}</span>
      </div>}
      {failed && !refreshing && <div className="review-image-error" role="alert">
        <p>Não foi possível carregar a imagem da V{image.number}.</p>
        <button className="secondary" onClick={refresh}>Tentar novamente</button>
      </div>}
    </div>
    <aside className="panel review-side">
      <div className="review-side-heading">
        <h2>Revisão</h2>
        <button type="button" className="secondary" onClick={refresh} disabled={refreshing}>
          {refreshing ? "Atualizando…" : "Atualizar versão"}
        </button>
      </div>
      <p className="version">V{image.number} · Atual</p>
      <p className="muted">Confira a imagem enviada pelo freelancer.</p>
      <ReviewActions key={image.id} token={token} versionId={image.id} versionNumber={image.number}
        approved={approved} feedback={feedback} imageReady={ready && !refreshing} />
    </aside>
  </div>;
}
