'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { PiggyBank, Save, User, ShieldCheck, Building2 } from 'lucide-react';

export default function DepositosPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [activeCajero, setActiveCajero] = useState<string>('');
  const [usernameCajero, setUsernameCajero] = useState<string>('');
  const [empresaRecaudadora, setEmpresaRecaudadora] = useState<string>('Prosegur');
  const [customEmpresa, setCustomEmpresa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const auth = localStorage.getItem('auth_session');
    if (!auth) {
      router.push('/login');
    } else {
      const s = JSON.parse(auth);
      if (s.role !== 'supervisor') {
        router.push('/'); // Solo supervisoras pueden acceder
      }
      setSession(s);
    }
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCajero) {
      alert("Debes seleccionar una Caja de origen.");
      return;
    }
    if (!usernameCajero.trim()) {
      alert("Debes ingresar el login del cajero.");
      return;
    }
    if (total === 0) {
      alert("El monto total del depósito no puede ser cero.");
      return;
    }
    
    setIsSubmitting(true);
    const empresaFinal = empresaRecaudadora === 'Otra' ? customEmpresa : empresaRecaudadora;

    try {
      const res = await fetch('/api/depositos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caja: activeCajero,
          cajero_username: usernameCajero.trim(),
          empresa_recaudadora: empresaFinal,
          total_depositado: total,
          desglose_billetes: { b20k, b10k, b5k, b2k, b1k, m500, m100, m50, m10 }
        })
      });

      if (res.ok) {
        alert("Depósito guardado correctamente.");
        // Reset form
        setB20k(0); setB10k(0); setB5k(0); setB2k(0); setB1k(0);
        setM500(0); setM100(0); setM50(0); setM10(0);
        setActiveCajero('');
        setUsernameCajero('');
      } else {
        alert("Error al guardar el depósito.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al guardar el depósito.");
    }
    setIsSubmitting(false);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      e.target.select();
    }
  };

  if (!session || session.role !== 'supervisor') return null;

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingRight: '12px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PiggyBank size={32} /> Ingreso de Depósitos Físicos
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
            Registre los retiros de efectivo por caja hacia empresas de transporte de valores.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* PANEL DE CONFIGURACIÓN DEL DEPÓSITO */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} /> Caja y Cajero de Origen
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                className="form-select" 
                value={activeCajero} 
                onChange={e => setActiveCajero(e.target.value)}
                style={{ width: '140px', padding: '12px', fontSize: '1.1rem' }}
                required
              >
                <option value="">-- Caja --</option>
                {Array.from({length: 18}, (_, i) => `Caja ${String(i + 1).padStart(2, '0')}`).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              
              <input 
                type="text" 
                className="form-input" 
                placeholder="Login del Cajero (ej. cagutier)" 
                value={usernameCajero}
                onChange={e => setUsernameCajero(e.target.value)}
                style={{ flex: 1, padding: '12px', fontSize: '1.1rem' }}
                required
              />
            </div>
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <label style={{ marginBottom: '8px', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} /> Empresa Recaudadora
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                className="form-select" 
                value={empresaRecaudadora} 
                onChange={e => setEmpresaRecaudadora(e.target.value)}
                style={{ flex: 1, padding: '12px', fontSize: '1.1rem' }}
              >
                <option value="Prosegur">Prosegur</option>
                <option value="Brinks">Brinks</option>
                <option value="Loomis">Loomis</option>
                <option value="Valores Central">Valores Central</option>
                <option value="Otra">Otra (Especificar)</option>
              </select>
              {empresaRecaudadora === 'Otra' && (
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nombre de empresa" 
                  value={customEmpresa}
                  onChange={e => setCustomEmpresa(e.target.value)}
                  style={{ flex: 1 }}
                  required
                />
              )}
            </div>
          </div>
        </div>

        {/* CALCULADORA DE BILLETES */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(13, 71, 161, 0.1)', borderRadius: '12px', color: 'var(--primary-color)' }}>
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>Desglose de Efectivo</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Ingrese la cantidad exacta de billetes y monedas entregados en el empaque.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {/* BILLETES */}
            <div style={{ flex: '1 1 300px' }}>
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
            <div style={{ flex: '1 1 300px' }}>
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

          <div style={{ background: 'var(--primary-color)', borderRadius: '12px', padding: '32px', marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 32px rgba(13, 71, 161, 0.3)' }}>
            <div>
              <p style={{ margin: 0, fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)' }}>Total a Depositar</p>
              <h2 style={{ margin: 0, fontSize: '3rem', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                ${total.toLocaleString('es-CL')}
              </h2>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting || total === 0}
              className="btn-primary" 
              style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '12px 24px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', opacity: (isSubmitting || total === 0) ? 0.5 : 1 }}
            >
              <Save size={20} /> {isSubmitting ? 'Guardando...' : 'Guardar y Sellar Depósito'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
