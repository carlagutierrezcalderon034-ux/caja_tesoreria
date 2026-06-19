'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet } from 'lucide-react';

interface GiroModalProps {
  onConfirm: (monto: number) => void;
}

export default function GiroModal({ onConfirm }: GiroModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  // Default to 100000 as per requirements
  const [monto, setMonto] = useState('100000');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (monto && Number(monto) >= 0) {
      setIsOpen(false);
      onConfirm(Number(monto));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.95)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(13, 71, 161, 0.1)', padding: '16px', borderRadius: '50%', color: 'var(--primary-color)' }}>
                <Wallet size={40} />
              </div>
            </div>
            <h2 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--text-main)' }}>Apertura de Caja</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Ingrese el fondo fijo / sencillo inicial. (Base requerida: $100.000)
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Monto de Giro ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Ej: 100000"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  autoFocus
                  required
                  min="0"
                  style={{ fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>
              
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                Iniciar Turno
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
