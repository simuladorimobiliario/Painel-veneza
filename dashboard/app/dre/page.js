'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import PageHeader from '../../components/PageHeader';

export default function DrePage() {
  const [arquivos, setArquivos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const carregarArquivos = useCallback(async () => {
    const supabase = createClient();
    const { data, error: selectError } = await supabase
      .from('dre_arquivos')
      .select('id, nome_arquivo, caminho_storage, enviado_em')
      .order('enviado_em', { ascending: false });

    if (selectError) {
      setError(selectError.message);
      return;
    }
    setArquivos(data);
  }, []);

  useEffect(() => {
    carregarArquivos();
  }, [carregarArquivos]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const caminho = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('dre-pdfs').upload(caminho, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('dre_arquivos')
      .insert({ nome_arquivo: file.name, caminho_storage: caminho });

    setUploading(false);
    e.target.value = '';

    if (insertError) {
      setError(insertError.message);
      return;
    }

    carregarArquivos();
  }

  async function handleDownload(caminho) {
    const supabase = createClient();
    const { data, error: signedUrlError } = await supabase.storage.from('dre-pdfs').createSignedUrl(caminho, 60);

    if (signedUrlError) {
      setError(signedUrlError.message);
      return;
    }

    // Link real em vez de window.open: nao esbarra em bloqueador de pop-up.
    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.rel = 'noopener';
    link.click();
  }

  return (
    <div>
      <PageHeader eyebrow="Painel financeiro" title="DRE" subtitle="Envie aqui o PDF do DRE exportado do sistema." />

      <div className="surface">
        <input type="file" accept="application/pdf" className="file-input" onChange={handleUpload} disabled={uploading} />
        {uploading && <p className="muted" style={{ margin: '0.5rem 0 0' }}>Enviando...</p>}
        {error && <p className="error-text" style={{ margin: '0.5rem 0 0' }}>{error}</p>}
      </div>

      <div className="surface" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Enviado em</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {arquivos.map((a) => (
              <tr key={a.id}>
                <td>{a.nome_arquivo}</td>
                <td>{new Date(a.enviado_em).toLocaleString('pt-BR')}</td>
                <td>
                  <button className="btn-secondary" onClick={() => handleDownload(a.caminho_storage)}>
                    Baixar
                  </button>
                </td>
              </tr>
            ))}
            {arquivos.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '0.5rem 0' }}>
                  Nenhum arquivo enviado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
