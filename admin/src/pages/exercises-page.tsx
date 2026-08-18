import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageOff, Pencil, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { PageHeader } from '../components/page-header';
import { listExercises, setExerciseActive } from '../features/catalog';

export function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const queryClient = useQueryClient();
  const exercises = useQuery({ queryKey: ['exercises'], queryFn: listExercises });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setExerciseActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return (exercises.data ?? []).filter((item) => {
      const active = item.active !== false;
      return (!term || `${item.name} ${item.id} ${item.equipment ?? ''}`.toLocaleLowerCase('pt-BR').includes(term)) &&
        (status === 'all' || (status === 'active' ? active : !active));
    });
  }, [exercises.data, search, status]);


  console.log('Exercises data:', exercises); // Log the exercises data for debugging

  return (
    <>
      <PageHeader eyebrow="CATÁLOGO" title="Exercícios" description="Administre os exercícios exibidos no aplicativo e mantenha a demonstração visual atualizada." actions={<Link className="button button-primary" to="/exercicios/novo"><Plus size={18} />Novo exercício</Link>} />
      <section className="panel table-panel">
        <div className="toolbar">
          <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, ID ou equipamento" /></label>
          <select aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos os status</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select>
          <span className="result-count">{filtered.length} resultado(s)</span>
        </div>
        {exercises.isLoading ? <LoadingState /> : exercises.isError ? <ErrorState message="Não foi possível ler a coleção de exercícios." /> : filtered.length === 0 ? <EmptyState title="Nenhum exercício encontrado" description="Ajuste os filtros ou cadastre um novo exercício." /> : (
          <div className="table-scroll"><table><thead><tr><th>Exercício</th><th>Categoria</th><th>Equipamento</th><th>Mídia</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>
            {filtered.map((item) => { const active = item.active !== false; return <tr key={item.documentId}>
              <td><div className="entity-cell"><div className="exercise-thumb">{item.images[0] ? <img src={item.images[0]} alt="" /> : <ImageOff size={18} />}</div><div><strong>{item.name}</strong><small>{item.id}</small></div></div></td>
              <td>{item.category}</td><td>{item.equipment || 'Sem equipamento'}</td><td><span className={item.images.length || item.videoUrl ? 'media-badge' : 'media-badge missing'}>{item.images.length} img. {item.videoUrl ? '• GIF' : ''}</span></td>
              <td><button className={`status-pill ${active ? 'active' : 'inactive'}`} disabled={toggle.isPending} onClick={() => toggle.mutate({ id: item.documentId, active: !active })}>{active ? 'Ativo' : 'Inativo'}</button></td>
              <td><Link className="icon-button" aria-label={`Editar ${item.name}`} to={`/exercicios/${item.documentId}/editar`}><Pencil size={17} /></Link></td>
            </tr>; })}
          </tbody></table></div>
        )}
      </section>
    </>
  );
}
