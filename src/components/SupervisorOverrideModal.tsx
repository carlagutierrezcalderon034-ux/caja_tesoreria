import React, { useState } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SupervisorOverrideModalProps {
  onClose: () => void;
  onSuccess: () => void;
  diferenciaTotal?: number;
  actionType?: 'cierre' | 'password' | 'apertura';
  montoApertura?: number;
}

export default function SupervisorOverrideModal({ onClose, onSuccess, diferenciaTotal = 0, actionType = 'cierre', montoApertura = 0 }: SupervisorOverrideModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuthorize = async () => {
    setError('');
    if (!username || !password) {
      setError('Ingrese usuario y contraseña de Supervisora.');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const user = await res.json();
        if (user.role === 'supervisor') {
          onSuccess();
        } else {
          setError('El usuario ingresado no tiene rol de Supervisora.');
        }
      } else {
        setError('Usuario o contraseña de Supervisora incorrectos.');
      }
    } catch (err) {
      setError('Error validando credenciales.');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel"
        style={{ width: '400px', padding: '32px', background: 'rgba(255,255,255,0.95)', position: 'relative', borderRadius: '16px' }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={24} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(211, 47, 47, 0.1)', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: 'var(--text-main)', textAlign: 'center' }}>Autorización Requerida</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
            {actionType === 'cierre' && (
              <>
                La caja presenta un descuadre total de <strong style={{ color: 'var(--danger-color)' }}>${diferenciaTotal.toLocaleString('es-CL')}</strong>.
                <br/>Se requiere clave de Jefatura para forzar el cierre.
              </>
            )}
            {actionType === 'password' && (
              <>
                Se ha solicitado un <strong style={{ color: 'var(--danger-color)' }}>Cambio de Contraseña</strong>.
                <br/>La Supervisora debe ingresar su clave para autorizar esta acción en el sistema.
              </>
            )}
            {actionType === 'apertura' && (
              <>
                El fondo fijo declarado es de <strong style={{ color: 'var(--warning-color)' }}>${montoApertura.toLocaleString('es-CL')}</strong>.
                <br/>Se requiere clave de Supervisora para autorizar una apertura con fondo irregular.
              </>
            )}
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(211, 47, 47, 0.1)', color: 'var(--danger-color)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label">Usuario Supervisora</label>
          <input 
            type="text" 
            className="form-input" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Ej: karin"
            autoFocus
          />
        </div>

        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label className="form-label">Clave de Supervisora</label>
          <input 
            type="password" 
            className="form-input" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Ingrese clave de Supervisora"
            onKeyDown={e => e.key === 'Enter' && handleAuthorize()}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onClose}
            className="btn-primary" 
            style={{ flex: 1, background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }}
          >
            Cancelar
          </button>
          <button 
            onClick={handleAuthorize}
            className="btn-primary" 
            style={{ flex: 1, background: 'var(--danger-color)', border: 'none', color: 'white' }}
          >
            {actionType === 'cierre' ? 'Autorizar Cierre' : actionType === 'apertura' ? 'Autorizar Apertura' : 'Autorizar Cambio'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
