import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  getPlatformStats,
  listPlatformUsers,
  sendPasswordSetupEmail,
  setPlatformUserDisabled,
  signInOwnerWithEmail,
  signOutOwner,
  subscribeToAuthState,
  type PlatformStats,
  type PlatformUser,
} from '@pedido-listo/firebase';
import './AdminPage.css';

const ADMIN_EMAIL = 'giovanni.vielman@gmail.com';

function authMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (code.includes('too-many-requests')) return 'Demasiados intentos. Espera unos minutos.';
  if (code.includes('user-disabled')) return 'Esta cuenta está deshabilitada.';
  if (code.includes('network-request-failed')) return 'No se pudo conectar. Revisa tu internet.';
  if (code.includes('internal')) return 'No se pudieron cargar todos los datos. Intenta actualizar.';
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}

function dateLabel(value: string | null): string {
  if (!value) return 'Nunca';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(date);
}

function AdminLogin() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const user = await signInOwnerWithEmail(email, password);
      if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
        await signOutOwner();
        throw new Error('Esta cuenta no tiene acceso administrativo.');
      }
    } catch (error) {
      setIsError(true);
      setMessage(authMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function recover() {
    setLoading(true);
    setMessage('');
    try {
      await sendPasswordSetupEmail(ADMIN_EMAIL);
      setIsError(false);
      setMessage(`Enviamos el enlace de recuperación a ${ADMIN_EMAIL}.`);
    } catch (error) {
      setIsError(true);
      setMessage(authMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-login__brand">
        <a href="/" className="admin-logo">PedidoListo</a>
        <div className="admin-login__pitch">
          <span className="admin-kicker">CONTROL DE PLATAFORMA</span>
          <h1>Todo tu negocio.<br />Una sola vista.</h1>
          <p>Usuarios, actividad y operaciones clave, protegidos en un panel privado.</p>
        </div>
        <div className="admin-login__glow" />
      </section>

      <section className="admin-login__form-side">
        <form className="admin-login__card" onSubmit={submit}>
          <div className="admin-login__mark">PL</div>
          <span className="admin-kicker">ACCESO RESTRINGIDO</span>
          <h2>Bienvenido</h2>
          <p className="admin-muted">Ingresa tus credenciales de administrador.</p>

          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              required
            />
          </label>

          {message && <p className={isError ? 'admin-message admin-message--error' : 'admin-message'}>{message}</p>}

          <button className="admin-primary" type="submit" disabled={loading}>
            {loading ? 'Validando…' : 'Entrar al panel'}
          </button>
          <button className="admin-link" type="button" onClick={() => void recover()} disabled={loading}>
            ¿Olvidaste tu contraseña?
          </button>
          <p className="admin-login__security">Conexión protegida por Firebase Authentication</p>
        </form>
      </section>
    </main>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <article className={`admin-stat admin-stat--${tone}`}>
      <span>{label}</span>
      <strong>{value.toLocaleString('es-MX')}</strong>
      <i />
    </article>
  );
}

function AdminDashboard({ user }: { user: User }) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const [statsResult, usersResult] = await Promise.allSettled([
        getPlatformStats(),
        listPlatformUsers(undefined, 50),
    ]);
    if (statsResult.status === 'fulfilled') setStats(statsResult.value);
    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value.users);
      setNextPageToken(usersResult.value.nextPageToken);
    }
    const failure = statsResult.status === 'rejected'
      ? statsResult.reason
      : usersResult.status === 'rejected'
        ? usersResult.reason
        : null;
    if (failure) setError(authMessage(failure));
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((item) =>
      `${item.email} ${item.displayName ?? ''} ${item.uid}`.toLowerCase().includes(term)
    );
  }, [query, users]);

  async function loadMore() {
    if (!nextPageToken) return;
    setLoading(true);
    try {
      const page = await listPlatformUsers(nextPageToken, 50);
      setUsers((current) => [...current, ...page.users]);
      setNextPageToken(page.nextPageToken);
    } catch (loadError) {
      setError(authMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function toggleUser(target: PlatformUser) {
    if (target.isAdmin) return;
    setBusyUid(target.uid);
    setError('');
    try {
      await setPlatformUserDisabled(target.uid, !target.disabled);
      setUsers((current) =>
        current.map((item) =>
          item.uid === target.uid ? { ...item, disabled: !item.disabled } : item
        )
      );
      setStats((current) => current && ({
        ...current,
        activeUsers: current.activeUsers + (target.disabled ? 1 : -1),
        disabledUsers: current.disabledUsers + (target.disabled ? -1 : 1),
      }));
    } catch (toggleError) {
      setError(authMessage(toggleError));
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-logo">PedidoListo</a>
        <nav>
          <a className="active" href="#resumen"><span>◈</span> Resumen</a>
          <a href="#usuarios"><span>◎</span> Usuarios</a>
        </nav>
        <div className="admin-sidebar__account">
          <div>{user.email?.slice(0, 1).toUpperCase()}</div>
          <span><strong>Administrador</strong><small>{user.email}</small></span>
          <button type="button" onClick={() => void signOutOwner()} aria-label="Cerrar sesión">↗</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header" id="resumen">
          <div>
            <span className="admin-kicker">PANEL ADMINISTRATIVO</span>
            <h1>Resumen de plataforma</h1>
            <p>Visibilidad y control de PedidoListo en tiempo real.</p>
          </div>
          <button className="admin-refresh" type="button" onClick={() => void load()} disabled={loading}>
            {loading ? 'Actualizando…' : '↻ Actualizar'}
          </button>
        </header>

        {error && <p className="admin-message admin-message--error">{error}</p>}

        <section className="admin-stats" aria-label="Estadísticas">
          <StatCard label="Usuarios totales" value={stats?.users ?? 0} tone="violet" />
          <StatCard label="Cuentas activas" value={stats?.activeUsers ?? 0} tone="green" />
          <StatCard label="Cuentas deshabilitadas" value={stats?.disabledUsers ?? 0} tone="red" />
          <StatCard label="Negocios" value={stats?.businesses ?? 0} tone="orange" />
          <StatCard label="Pedidos totales" value={stats?.orders ?? 0} tone="blue" />
          <StatCard label="Pedidos entregados" value={stats?.deliveredOrders ?? 0} tone="pink" />
        </section>

        <section className="admin-users" id="usuarios">
          <div className="admin-users__head">
            <div><span className="admin-kicker">GESTIÓN DE CUENTAS</span><h2>Usuarios</h2></div>
            <label className="admin-search">
              <span>⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por correo o UID"
              />
            </label>
          </div>

          <div className="admin-table-wrap">
            <table>
              <thead><tr><th>Usuario</th><th>Negocios</th><th>Registro</th><th>Último acceso</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {filteredUsers.map((item) => (
                  <tr key={item.uid}>
                    <td>
                      <div className="admin-user">
                        <span>{item.email.slice(0, 1).toUpperCase()}</span>
                        <div><strong>{item.displayName || item.email}</strong><small>{item.displayName ? item.email : item.uid}</small></div>
                      </div>
                    </td>
                    <td>{item.businesses}</td>
                    <td>{dateLabel(item.createdAt)}</td>
                    <td>{dateLabel(item.lastSignInAt)}</td>
                    <td><span className={item.disabled ? 'admin-status admin-status--off' : 'admin-status'}>{item.disabled ? 'Deshabilitada' : 'Activa'}</span></td>
                    <td>
                      <button
                        className={item.disabled ? 'admin-toggle admin-toggle--enable' : 'admin-toggle'}
                        type="button"
                        disabled={item.isAdmin || busyUid === item.uid}
                        onClick={() => void toggleUser(item)}
                        title={item.isAdmin ? 'La cuenta administradora está protegida' : undefined}
                      >
                        {busyUid === item.uid ? 'Guardando…' : item.disabled ? 'Habilitar' : 'Deshabilitar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredUsers.length === 0 && <p className="admin-empty">No se encontraron usuarios.</p>}
          </div>

          {nextPageToken && !query && (
            <button className="admin-more" type="button" onClick={() => void loadMore()} disabled={loading}>
              {loading ? 'Cargando…' : 'Cargar más usuarios'}
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

export function AdminPage() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    document.title = 'Administración | PedidoListo';
    return subscribeToAuthState((nextUser) => {
      setUser(nextUser?.email?.toLowerCase() === ADMIN_EMAIL ? nextUser : null);
      setAuthReady(true);
      if (nextUser && nextUser.email?.toLowerCase() !== ADMIN_EMAIL) void signOutOwner();
    });
  }, []);

  if (!authReady) return <div className="admin-loading">Cargando panel…</div>;
  return user ? <AdminDashboard user={user} /> : <AdminLogin />;
}
