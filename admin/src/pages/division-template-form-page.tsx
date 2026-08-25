import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ZodError } from 'zod';

import { ErrorState, LoadingState } from '../components/feedback';
import { PageHeader } from '../components/page-header';
import { listExercises } from '../features/catalog';
import {
  divisionTemplateFormSchema,
  getDivisionTemplate,
  saveDivisionTemplate,
  type DivisionTemplateExercise,
  type DivisionTemplateStatus,
} from '../features/workout-division-templates';

type FormState = {
  name: string;
  description: string;
  level: string;
  goal: string;
  displayOrder: string;
  exercises: DivisionTemplateExercise[];
};

const emptyForm: FormState = {
  name: '',
  description: '',
  level: '',
  goal: '',
  displayOrder: '0',
  exercises: [],
};

function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues[0]?.message ?? 'Revise os campos.';
  return error instanceof Error ? error.message : 'Não foi possível salvar a divisão.';
}

export function DivisionTemplateFormPage() {
  const { templateId } = useParams();
  const editing = Boolean(templateId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [defaultSets, setDefaultSets] = useState('3');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const template = useQuery({
    queryKey: ['division-template', templateId],
    queryFn: () => getDivisionTemplate(templateId!),
    enabled: editing,
  });
  const catalog = useQuery({ queryKey: ['exercises'], queryFn: listExercises });

  useEffect(() => {
    if (!template.data) return;
    setForm({
      name: template.data.name,
      description: template.data.description,
      level: template.data.level,
      goal: template.data.goal,
      displayOrder: String(template.data.displayOrder),
      exercises: template.data.exercises,
    });
  }, [template.data]);

  const availableExercises = useMemo(() => {
    const term = exerciseSearch.trim().toLocaleLowerCase('pt-BR');
    const selected = new Set(form.exercises.map(({ exerciseDocumentId }) => exerciseDocumentId));
    return (catalog.data ?? []).filter(
      (exercise) =>
        exercise.active !== false &&
        !selected.has(exercise.documentId) &&
        (!term || exercise.name.toLocaleLowerCase('pt-BR').includes(term)),
    );
  }, [catalog.data, exerciseSearch, form.exercises]);

  function addExercise() {
    const exercise = catalog.data?.find(({ documentId }) => documentId === selectedExercise);
    const sets = Number(defaultSets);
    if (!exercise || !Number.isInteger(sets) || sets < 1 || sets > 10) {
      setError('Selecione um exercício e informe de 1 a 10 séries.');
      return;
    }
    setForm((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          exerciseId: exercise.id,
          exerciseDocumentId: exercise.documentId,
          exerciseNameSnapshot: exercise.name,
          defaultSets: sets,
          order: current.exercises.length + 1,
        },
      ],
    }));
    setSelectedExercise('');
    setExerciseSearch('');
    setError(null);
  }

  function moveExercise(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= form.exercises.length) return;
    setForm((current) => {
      const exercises = [...current.exercises];
      const selected = exercises[index];
      const adjacent = exercises[target];
      if (!selected || !adjacent) return current;
      exercises[index] = adjacent;
      exercises[target] = selected;
      return {
        ...current,
        exercises: exercises.map((exercise, order) => ({ ...exercise, order: order + 1 })),
      };
    });
  }

  async function submit(status: DivisionTemplateStatus) {
    setSubmitting(true);
    setError(null);
    try {
      const parsed = divisionTemplateFormSchema.parse({
        ...form,
        displayOrder: Number(form.displayOrder),
        status,
      });
      await saveDivisionTemplate({ ...parsed, ...(templateId ? { documentId: templateId } : {}) });
      await queryClient.invalidateQueries({ queryKey: ['division-templates'] });
      navigate('/divisoes-prontas');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if ((editing && template.isLoading) || catalog.isLoading) {
    return <LoadingState label="Carregando construtor…" />;
  }
  if ((editing && template.isError) || catalog.isError) {
    return <ErrorState message="Não foi possível carregar o modelo ou o catálogo." />;
  }

  return (
    <>
      <PageHeader
        eyebrow={editing ? 'EDITAR DIVISÃO PRONTA' : 'NOVA DIVISÃO PRONTA'}
        title={editing ? form.name || 'Editar divisão' : 'Montar divisão'}
        description="Escolha os exercícios, defina as séries e publique quando estiver pronta."
        actions={
          <Link to="/divisoes-prontas" className="button button-secondary">
            <ArrowLeft size={18} /> Voltar
          </Link>
        }
      />
      <div className="form-layout">
        <div className="form-main stack-lg">
          <section className="panel form-section">
            <div className="section-heading">
              <span>01</span>
              <div><h2>Identificação</h2><p>Informações exibidas para o usuário.</p></div>
            </div>
            <div className="form-grid two-columns">
              <label className="field field-wide">
                <span>Nome</span>
                <input value={form.name} maxLength={80} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="field field-wide">
                <span>Descrição</span>
                <textarea rows={4} value={form.description} maxLength={500} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <label className="field">
                <span>Nível</span>
                <input value={form.level} placeholder="Ex.: Intermediário" onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} />
              </label>
              <label className="field">
                <span>Objetivo</span>
                <input value={form.goal} placeholder="Ex.: Hipertrofia" onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))} />
              </label>
              <label className="field">
                <span>Ordem de exibição</span>
                <input type="number" min="0" max="9999" value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))} />
              </label>
            </div>
          </section>

          <section className="panel form-section">
            <div className="section-heading">
              <span>02</span>
              <div><h2>Exercícios</h2><p>Adicione até 15 exercícios e organize a execução.</p></div>
            </div>
            <div className="template-exercise-picker">
              <label className="field">
                <span>Buscar</span>
                <input value={exerciseSearch} onChange={(event) => { setExerciseSearch(event.target.value); setSelectedExercise(''); }} placeholder="Digite o nome" />
              </label>
              <label className="field">
                <span>Exercício</span>
                <select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>
                  <option value="">Selecione</option>
                  {availableExercises.slice(0, 100).map((exercise) => <option key={exercise.documentId} value={exercise.documentId}>{exercise.name}</option>)}
                </select>
              </label>
              <label className="field template-sets-field">
                <span>Séries</span>
                <input type="number" min="1" max="10" value={defaultSets} onChange={(event) => setDefaultSets(event.target.value)} />
              </label>
              <button type="button" className="button button-secondary" onClick={addExercise}><Plus size={17} /> Adicionar</button>
            </div>
            <div className="template-exercise-list">
              {form.exercises.length === 0 ? <p className="muted-copy">Nenhum exercício adicionado.</p> : form.exercises.map((exercise, index) => (
                <article className="template-exercise-row" key={exercise.exerciseDocumentId}>
                  <span className="template-order">{index + 1}</span>
                  <div><strong>{exercise.exerciseNameSnapshot}</strong><small>{exercise.defaultSets} séries</small></div>
                  <button type="button" className="icon-button" disabled={index === 0} aria-label={`Subir ${exercise.exerciseNameSnapshot}`} onClick={() => moveExercise(index, -1)}><ArrowUp size={16} /></button>
                  <button type="button" className="icon-button" disabled={index === form.exercises.length - 1} aria-label={`Descer ${exercise.exerciseNameSnapshot}`} onClick={() => moveExercise(index, 1)}><ArrowDown size={16} /></button>
                  <button type="button" className="icon-button danger" aria-label={`Remover ${exercise.exerciseNameSnapshot}`} onClick={() => setForm((current) => ({ ...current, exercises: current.exercises.filter((_, itemIndex) => itemIndex !== index).map((item, order) => ({ ...item, order: order + 1 })) }))}><Trash2 size={16} /></button>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="form-sidebar">
          <section className="panel publish-card">
            <h2>Disponibilidade</h2>
            <p className="muted-copy">Rascunhos ficam restritos ao admin. Publicações aparecem imediatamente no aplicativo.</p>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button type="button" className="button button-secondary button-block" disabled={submitting} onClick={() => void submit('draft')}><Save size={17} /> Salvar rascunho</button>
            <button type="button" className="button button-primary button-block" disabled={submitting} onClick={() => void submit('published')}>{submitting ? 'Salvando…' : 'Publicar divisão'}</button>
          </section>
        </aside>
      </div>
    </>
  );
}
