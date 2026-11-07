"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { publishDelivery, type PublishResult } from "./actions";
import { useActionNotice, useNotify } from "./notifications";

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

export function PublishForm() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileId = useId();
  const notify = useNotify();

  const [result, action, pending] = useActionState(async (previous: PublishResult, form: FormData) => {
    if (file) form.set("file", file);
    const next = await publishDelivery(previous, form);
    if (next.link) {
      setTitle("");
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
    }
    return next;
  }, {} as PublishResult);
  useActionNotice(result, result.link ? "V1 publicada. O link está pronto para compartilhar." : undefined, result.error);

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(selected: File | null) {
    const error = selected && !allowedTypes.includes(selected.type) ? "Use uma imagem PNG, JPEG ou WebP."
      : selected && (!selected.size || selected.size > 3 * 1024 * 1024) ? "Envie uma imagem de até 3 MB." : "";
    setFileError(error);
    setFile(error ? null : selected);
  }

  async function copyLink() {
    if (!result.link) return;
    try {
      await navigator.clipboard.writeText(new URL(result.link, window.location.origin).href);
      notify("Link copiado.");
    } catch {
      notify("Não foi possível copiar. Abra a revisão para copiar o endereço.", "error");
    }
  }

  return <section id="nova-entrega" className="panel publish-panel">
    <h2>Nova entrega</h2>
    <form className="fields" action={action} aria-busy={pending}>
      <label>Título<input name="title" value={title} onChange={event => setTitle(event.target.value)}
        placeholder="Campanha de lançamento" required maxLength={100} disabled={pending} /></label>
      <div>
        <label htmlFor={fileId}>Arquivo da V1</label>
        <div className="dropzone" data-dragging={dragging}
          onDragOver={event => { event.preventDefault(); if (!pending) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => {
            event.preventDefault();
            setDragging(false);
            if (!pending) selectFile(event.dataTransfer.files[0] ?? null);
          }}>
          <input ref={fileInput} id={fileId} type="file" accept={allowedTypes.join(",")}
            onChange={event => selectFile(event.target.files?.[0] ?? null)} disabled={pending} />
          {preview && file ? <><img src={preview} alt="" /><span>{file.name}</span></>
            : <><span aria-hidden="true">↑</span><span>Arraste uma imagem ou clique para escolher</span></>}
        </div>
        <p className="muted file-help">PNG, JPEG ou WebP de até 3 MB.</p>
        {fileError && <p className="field-error" role="alert">{fileError}</p>}
      </div>
      <button type="submit" aria-busy={pending} disabled={pending || !title.trim() || !file}>
        {pending ? "Publicando…" : "Publicar V1"}
      </button>
    </form>
    {result.error && <p className="field-error">{result.error}</p>}
    {result.link && <div className="share">
      <p>V1 publicada.</p>
      <a href={result.link} target="_blank" rel="noreferrer">Abrir revisão</a>
      <button type="button" className="secondary" onClick={copyLink}>Copiar link</button>
    </div>}
  </section>;
}
