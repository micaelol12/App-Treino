import { ServerCog, ShieldCheck, Users } from 'lucide-react';

import { PageHeader } from '../components/page-header';

export function UsersPage() {
  return <>
    <PageHeader eyebrow="OPERAÇÃO" title="Usuários" description="A administração de contas será conectada por uma API segura com Firebase Admin SDK." />
    <section className="panel coming-soon"><span className="coming-icon"><Users /></span><h2>Módulo preparado para a próxima entrega</h2><p>O SDK do navegador não pode listar todas as contas do Firebase Auth. Essa operação será exposta por uma função autenticada, sem enviar credenciais administrativas ao frontend.</p><div className="requirement-grid"><div><ShieldCheck /><strong>Custom claim</strong><span>Somente administradores</span></div><div><ServerCog /><strong>Admin SDK</strong><span>Listagem e bloqueio seguros</span></div></div></section>
  </>;
}
