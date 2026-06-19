'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Settings, Users, Plus, Trash2, ShieldAlert, KeyRound, ShieldCheck, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import SupervisorOverrideModal from '@/components/SupervisorOverrideModal';

export default function ConfigPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  
  // States for user management mock
  const [users, setUsers] = useState<Record<string, { role: string, nombre: string }>>({});
  const [newUsername, setNewUsername] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newRole, setNewRole] = useState('cajero');

  // States for Password Change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showSupervisorAuth, setShowSupervisorAuth] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('auth_session');
    if (!auth) {
      router.push('/login');
      return;
    }
    const s = JSON.parse(auth);
    setSession(s);

    if (s.role === 'supervisor') {
      const db = localStorage.getItem('users_db');
      if (db) {
        setUsers(JSON.parse(db));
      }
    }
  }, [router]);

  // ---- Password Change Logic ----
  const handleRequestPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 4) {
      setErrorMsg('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setShowSupervisorAuth(true);
  };

  const executePasswordChange = async () => {
    setShowSupervisorAuth(false);
    
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.id, newPassword }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg('Contraseña actualizada correctamente con autorización de jefatura.');
        setNewPassword('');
        setConfirmPassword('');
        
        const newSession = { ...session, password: newPassword };
        localStorage.setItem('auth_session', JSON.stringify(newSession));
        
      } else {
        setErrorMsg(data.error || 'Error al actualizar contraseña.');
      }
    } catch (err) {
      setErrorMsg('Error de red. Intente nuevamente.');
    }
  };

  // ---- User Management Logic (Mock) ----
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newNombre) return;

    const key = newUsername.toLowerCase();
    const updatedUsers = {
      ...users,
      [key]: { role: newRole, nombre: newNombre }
    };

    setUsers(updatedUsers);
    localStorage.setItem('users_db', JSON.stringify(updatedUsers));
    setNewUsername('');
    setNewNombre('');
  };

  const removeUser = (username: string) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar al usuario "${username}"?`);
    if (!confirmDelete) return;

    const updatedUsers = { ...users };
    delete updatedUsers[username];
    setUsers(updatedUsers);
    localStorage.setItem('users_db', JSON.stringify(updatedUsers));
  };

  if (!session) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <header className="glass-panel" style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={24} /> Configuración de Cuenta y Sistema
        </h1>
        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', margin: 0, fontWeight: '500' }}>
          Gestiona tus credenciales. Opciones avanzadas solo disponibles para Jefatura.
        </p>
      </header>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Cambiar Contraseña (Visible for everyone) */}
        <div className="glass-panel" style={{ flex: '1 1 350px', background: 'rgba(255,255,255,0.95)', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0', color: 'var(--text-main)' }}>
            <KeyRound size={20} color="var(--accent-color)" /> Cambiar Mi Contraseña
          </h2>
          
          <form onSubmit={handleRequestPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
              <label className="form-label">Nueva Contraseña</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input" 
                  style={{ width: '100%', paddingRight: '40px' }}
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
              <label className="form-label">Confirmar Nueva Contraseña</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-input" 
                  style={{ width: '100%', paddingRight: '40px' }}
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px', background: 'rgba(211, 47, 47, 0.1)', color: 'var(--danger-color)', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '10px', background: 'rgba(0, 200, 83, 0.1)', color: 'var(--success-color)', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                <ShieldCheck size={16} /> {successMsg}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '8px' }}>
              <ShieldAlert size={18} /> Solicitar Cambio (Requiere Autorización)
            </button>
          </form>
        </div>

        {/* Administrar Usuarios (Visible only for Supervisor) */}
        {session.role === 'supervisor' && (
          <div className="glass-panel" style={{ flex: '2 1 450px', background: 'rgba(255,255,255,0.9)', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 20px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Users size={20} color="var(--primary-color)" /> Base de Datos Interna (Mock)
            </h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Usuario</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Nombre Completo</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Rol</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(users).map(([username, data]) => (
                  <tr key={username} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{username}</td>
                    <td style={{ padding: '12px' }}>{data.nombre}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                        background: data.role === 'supervisor' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(13, 71, 161, 0.1)',
                        color: data.role === 'supervisor' ? 'var(--danger-color)' : 'var(--primary-color)'
                      }}>
                        {data.role === 'supervisor' ? 'Jefatura' : 'Cajero'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {data.role !== 'supervisor' && (
                        <button onClick={() => removeUser(username)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSupervisorAuth && (
          <SupervisorOverrideModal 
            diferenciaTotal={0} 
            actionType="password"
            onClose={() => setShowSupervisorAuth(false)} 
            onSuccess={executePasswordChange} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
