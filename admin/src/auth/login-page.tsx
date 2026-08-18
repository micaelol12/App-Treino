import { Dumbbell, LockKeyhole } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from './auth-context';

export function LoginPage() {
  const { signIn, status, user, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch {
      setError('Não foi possível entrar. Confira e-mail, senha e permissão administrativa.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Apresentação">
        <div className="brand-mark"><Dumbbell size={28} /></div>
        <p className="eyebrow">APP TREINO</p>
        <h1>Controle completo para um treino melhor.</h1>
        <p>Administre o catálogo, os equipamentos e a operação do aplicativo em um só lugar.</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-icon"><LockKeyhole size={22} /></div>
          <p className="eyebrow">ACESSO RESTRITO</p>
          <h2>Painel administrativo</h2>
          <p className="muted">Use uma conta com permissão de administrador.</p>

          {status === 'forbidden' && user ? (
            <div className="alert alert-error">
              <span>Esta conta não possui a permissão <code>admin</code>.</span>
              <button className="button button-secondary" type="button" onClick={() => void signOut()}>
                Trocar conta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="stack-lg">
              <label className="field">
                <span>E-mail</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label className="field">
                <span>Senha</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              {error && <div className="alert alert-error">{error}</div>}
              <button className="button button-primary button-block" disabled={submitting || status === 'loading'}>
                {submitting ? 'Entrando…' : 'Entrar no painel'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
