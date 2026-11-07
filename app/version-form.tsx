"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { publishVersion, type VersionResult } from "./actions";
import { useActionNotice } from "./notifications";

export function VersionForm({ deliveryId }: { deliveryId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const [result, action, pending] = useActionState(async (previous: VersionResult, form: FormData) => {
    if (file) form.set("file", file);
    const next = await publishVersion(deliveryId, previous, form);
    if (next.number) {
      setFile(null);
      if (input.current) input.current.value = "";
    }
    return next;
  }, {} as VersionResult);
  useActionNotice(result, result.number ? `V${result.number} publicada no mesmo link.` : undefined, result.error);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function select(file: File | null) {
    const message = file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)
      ? "Use PNG, JPEG ou WebP." : file && (!file.size || file.size > 3 * 1024 * 1024)
      ? "Envie uma imagem de até 3 MB." : "";
    setError(message);
    setFile(message ? null : file);
  }
  return <details className="version-upload">
    <summary>Enviar nova versão</summary>
    <form className="fields" action={action} aria-busy={pending}>
      <label className="dropzone" onDragOver={event => event.preventDefault()}
        onDrop={event => { event.preventDefault(); if (!pending) select(event.dataTransfer.files[0] ?? null); }}>
        <span>Imagem da nova versão</span>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp"
          disabled={pending} onChange={event => select(event.target.files?.[0] ?? null)} />
        {preview && <img src={preview} alt="Prévia da nova versão" />}
        <span>{file?.name ?? "Arraste ou escolha uma imagem"}</span>
      </label>
      <p className="muted file-help">PNG, JPEG ou WebP · até 3 MB</p>
      <button className="secondary" aria-busy={pending} disabled={pending || !file}>
        {pending ? "Publicando…" : "Publicar versão"}
      </button>
      {(error || result.error) && <p className="field-error" role="alert">{error || result.error}</p>}
    </form>
  </details>;
}
