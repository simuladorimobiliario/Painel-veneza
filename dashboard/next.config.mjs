import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sem isso o navegador bloqueia os arquivos JS quando o site e acessado
  // pelo IP da rede local (192.168.0.107) em vez de localhost, e a pagina
  // fica sem funcionar (nenhum clique reage) mesmo parecendo carregada.
  allowedDevOrigins: ['192.168.0.107'],
};

export default nextConfig;

// So ativa em dev (npm run dev) -- deixa o `next dev` local simular os
// bindings do Cloudflare, pra nao precisar do wrangler pra desenvolver.
initOpenNextCloudflareForDev();
