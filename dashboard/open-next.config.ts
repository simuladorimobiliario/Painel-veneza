import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Sem cache incremental (R2) de proposito: o app e quase todo client-side
// (busca dados direto do Supabase no navegador), nao usa ISR/revalidate do
// Next -- nao precisa do binding extra de um bucket R2.
export default defineCloudflareConfig();
