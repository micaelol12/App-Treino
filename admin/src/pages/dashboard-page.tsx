import { useQuery } from '@tanstack/react-query';
import { Dumbbell, ImageOff, Package, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ErrorState, LoadingState } from '../components/feedback';
import { PageHeader } from '../components/page-header';
import { listExercises, listTaxonomy } from '../features/catalog';

export function DashboardPage() {
  const exercises = useQuery({ queryKey: ['exercises'], queryFn: listExercises });
  const equipment = useQuery({ queryKey: ['taxonomy', 'equipamentos'], queryFn: () => listTaxonomy('equipamentos') });

  if (exercises.isLoading || equipment.isLoading) return <LoadingState label="Montando a visão geral…" />;
  if (exercises.isError || equipment.isError) return <ErrorState message="Confira sua conexão e as permissões do Firebase." />;

  const exerciseList = exercises.data ?? [];
  const equipmentList = equipment.data ?? [];
  const missingMedia = exerciseList.filter((item) => item.images.length === 0 && !item.videoUrl).length;
  const activeExercises = exerciseList.filter((item) => item.active !== false).length;

  return (
    <>
      <PageHeader eyebrow="VISÃO GERAL" title="Olá, administrador." description="Acompanhe a saúde do catálogo e encontre rapidamente o que precisa de atenção." actions={<Link to="/exercicios/novo" className="button button-primary">Novo exercício</Link>} />

      <section className="stats-grid" aria-label="Indicadores">
        <article className="stat-card"><span className="stat-icon green"><Dumbbell /></span><div><span>Exercícios ativos</span><strong>{activeExercises}</strong><small>{exerciseList.length} cadastrados</small></div></article>
        <article className="stat-card"><span className="stat-icon orange"><Package /></span><div><span>Equipamentos</span><strong>{equipmentList.filter((item) => item.active).length}</strong><small>{equipmentList.length} cadastrados</small></div></article>
        <article className="stat-card"><span className="stat-icon red"><ImageOff /></span><div><span>Sem mídia</span><strong>{missingMedia}</strong><small>precisam de imagem ou vídeo</small></div></article>
        <article className="stat-card stat-card-muted"><span className="stat-icon blue"><Users /></span><div><span>Usuários ativos</span><strong>—</strong><small>API administrativa pendente</small></div></article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">CATÁLOGO</p><h2>Cobertura de mídia</h2></div><Link to="/exercicios">Ver catálogo</Link></div>
          <div className="progress-summary">
            <div className="progress-ring" style={{ '--progress': `${exerciseList.length ? Math.round(((exerciseList.length - missingMedia) / exerciseList.length) * 100) : 0}%` } as React.CSSProperties}>
              <strong>{exerciseList.length ? Math.round(((exerciseList.length - missingMedia) / exerciseList.length) * 100) : 0}%</strong><span>com mídia</span>
            </div>
            <div className="legend"><span><i className="legend-ok" />Com imagem ou vídeo <strong>{exerciseList.length - missingMedia}</strong></span><span><i className="legend-warning" />Sem mídia <strong>{missingMedia}</strong></span></div>
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">PRÓXIMOS PASSOS</p><h2>Operação do painel</h2></div></div>
          <ol className="task-list">
            <li className="done"><span>1</span><div><strong>Catálogo administrativo</strong><small>Listagem, cadastro, edição e mídia</small></div></li>
            <li className="done"><span>2</span><div><strong>Equipamentos</strong><small>Cadastro e controle de status</small></div></li>
            <li><span>3</span><div><strong>API de usuários</strong><small>Firebase Admin SDK e métricas de atividade</small></div></li>
          </ol>
        </article>
      </section>
    </>
  );
}
