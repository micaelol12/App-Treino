import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Pencil, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState, ErrorState, LoadingState } from '../components/feedback';
import { PageHeader } from '../components/page-header';
import {
  listDivisionTemplates,
  setDivisionTemplateStatus,
  type DivisionTemplateStatus,
} from '../features/workout-division-templates';

const statusLabels: Record<DivisionTemplateStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicada',
  archived: 'Arquivada',
};

export function DivisionTemplatesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | DivisionTemplateStatus>('all');
  const queryClient = useQueryClient();
  const templates = useQuery({
    queryKey: ['division-templates'],
    queryFn: listDivisionTemplates,
  });
  const changeStatus = useMutation({
    mutationFn: ({
      documentId,
      nextStatus,
    }: {
      documentId: string;
      nextStatus: DivisionTemplateStatus;
    }) => setDivisionTemplateStatus(documentId, nextStatus),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['division-templates'] }),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return (templates.data ?? []).filter(
      (item) =>
        (!term ||
          `${item.name} ${item.description} ${item.goal} ${item.level}`
            .toLocaleLowerCase('pt-BR')
            .includes(term)) &&
        (status === 'all' || item.status === status),
    );
  }, [search, status, templates.data]);

  return (
    <>
      <PageHeader
        eyebrow="CONTEÚDO"
        title="Divisões prontas"
        description="Monte divisões que os usuários poderão copiar e personalizar no aplicativo."
        actions={
          <Link className="button button-primary" to="/divisoes-prontas/nova">
            <Plus size={18} /> Nova divisão pronta
          </Link>
        }
      />
      <section className="panel table-panel">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, objetivo ou nível"
            />
          </label>
          <select
            aria-label="Filtrar por status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as 'all' | DivisionTemplateStatus)
            }
          >
            <option value="all">Todos os status</option>
            <option value="draft">Rascunhos</option>
            <option value="published">Publicadas</option>
            <option value="archived">Arquivadas</option>
          </select>
          <span className="result-count">{filtered.length} resultado(s)</span>
        </div>
        {templates.isLoading ? (
          <LoadingState />
        ) : templates.isError ? (
          <ErrorState message="Não foi possível carregar as divisões prontas." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhuma divisão pronta"
            description="Cadastre uma divisão ou ajuste os filtros."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Divisão</th>
                  <th>Objetivo</th>
                  <th>Exercícios</th>
                  <th>Versão</th>
                  <th>Status</th>
                  <th><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.documentId}>
                    <td>
                      <div className="entity-cell">
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.description || 'Sem descrição'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{item.goal || 'Não informado'}</td>
                    <td>{item.exerciseCount}</td>
                    <td>v{item.version}</td>
                    <td>
                      <span
                        className={`status-pill ${item.status === 'published' ? 'active' : 'inactive'}`}
                      >
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link
                          className="icon-button"
                          aria-label={`Editar ${item.name}`}
                          to={`/divisoes-prontas/${item.documentId}/editar`}
                        >
                          <Pencil size={17} />
                        </Link>
                        {item.status !== 'archived' ? (
                          <button
                            className="icon-button danger"
                            aria-label={`Arquivar ${item.name}`}
                            disabled={changeStatus.isPending}
                            onClick={() =>
                              changeStatus.mutate({
                                documentId: item.documentId,
                                nextStatus: 'archived',
                              })
                            }
                          >
                            <Archive size={17} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
