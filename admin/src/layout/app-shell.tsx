import {
  Activity,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../auth/auth-context';

const navigation = [
  { to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/usuarios', label: 'Usuários', icon: Users },
  { to: '/exercicios', label: 'Exercícios', icon: Dumbbell },
  { to: '/equipamentos', label: 'Equipamentos', icon: Package },
];

export function AppShell() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark brand-mark-small"><Activity size={22} /></div>
          <div><strong>App Treino</strong><span>Admin</span></div>
          <button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{(user?.email?.[0] ?? 'A').toUpperCase()}</div>
          <div className="sidebar-user-copy"><strong>Administrador</strong><span>{user?.email}</span></div>
          <button className="icon-button" onClick={() => void signOut()} aria-label="Sair"><LogOut size={18} /></button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <span className="topbar-label">PAINEL ADMINISTRATIVO</span>
          <span className="status-dot"><i /> Sistema conectado</span>
        </header>
        <main className="content"><Outlet /></main>
      </div>
      {open && <button className="sidebar-backdrop" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
    </div>
  );
}
