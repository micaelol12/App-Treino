import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Search } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { PageHeader } from '../components/page-header';
import { createEquipment, listTaxonomy, setEquipmentActive } from '../features/catalog';

export function EquipmentPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const queryClient = useQueryClient();
  const equipment = useQuery({ queryKey: ['taxonomy', 'equipamentos'], queryFn: () => listTaxonomy('equipamentos') });
  const create = useMutation({ mutationFn: createEquipment, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['taxonomy', 'equipamentos'] }); setName(''); setId(''); setShowForm(false); } });
  const toggle = useMutation({ mutationFn: ({ documentId, active }: { documentId: string; active: boolean }) => setEquipmentActive(documentId, active), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['taxonomy', 'equipamentos'] }) });
  const filtered = useMemo(() => (equipment.data ?? []).filter((item) => `${item.name} ${item.id}`.toLowerCase().includes(search.toLowerCase())), [equipment.data, search]);

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate({ id, name, order: (equipment.data?.length ?? 0) + 1 });
  }

  return <>
    <PageHeader eyebrow="CATÁLOGO" title="Equipamentos" description="Mantenha padronizadas as opções usadas no cadastro e nos filtros de exercícios." actions={<button className="button button-primary" onClick={() => setShowForm((value) => !value)}><Plus size={18} />Novo equipamento</button>} />
    {showForm && <form className="panel inline-form" onSubmit={submit}><label className="field"><span>Nome</span><input value={name} onChange={(event) => { setName(event.target.value); if (!id) setId(event.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); }} required /></label><label className="field"><span>ID lógico</span><input value={id} onChange={(event) => setId(event.target.value)} required /></label><button className="button button-primary" disabled={create.isPending}>{create.isPending ? 'Salvando…' : 'Cadastrar'}</button></form>}
    <section className="panel table-panel"><div className="toolbar"><label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar equipamento" /></label><span className="result-count">{filtered.length} equipamento(s)</span></div>
      {equipment.isLoading ? <LoadingState /> : equipment.isError ? <ErrorState message="Não foi possível ler equipamentos." /> : filtered.length === 0 ? <EmptyState title="Nenhum equipamento" description="Cadastre a primeira opção do catálogo." /> : <div className="equipment-grid">{filtered.map((item) => <article className="equipment-card" key={item.documentId}><span className="equipment-icon"><Package /></span><div><strong>{item.name}</strong><small>{item.id}</small></div><button className={`status-pill ${item.active ? 'active' : 'inactive'}`} onClick={() => toggle.mutate({ documentId: item.documentId, active: !item.active })}>{item.active ? 'Ativo' : 'Inativo'}</button></article>)}</div>}
    </section>
  </>;
}
