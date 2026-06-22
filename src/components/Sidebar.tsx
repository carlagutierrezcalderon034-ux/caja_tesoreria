'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Receipt, Settings, LogOut, Wallet, FileBarChart, PiggyBank, BellRing } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<{username: string, caja: string, role?: string, nombre?: string} | null>(null);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    let auth = localStorage.getItem('auth_session');
    
    // Parche definitivo para reemplazar Carlos por Carla en la sesión activa
    if (auth && auth.includes('Carlos')) {
      auth = auth.replace(/Carlos/g, 'Carla');
      localStorage.setItem('auth_session', auth);
    }

    if (auth) {
      try {
        const parsedSession = JSON.parse(auth);
        setSession(parsedSession);
        
        // Simular lógica de recordatorio si es supervisor (ej. viernes sin reporte)
        if (parsedSession.role === 'supervisor') {
          const today = new Date().getDay();
          if (today === 5 || today === 6) { // Viernes o Sábado
            setShowReminder(true);
          }
        }
      } catch (e) {
        console.error('Error parsing session:', e);
        localStorage.removeItem('auth_session');
      }
    } else {
      // Si no hay sesión, puedes redirigir o mantener valores por defecto
    }
  }, [pathname]);

  const navItems = [
    { name: 'Digitación Nómina', path: '/', icon: Receipt, roles: ['cajero', 'supervisor'] },
    { name: 'Supervisión', path: '/supervision', icon: LayoutDashboard, roles: ['supervisor'] },
    { name: 'Ingreso Depósitos', path: '/depositos', icon: PiggyBank, roles: ['supervisor'] },
    { name: 'Reportes y Análisis', path: '/reportes', icon: FileBarChart, roles: ['supervisor'] },
    { name: 'Configuración', path: '/config', icon: Settings, roles: ['cajero', 'supervisor'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!session) {
      // Por defecto muestra solo los básicos si la sesión no ha cargado aún
      return item.roles.includes('cajero');
    }
    return item.roles.includes(session.role || 'cajero');
  });

  const handleLogout = () => {
    try {
      if (session) {
        localStorage.removeItem(`turno_${session.username}`);
      }
      localStorage.removeItem('auth_session');
    } catch (e) {
      console.error('Error clearing localStorage', e);
    }
    window.location.assign('/login');
  };

  return (
    <aside className="sidebar" style={{ width: '280px', borderRadius: '0 24px 24px 0', margin: 0, height: '100vh', borderRight: '1px solid rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(13, 71, 161, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)', zIndex: 50 }}>
      <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <img src="/logo-maipu.png" alt="Logo Maipú" style={{ width: '120px', objectFit: 'contain' }} />
          </div>

        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '16px', borderRadius: '16px', marginBottom: '24px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
            {session ? (session.role === 'supervisor' ? 'Supervisora General' : 'Operador Activo') : 'Sesión Cerrada'}
          </p>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'white' }}>{session?.nombre || session?.username || 'Inicie Sesión'}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
            {session ? (session.role === 'supervisor' ? 'Oficina Central' : `Caja: ${session.caja || '---'}`) : '---'}
          </p>
        </div>

        {session?.role === 'supervisor' && showReminder && (
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid var(--warning-color)', padding: '12px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <BellRing color="var(--warning-color)" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>Recordatorio</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                No olvides generar y descargar el reporte de depósitos semanal.
              </p>
            </div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? '600' : '400',
              }}>
                <item.icon size={20} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.7)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', padding: '12px', borderRadius: '8px', transition: 'all 0.2s' }}>
          <LogOut size={20} />
          <span style={{ fontWeight: '500' }}>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
