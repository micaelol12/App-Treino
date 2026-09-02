import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageOff, Pencil, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { PageHeader } from '../components/page-header';
import {
  SearchableFilter,
  type SearchableFilterOption,
} from '../components/searchable-filter';
import { listExercises, setExerciseActive } from '../features/catalog';

function toFilterOptions(values: readonly (string | null)[]): SearchableFilterOption[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort((left, right) =>
      left.localeCompare(right, 'pt-BR', { sensitivity: 'base' }),
    )
    .map((value) => ({ label: value, value }));
}

export function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [equipment, setEquipment] = useState('all');
  const [primaryMuscle, setPrimaryMuscle] = useState('all');
  const [secondaryMuscle, setSecondaryMuscle] = useState('all');
  const [status, setStatus] = useState('all');
  const queryClient = useQueryClient();
  const exercises = useQuery({ queryKey: ['exercises'], queryFn: listExercises });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setExerciseActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });

  const filterOptions = useMemo(() => {
    const items = exercises.data ?? [];
    return {
      categories: toFilterOptions(items.map((item) => item.category)),
      equipment: toFilterOptions(items.map((item) => item.equipment)),
      hasExercisesWithoutEquipment: items.some((item) => !item.equipment),
      primaryMuscles: toFilterOptions(items.flatMap((item) => item.primaryMuscles)),
      secondaryMuscles: toFilterOptions(items.flatMap((item) => item.secondaryMuscles)),
    };
  }, [exercises.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return (exercises.data ?? []).filter((item) => {
      const active = item.active !== false;
      return (!term || `${item.name} ${item.id} ${item.equipment ?? ''}`.toLocaleLowerCase('pt-BR').includes(term)) &&
        (category === 'all' || item.category === category) &&
        (equipment === 'all' || (equipment === 'without-equipment' ? !item.equipment : item.equipment === equipment)) &&
        (primaryMuscle === 'all' || item.primaryMuscles.includes(primaryMuscle)) &&
        (secondaryMuscle === 'all' || item.secondaryMuscles.includes(secondaryMuscle)) &&
        (status === 'all' || (status === 'active' ? active : !active));
    });
  }, [category, equipment, exercises.data, primaryMuscle, search, secondaryMuscle, status]);


  return (
    <>
      <PageHeader eyebrow="CATÁLOGO" title="Exercícios" description="Administre os exercícios exibidos no aplicativo e mantenha a demonstração visual atualizada." actions={<Link className="button button-primary" to="/exercicios/novo"><Plus size={18} />Novo exercício</Link>} />
      <section className="panel table-panel">
        <div className="toolbar">
          <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, ID ou equipamento" /></label>
          <SearchableFilter
            allLabel="Todas as categorias"
            ariaLabel="Filtrar por categoria"
            onChange={setCategory}
            options={filterOptions.categories}
            value={category}
          />
          <SearchableFilter
            allLabel="Todos os equipamentos"
            ariaLabel="Filtrar por equipamento"
            onChange={setEquipment}
            options={filterOptions.hasExercisesWithoutEquipment ? [
              { label: 'Sem equipamento', value: 'without-equipment' },
              ...filterOptions.equipment,
            ] : filterOptions.equipment}
            value={equipment}
          />
          <SearchableFilter
            allLabel="Todos os músculos principais"
            ariaLabel="Filtrar por músculo principal"
            onChange={setPrimaryMuscle}
            options={filterOptions.primaryMuscles}
            value={primaryMuscle}
          />
          <SearchableFilter
            allLabel="Todos os músculos secundários"
            ariaLabel="Filtrar por músculo secundário"
            onChange={setSecondaryMuscle}
            options={filterOptions.secondaryMuscles}
            value={secondaryMuscle}
          />
          <SearchableFilter
            allLabel="Todos os status"
            ariaLabel="Filtrar por status"
            onChange={setStatus}
            options={[
              { label: 'Ativos', value: 'active' },
              { label: 'Inativos', value: 'inactive' },
            ]}
            value={status}
          />
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
