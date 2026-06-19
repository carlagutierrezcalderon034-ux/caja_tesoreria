'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, X, Save } from 'lucide-react';

interface ArqueoCiegoModalProps {
  onClose?: () => void;
  onConfirm: (total: number) => void;
  initialTotal?: number;
  title?: string;
  subtitle?: string;
}

export default function ArqueoCiegoModal({ onClose, onConfirm, title = "Arqueo Ciego: Conteo Físico", subtitle = "Ingrese la cantidad de billetes y monedas disponibles en su gaveta." }: ArqueoCiegoModalProps) {
  // Billetes
  const [b20k, setB20k] = useState(0);
  const [b10k, setB10k] = useState(0);
  const [b5k, setB5k] = useState(0);
  const [b2k, setB2k] = useState(0);
  const [b1k, setB1k] = useState(0);

  // Monedas
  const [m500, setM500] = useState(0);
  const [m100, setM100] = useState(0);
  const [m50, setM50] = useState(0);
  const [m10, setM10] = useState(0);

  const [total, setTotal] = useState(0);

  useEffect(() => {
    const sum = 
      (b20k * 20000) + 
      (b10k * 10000) + 
      (b5k * 5000) + 
      (b2k * 2000) + 
      (b1k * 1000) + 
      (m500 * 500) + 
      (m100 * 100) + 
      (m50 * 50) + 
      (m10 * 10);
    setTotal(sum);
  }, [b20k, b10k, b5k, b2k, b1k, m500, m100, m50, m10]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(total);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      e.target.select();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div className="glass-panel" style={{ width: '800px', background: 'white', padding: '32px', position: 'relative' }}>
        {onClose && (
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(13, 71, 161, 0.1)', borderRadius: '12px', color: 'var(--primary-color)' }}>
            <Calculator size={32} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>{title}</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '40px' }}>
            {/* BILLETES */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-main)', borderBottom: '2px solid var(--success-color)', paddingBottom: '8px' }}>Billetes</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: '600' }}>$20.000</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>x</span>
                    <input type="number" min="0" value={b20k} onFocus={handleFocus} onChange={e => setB20k(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '80px', textAlign: 'center' }} />
                    <span style={{ width: '100px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>${(b20k * 20000).toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: '600' }}>$10.000</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>x</span>
                    <input type="number" min="0" value={b10k} onFocus={handleFocus} onChange={e => setB10k(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '80px', textAlign: 'center' }} />
                    <span style={{ width: '100px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>${(b10k * 10000).toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: '600' }}>$5.000</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>x</span>
                    <input type="number" min="0" value={b5k} onFocus={handleFocus} onChange={e => setB5k(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '80px', textAlign: 'center' }} />
                    <span style={{ width: '100px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>${(b5k * 5000).toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: '600' }}>$2.000</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>x</span>
                    <input type="number" min="0" value={b2k} onFocus={handleFocus} onChange={e => setB2k(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '80px', textAlign: 'center' }} />
                    <span style={{ width: '100px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>${(b2k * 2000).toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: '600' }}>$1.000</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>x</span>
                    <input type="number" min="0" value={b1k} onFocus={handleFocus} onChange={e => setB1k(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '80px', textAlign: 'center' }} />
                    <span style={{ width: '100px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>${(b1k * 1000).toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MONEDAS */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-main)', borderBottom: '2px solid var(--accent-color)', paddingBottom: '8px' }}>Monedas</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: '600' }}>$500</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>x</span>
                    <input type="number" min="0" value={m500} onFocus={handleFocus} onChange={e => setM500(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '80px', textAlign: 'center' }} />
                    <span style={{ width: '100px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>${(m500 * 500).toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: '600' }}>$100</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>x</span>
                    <input type="number" min="0" value={m100} onFocus={handleFocus} onChange={e => setM100(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '80px', textAlign: 'center' }} />
                    <span style={{ width: '100px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>${(m100 * 100).toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: '600' }}>$50</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>x</span>
                    <input type="number" min="0" value={m50} onFocus={handleFocus} onChange={e => setM50(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '80px', textAlign: 'center' }} />
                    <span style={{ width: '100px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>${(m50 * 50).toLocaleString('es-CL')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontWeight: '600' }}>$10</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>x</span>
                    <input type="number" min="0" value={m10} onFocus={handleFocus} onChange={e => setM10(parseInt(e.target.value) || 0)} className="form-input" style={{ width: '80px', textAlign: 'center' }} />
                    <span style={{ width: '100px', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>${(m10 * 10).toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(13, 71, 161, 0.05)', borderRadius: '12px', padding: '24px', marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Calculado</p>
              <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--primary-color)' }}>${total.toLocaleString('es-CL')}</h2>
            </div>
            
            <button type="submit" className="btn-primary" style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '16px 32px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Save size={24} /> Confirmar Arqueo Físico
            </button>
          </div>
        </form>

      </div>
    </motion.div>
  );
}
