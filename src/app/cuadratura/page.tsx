'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Landmark, CheckCircle2, AlertTriangle, FileWarning, Database, Calculator, EyeOff } from 'lucide-react';
import ArqueoCiegoModal from '@/components/ArqueoCiegoModal';
export default function CuadraturaPage() {
  const [activeCajero, setActiveCajero] = useState<string>(''); // Para el modo supervisor
  const [data, setData] = useState({
    giroInicial: 100000,
    sistema: {
      'Efectivo': 0,
      'Débito': 0,
      'Crédito': 0,
      'Cheque': 0,
      'Vale Vista': 0
    },
    foliosSaltados: [] as number[],
    foliosRango: { min: 0, max: 0 }
  });

  const [declarado, setDeclarado] = useState({
    'Efectivo': 0,
    'Débito': 0,
    'Crédito': 0,
    'Cheque': 0,
    'Vale Vista': 0
  });

  const [smc, setSmc] = useState({
    'Efectivo': 0,
    'Débito': 0,
    'Crédito': 0,
    'Cheque': 0,
    'Vale Vista': 0
  });

  const [showDescuadreModal, setShowDescuadreModal] = useState(false);
  const [justificacion, setJustificacion] = useState('');
  const [fechaReposicion, setFechaReposicion] = useState('');
  const [session, setSession] = useState<any>(null);

  const [observaciones, setObservaciones] = useState('');
  const [arqueoRealizado, setArqueoRealizado] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showArqueoModal, setShowArqueoModal] = useState(false);
  const [sencillo, setSencillo] = useState(0);

  useEffect(() => {
    const auth = localStorage.getItem('auth_session');
    if (!auth) {
      window.location.href = '/login';
      return;
    }
    const s = JSON.parse(auth);
    setSession(s);

    const hoy = new Date().toISOString().split('T')[0];
    fetch(`/api/cierre-turno?username=${s.username}&fecha=${hoy}`)
      .then(r => r.json())
      .then(data => setIsLocked(data.locked))
      .catch(e => console.error(e));

    const turnoStr = localStorage.getItem(`turno_${s.username}`);
    let sencilloIncial = 0;
    if (turnoStr) {
      const turno = JSON.parse(turnoStr);
      if (turno.fecha === hoy) {
        sencilloIncial = turno.sencillo;
      }
    }
    setSencillo(sencilloIncial);

    if (s.role !== 'supervisor') {
      setActiveCajero(s.caja);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    
    // El cajero a revisar es activeCajero o la propia caja del usuario
    const targetCaja = activeCajero || session.caja;
    if (!targetCaja) return;

    // Fetch transactions from LocalStorage (persisted by page.tsx)
    const savedRows = localStorage.getItem(`folios_${targetCaja}`);
    let txs = [];
    if (savedRows) {
      txs = JSON.parse(savedRows);
    }

    const sistema = { 'Efectivo': 0, 'Débito': 0, 'Crédito': 0, 'Cheque': 0, 'Vale Vista': 0 };
    let folios: number[] = [];

    txs.forEach((tx: any) => {
      // Map Visa/Mastercard to Crédito for simplification, or keep them as Débito/Crédito based on logic
      let method = tx.medioPago;
      if (method === 'Visa' || method === 'Mastercard') method = 'Crédito';
      
      if (sistema[method as keyof typeof sistema] !== undefined) {
        sistema[method as keyof typeof sistema] += tx.monto;
      }
      if (tx.folio && !isNaN(Number(tx.folio))) {
        folios.push(Number(tx.folio));
      }
    });

    folios.sort((a, b) => a - b);
    let saltados: number[] = [];
    if (folios.length > 0) {
      for (let i = folios[0]; i <= folios[folios.length - 1]; i++) {
        if (!folios.includes(i)) saltados.push(i);
      }
    }

    setData({
      giroInicial: sencillo, 
      sistema,
      foliosSaltados: saltados,
      foliosRango: folios.length > 0 ? { min: folios[0], max: folios[folios.length - 1] } : { min: 0, max: 0 }
    });
    
    // El SMC esperado será el ingreso del sistema + el sencillo inicial (solo si es el cajero, el supervisor asume el sencillo de la caja seleccionada)
    // Extraer sencillo del localStorage para la caja activa
    let targetSencillo = sencillo;
    if (session.role === 'supervisor' && activeCajero) {
      // Si la supervisora eligió un cajero, vemos si ese cajero tiene turno abierto hoy
      const hoy = new Date().toISOString().split('T')[0];
      // Necesitamos el username de ese cajero. Como solo tenemos la caja (Ej: Caja 01), asumiremos 100k si no hay data.
      // O podríamos buscar en users_db. Por ahora 100k por defecto.
      targetSencillo = 100000; 
    }

    const smcMock = { ...sistema };
    smcMock['Efectivo'] += targetSencillo; 
    setSmc(smcMock);
    
    setDeclarado({ ...sistema, 'Efectivo': 0 }); // Require user to input physical cash via Arqueo Ciego
  }, [activeCajero, session, sencillo]);

  const totalSMC = Object.values(smc).reduce((a, b) => a + b, 0);
  const totalDeclarado = Object.values(declarado).reduce((a, b) => a + b, 0);
  
  const diferenciaTotal = totalDeclarado - totalSMC;
  const estaCuadrada = diferenciaTotal === 0;

  const handleCierre = () => {
    if (!estaCuadrada && !justificacion) {
      setShowDescuadreModal(true);
      return;
    }
    alert(estaCuadrada ? 'Caja cerrada y cuadrada exitosamente.' : 'Caja cerrada con descuadre reportado.');
    setShowDescuadreModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', paddingBottom: '40px' }}>
      {/* BANNER DE BLOQUEO DE TURNO */}
      {isLocked && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(139, 92, 246, 0.9)', color: 'white', padding: '16px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--glass-shadow)', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Turno Cerrado por Supervisión</h2>
            <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>Tu jornada ha sido bloqueada. Ya no puedes enviar ni modificar cuadraturas de caja el día de hoy.</p>
          </div>
        </motion.div>
      )}
      <header className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: session?.role === 'supervisor' && activeCajero ? '2px solid #8b5cf6' : 'none' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Cuadratura de Caja {activeCajero && <span style={{ fontSize: '1rem', background: '#8b5cf6', color: 'white', padding: '4px 8px', borderRadius: '8px' }}>{activeCajero}</span>}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Validación de Cierre (Modo Arqueo Ciego)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '8px 16px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--warning-color)', borderRadius: '8px', fontWeight: 'bold' }}>
            Fondo Sencillo: ${sencillo.toLocaleString('es-CL')}
          </div>
          <button 
            className={estaCuadrada ? "btn-success" : "btn-primary"} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: estaCuadrada ? 'var(--success-color)' : 'var(--danger-color)', 
              color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
              opacity: (arqueoRealizado && !isLocked) ? 1 : 0.5, pointerEvents: (arqueoRealizado && !isLocked) ? 'auto' : 'none'
            }} 
            onClick={handleCierre}
          >
            {estaCuadrada ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            {estaCuadrada ? 'Cerrar Caja (Cuadrada)' : 'Cerrar Caja (Descuadre)'}
          </button>
        </div>
      </header>

      {session?.role === 'supervisor' && (
        <div style={{ background: '#f5f3ff', border: '2px solid #8b5cf6', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)' }}>
          <AlertTriangle color="#6d28d9" size={28} />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, color: '#4c1d95', fontSize: '1.1rem', fontWeight: '900' }}>Modo Revisión Activo</h3>
            <p style={{ margin: 0, color: '#111827', fontSize: '0.95rem', fontWeight: '600' }}>Estás verificando la cuadratura de otro cajero. Los datos provienen de sus folios ingresados.</p>
          </div>
          <select 
            className="form-select" 
            value={activeCajero} 
            onChange={e => setActiveCajero(e.target.value)}
            style={{ width: '200px', background: 'white', color: 'black' }}
          >
            <option value="">-- Seleccionar Cajero --</option>
            {Array.from({length: 18}, (_, i) => `Caja ${String(i + 1).padStart(2, '0')}`).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {(!session || (session.role === 'supervisor' && !activeCajero)) ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Landmark size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>Seleccione un cajero para revisar su cuadratura</h3>
        </div>
      ) : (
      <>
        {data.foliosSaltados.length > 0 && (
        <div className="glass-panel" style={{ background: 'rgba(211, 47, 47, 0.1)', border: '1px solid rgba(211,47,47,0.3)', color: 'var(--danger-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FileWarning size={24} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Alerta de Folios Correlativos</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Se detectaron saltos en los folios ingresados (Rango: {data.foliosRango.min} - {data.foliosRango.max}).<br/>
            Folios faltantes: <strong style={{ textDecoration: 'underline', padding: '0 4px' }}>{data.foliosSaltados.join(', ')}</strong>
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'rgba(0, 71, 161, 0.1)', borderRadius: '50%', color: 'var(--primary-color)' }}>
            <Database size={32} />
          </div>
          <div style={{ filter: arqueoRealizado ? 'none' : 'blur(8px)', transition: 'filter 0.5s ease' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Esperado (Sistema + Sencillo)</p>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>${totalSMC.toLocaleString('es-CL')}</h2>
          </div>
          {!arqueoRealizado && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                <EyeOff size={20} /> Arqueo Pendiente
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'rgba(0, 200, 83, 0.1)', borderRadius: '50%', color: 'var(--success-color)' }}>
            <Landmark size={32} />
          </div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Declarado Físicamente</p>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>${totalDeclarado.toLocaleString('es-CL')}</h2>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: !arqueoRealizado ? 'rgba(0,0,0,0.1)' : (estaCuadrada ? 'var(--success-color)' : 'var(--danger-color)'), color: !arqueoRealizado ? 'var(--text-main)' : 'white' }}>
          <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%' }}>
            {estaCuadrada ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
          </div>
          <div>
            <p style={{ margin: 0, color: !arqueoRealizado ? 'var(--text-muted)' : 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Estado de Caja</p>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{!arqueoRealizado ? 'PENDIENTE' : (estaCuadrada ? 'CUADRADA' : 'DESCUADRADA')}</h2>
          </div>
        </motion.div>
      </div>

      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>Cruce de Información SMC vs Físico</h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Medio de Pago</th>
              <th style={{ padding: '12px', color: 'var(--primary-color)' }}>Total Sistema SMC</th>
              <th style={{ padding: '12px', color: 'var(--success-color)' }}>Físico / Terminal Declarado</th>
              <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(smc).map((method) => {
              const smcValue = smc[method as keyof typeof smc];
              const decValue = declarado[method as keyof typeof declarado];
              const diff = decValue - smcValue;

              return (
                <tr key={method} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: '500' }}>
                    {method} {method === 'Efectivo' && <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>(Inc. Fondo)</span>}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', filter: arqueoRealizado ? 'none' : 'blur(6px)', transition: 'filter 0.5s ease' }}>
                      <span style={{ marginRight: '8px' }}>$</span>
                      <input 
                        type="number" 
                        value={smcValue || ''}
                        readOnly
                        style={{ padding: '8px', width: '120px', borderRadius: '4px', border: '1px solid rgba(13, 71, 161, 0.3)', background: 'rgba(13, 71, 161, 0.05)', color: 'var(--text-main)', fontWeight: 'bold' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    {method === 'Efectivo' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)' }}>${decValue.toLocaleString('es-CL')}</span>
                        <button 
                          className="btn-primary" 
                          disabled={isLocked}
                          onClick={() => setShowArqueoModal(true)}
                          style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Calculator size={16} /> Contar Billetes
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>$</span>
                        <input 
                          type="number" 
                          value={declarado[method as keyof typeof declarado] || ''}
                          readOnly
                          style={{ padding: '8px', width: '120px', borderRadius: '4px', border: '1px solid #ccc', background: '#f5f5f5', color: 'var(--text-main)' }}
                        />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 12px', fontWeight: '700', color: !arqueoRealizado ? 'var(--text-muted)' : (diff === 0 ? 'var(--success-color)' : 'var(--danger-color)') }}>
                    {!arqueoRealizado ? '?' : (
                      <>{diff > 0 ? '+' : ''}{diff.toLocaleString('es-CL')}</>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </>
      )}

      <AnimatePresence>
        {showArqueoModal && (
          <ArqueoCiegoModal 
            onClose={() => setShowArqueoModal(false)}
            onConfirm={(total) => {
              setDeclarado({ ...declarado, 'Efectivo': total });
              setArqueoRealizado(true);
              setShowArqueoModal(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDescuadreModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <div className="glass-panel" style={{ width: '500px', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger-color)', marginBottom: '16px' }}>
                <AlertTriangle size={30} />
                <h2 style={{ margin: 0 }}>Justificación de Descuadre SMC</h2>
              </div>
              <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
                Se ha detectado una diferencia de <strong>${diferenciaTotal.toLocaleString('es-CL')}</strong> respecto al sistema SMC. Para proceder, debe justificar la diferencia e indicar fecha de reposición.
              </p>

              <div className="form-group">
                <label className="form-label">Motivo del descuadre</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  placeholder="Ej: Faltante al entregar vuelto..."
                  value={justificacion}
                  onChange={e => setJustificacion(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Fecha de Reposición Compromiso</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={fechaReposicion}
                  onChange={e => setFechaReposicion(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button className="btn-primary" style={{ flex: 1, background: 'transparent', color: 'var(--text-main)', border: '1px solid #ccc' }} onClick={() => setShowDescuadreModal(false)}>Cancelar</button>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1, background: 'var(--danger-color)' }}
                  disabled={!justificacion || !fechaReposicion}
                  onClick={handleCierre}
                >
                  Registrar Descuadre
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
