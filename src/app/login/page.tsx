'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Lock, User, Monitor, AlertCircle, Eye, EyeOff, Edit2, Shield, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // States
  const [username, setUsername] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [caja, setCaja] = useState('');
  const [role, setRole] = useState('cajero');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!username || !password) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || 'Usuario o contraseña incorrectos');
        setLoading(false);
        return;
      }

      const userFound = await res.json();

      localStorage.setItem('auth_session', JSON.stringify({ 
        id: userFound.id,
        username: userFound.username, 
        caja: userFound.role === 'supervisor' ? 'Oficina' : caja,
        role: userFound.role,
        nombre: userFound.nombre
      }));
      if (userFound.role === 'supervisor') {
        router.push('/supervision');
      } else {
        // Guardar en la BD que este cajero está en esta caja
        try {
          await fetch('/api/turnos-activos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caja, username: userFound.username, nombre: userFound.nombre })
          });
        } catch (e) {
          console.error('Error reportando turno activo');
        }
        router.push('/');
      }
    } catch (err) {
      setError('Error conectando a la base de datos');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!username || !password || !nombre) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nombre, role })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || 'Error al crear el usuario');
        setLoading(false);
        return;
      }

      setSuccess('¡Usuario creado con éxito! Ahora puedes Iniciar Sesión.');
      setIsRegistering(false);
      setPassword(''); // Limpiamos la clave por seguridad
      setLoading(false);
    } catch (err) {
      setError('Error conectando a la base de datos');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', minHeight: '100vh',
      background: 'transparent'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ width: '400px', padding: '40px', background: 'rgba(255,255,255,0.85)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', height: '64px', background: 'var(--primary-color)', borderRadius: '16px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white', fontSize: '1.5rem', fontWeight: 'bold'
          }}>
            M
          </div>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 8px 0', color: 'var(--primary-color)' }}>Tesorería Maipú</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{isRegistering ? 'Creación de Usuarios' : 'Sistema de Cuadratura y Auditoría'}</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(211, 47, 47, 0.1)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(0, 200, 83, 0.1)', color: 'var(--success-color)', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> Usuario (Login)
            </label>
            <input 
              type="text" 
              className="form-input" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <AnimatePresence>
            {isRegistering && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Edit2 size={16} /> Nombre y Apellido Completo
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)} 
                    required={isRegistering}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} /> Rol del Usuario
                  </label>
                  <select 
                    className="form-select" 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="cajero">Cajero/a</option>
                    <option value="supervisor">Supervisora/Jefatura</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={16} /> Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', boxSizing: 'border-box', paddingRight: '40px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '8px', top: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isRegistering && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={16} /> N° de Caja (Solo Cajeros)
              </label>
              <select 
                className="form-select" 
                value={caja} 
                onChange={e => setCaja(e.target.value)} 
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">Seleccione una Caja</option>
                {Array.from({ length: 15 }, (_, i) => `Caja ${String(i + 1).padStart(2, '0')}`).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Caja 16 (1° Juzgado)">Caja 16 (1° Juzgado)</option>
                <option value="Caja 17 (2° Juzgado)">Caja 17 (2° Juzgado)</option>
                <option value="Caja 18 (3° Juzgado)">Caja 18 (3° Juzgado)</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ marginTop: '12px', padding: '14px', fontSize: '1.1rem' }}
            disabled={loading}
          >
            {loading ? 'Procesando...' : (isRegistering ? 'Crear Usuario' : 'Iniciar Sesión')}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button 
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión aquí' : '¿No tienes cuenta? Registrar Nuevo Cajero'}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
