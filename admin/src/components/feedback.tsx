import { AlertTriangle, Inbox } from 'lucide-react';

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return <div className="panel-state"><div className="spinner" /><span>{label}</span></div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="panel-state"><Inbox /><strong>{title}</strong><span>{description}</span></div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="panel-state panel-error"><AlertTriangle /><strong>Não foi possível carregar</strong><span>{message}</span></div>;
}
