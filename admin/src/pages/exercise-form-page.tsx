import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileVideo, ImagePlus, Save, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ErrorState, LoadingState } from '../components/feedback';
import { PageHeader } from '../components/page-header';
import {
  exerciseFormSchema,
  getExercise,
  listTaxonomy,
  saveExercise,
  taxonomyNames,
  type TaxonomyName,
} from '../features/catalog';

type FormState = {
  id: string;
  name: string;
  force: string;
  level: string;
  mechanic: string;
  equipment: string;
  primaryMuscles: string;
  secondaryMuscles: string;
  instructions: string;
  category: string;
  images: string[];
  videoUrl: string;
  active: boolean;
};

const emptyForm: FormState = {
  id: '', name: '', force: '', level: '', mechanic: '', equipment: '', primaryMuscles: '',
  secondaryMuscles: '', instructions: '', category: '', images: [], videoUrl: '', active: true,
};

function splitComma(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function ExerciseFormPage() {
  const { documentId } = useParams();
  const editing = Boolean(documentId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exercise = useQuery({
    queryKey: ['exercise', documentId],
    queryFn: () => getExercise(documentId!),
    enabled: editing,
  });
  const taxonomies = useQuery({
    queryKey: ['taxonomies'],
    queryFn: async () => Object.fromEntries(await Promise.all(taxonomyNames.map(async (name) => [name, await listTaxonomy(name)]))) as Record<TaxonomyName, Awaited<ReturnType<typeof listTaxonomy>>>,
  });

  useEffect(() => {
    if (!exercise.data) return;
    const item = exercise.data;
    setForm({
      id: item.id,
      name: item.name,
      force: item.force ?? '',
      level: item.level,
      mechanic: item.mechanic ?? '',
      equipment: item.equipment ?? '',
      primaryMuscles: item.primaryMuscles.join(', '),
      secondaryMuscles: item.secondaryMuscles.join(', '),
      instructions: item.instructions.join('\n'),
      category: item.category,
      images: item.images,
      videoUrl: item.videoUrl ?? '',
      active: item.active !== false,
    });
  }, [exercise.data]);

  const imagePreviews = useMemo(() => imageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })), [imageFiles]);
  useEffect(() => () => imagePreviews.forEach((item) => URL.revokeObjectURL(item.url)), [imagePreviews]);

  function field<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function generateId(name: string) {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (imageFiles.some((file) => file.size >= 10 * 1024 * 1024)) {
        throw new Error('Cada imagem deve ter menos de 10 MB.');
      }
      if (imageFiles.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
        throw new Error('Use imagens JPEG, PNG ou WebP.');
      }
      if (videoFile && videoFile.size >= 150 * 1024 * 1024) {
        throw new Error('O vídeo deve ter menos de 150 MB.');
      }
      if (videoFile && !['video/mp4', 'video/webm'].includes(videoFile.type)) {
        throw new Error('Use vídeo MP4 ou WebM.');
      }
      const parsed = exerciseFormSchema.parse({
        id: form.id,
        name: form.name,
        force: form.force || null,
        level: form.level,
        mechanic: form.mechanic || null,
        equipment: form.equipment || null,
        primaryMuscles: splitComma(form.primaryMuscles),
        secondaryMuscles: splitComma(form.secondaryMuscles),
        instructions: form.instructions.split('\n').map((item) => item.trim()).filter(Boolean),
        category: form.category,
        images: form.images,
        videoUrl: form.videoUrl || null,
        active: form.active,
      });
      await saveExercise({ ...parsed, documentId, imageFiles, videoFile });
      await queryClient.invalidateQueries({ queryKey: ['exercises'] });
      navigate('/exercicios');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar o exercício.');
    } finally {
      setSubmitting(false);
    }
  }

  if ((editing && exercise.isLoading) || taxonomies.isLoading) return <LoadingState label="Carregando formulário…" />;
  if ((editing && exercise.isError) || taxonomies.isError) return <ErrorState message="Não foi possível carregar o exercício ou suas opções." />;
  const options = taxonomies.data!;

  return <>
    <PageHeader eyebrow={editing ? 'EDITAR EXERCÍCIO' : 'NOVO EXERCÍCIO'} title={editing ? form.name || 'Editar exercício' : 'Cadastrar exercício'} description="Preencha os dados que serão compartilhados com o aplicativo mobile." actions={<Link to="/exercicios" className="button button-secondary"><ArrowLeft size={18} />Voltar</Link>} />
    <form className="form-layout" onSubmit={handleSubmit}>
      <div className="form-main stack-lg">
        <section className="panel form-section"><div className="section-heading"><span>01</span><div><h2>Informações básicas</h2><p>Identificação e classificação principal do exercício.</p></div></div><div className="form-grid two-columns">
          <label className="field field-wide"><span>Nome do exercício *</span><input value={form.name} onChange={(event) => { const value = event.target.value; field('name', value); if (!editing && !form.id) field('id', generateId(value)); }} maxLength={160} required /></label>
          <label className="field"><span>ID lógico *</span><input value={form.id} onChange={(event) => field('id', event.target.value)} maxLength={160} required /><small>Identificador estável, não use o nome como referência.</small></label>
          <SelectField label="Categoria *" value={form.category} onChange={(value) => field('category', value)} items={options.categorias} required />
          <SelectField label="Nível *" value={form.level} onChange={(value) => field('level', value)} items={options.niveis} required />
          <SelectField label="Equipamento" value={form.equipment} onChange={(value) => field('equipment', value)} items={options.equipamentos} />
          <SelectField label="Força" value={form.force} onChange={(value) => field('force', value)} items={options.forcas} />
          <SelectField label="Mecânica" value={form.mechanic} onChange={(value) => field('mechanic', value)} items={options.mecanicas} />
        </div></section>

        <section className="panel form-section"><div className="section-heading"><span>02</span><div><h2>Músculos e execução</h2><p>Use vírgulas entre músculos e uma linha para cada instrução.</p></div></div><div className="form-grid">
          <label className="field"><span>Músculos principais *</span><input value={form.primaryMuscles} onChange={(event) => field('primaryMuscles', event.target.value)} placeholder="peitoral, tríceps" required /></label>
          <label className="field"><span>Músculos secundários</span><input value={form.secondaryMuscles} onChange={(event) => field('secondaryMuscles', event.target.value)} placeholder="deltoide anterior" /></label>
          <label className="field"><span>Instruções *</span><textarea rows={7} value={form.instructions} onChange={(event) => field('instructions', event.target.value)} placeholder={'Posicione os pés firmemente.\nMantenha a coluna neutra.\nExecute o movimento de forma controlada.'} required /></label>
        </div></section>

        <section className="panel form-section"><div className="section-heading"><span>03</span><div><h2>Imagem e vídeo</h2><p>Adicione demonstrações claras da execução correta.</p></div></div>
          <div className="upload-grid">
            <label className="upload-zone"><ImagePlus /><strong>Adicionar imagens</strong><span>PNG, JPEG ou WebP</span><input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))} /></label>
            <label className="upload-zone"><FileVideo /><strong>Adicionar vídeo</strong><span>MP4 ou WebM</span><input type="file" accept="video/mp4,video/webm" onChange={(event) => setVideoFile(event.target.files?.[0])} /></label>
          </div>
          {(form.images.length > 0 || imagePreviews.length > 0 || form.videoUrl || videoFile) && <div className="media-preview-grid">
            {form.images.map((url) => <figure className="media-preview" key={url}><img src={url} alt="Prévia existente" /><button type="button" className="icon-button danger" onClick={() => field('images', form.images.filter((item) => item !== url))}><Trash2 size={16} /></button></figure>)}
            {imagePreviews.map(({ file, url }) => <figure className="media-preview" key={url}><img src={url} alt={file.name} /><span>{file.name}</span><button type="button" className="icon-button danger" onClick={() => setImageFiles((items) => items.filter((item) => item !== file))}><Trash2 size={16} /></button></figure>)}
            {(form.videoUrl || videoFile) && <div className="media-preview video-preview"><FileVideo /><div><strong>{videoFile?.name ?? 'Vídeo cadastrado'}</strong><small>{videoFile ? `${(videoFile.size / 1024 / 1024).toFixed(1)} MB` : 'Arquivo existente'}</small></div><button type="button" className="icon-button danger" onClick={() => { setVideoFile(undefined); field('videoUrl', ''); }}><Trash2 size={16} /></button></div>}
          </div>}
        </section>
      </div>

      <aside className="form-sidebar"><section className="panel publish-card"><h2>Publicação</h2><label className="toggle-row"><div><strong>Exercício ativo</strong><small>Disponível para novos planos</small></div><input type="checkbox" checked={form.active} onChange={(event) => field('active', event.target.checked)} /></label>{error && <div className="alert alert-error">{error}</div>}<button className="button button-primary button-block" disabled={submitting}><Save size={18} />{submitting ? 'Enviando e salvando…' : 'Salvar exercício'}</button><div className="save-note"><UploadCloud size={16} /><span>A mídia é enviada ao Firebase Storage ao salvar.</span></div></section></aside>
    </form>
  </>;
}

function SelectField({ label, value, onChange, items, required = false }: { label: string; value: string; onChange(value: string): void; items: { id: string; name: string; active: boolean }[]; required?: boolean }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} required={required}><option value="">Selecione…</option>{items.filter((item) => item.active || item.id === value).map((item) => <option value={item.id} key={item.id}>{item.name}{item.active ? '' : ' (inativo)'}</option>)}</select></label>;
}
