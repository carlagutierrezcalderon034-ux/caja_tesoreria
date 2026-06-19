'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, CheckCircle2, AlertTriangle, Clock, BellRing, XCircle, FileWarning, DollarSign, Edit3, Calculator, Lock } from 'lucide-react';
import ArqueoCiegoModal from '@/components/ArqueoCiegoModal';

export default function SupervisionPage() {
  const [alertas, setAlertas] = React.useState({
    cajasSinCerrar: "4",
    cajasSinCerrarDetalle: "Cajas 02, 05, 08, 11",
    diferenciaDinero: "1",
    diferenciaDineroDetalle: "Caja 12 (kisla)",
    foliosPendientes: "12",
    foliosPendientesDetalle: "Caja 04, Caja 07",
    docsAnulados: "3",
    docsAnuladosDetalle: "Caja 07"
  });

  const [cajaArqueo, setCajaArqueo] = useState<number | null>(null);

  useEffect(() => {
    try {
      const auth = localStorage.getItem('auth_session');
      if (!auth || auth === 'null' || auth === '{}') {
        window.location.href = '/login';
        return;
      }
      const s = JSON.parse(auth);
      if (!s || s.role !== 'supervisor') {
        window.location.href = '/login';
      }
    } catch (e) {
      window.location.href = '/login';
    }
  }, []);

  // Generar 18 cajas de prueba con distintos estados, inicializadas en estado
  const [cajas, setCajas] = useState(() => 
    Array.from({ length: 18 }, (_, i) => {
      const id = i + 1;
      let estado = 'Abierta';
      if (id === 3 || id === 7) estado = 'Cerrada - Cuadrada';
      if (id === 12) estado = 'Cerrada - Descuadre';
      if (id > 15) estado = 'Cerrada - Inactiva';

      return {
        id,
        cajero: `Cajero ${String(id).padStart(2, '0')}`,
        estado,
        ingresos: estado.includes('Abierta') ? ((id * 153000) % 500000) + 100000 : 0
      };
    })
  );

  const getStatusColor = (estado: string) => {
    if (estado.includes('Cuadrada')) return 'var(--success-color)';
    if (estado.includes('Descuadre')) return 'var(--danger-color)';
    if (estado === 'Abierta') return 'var(--primary-color)';
    return 'var(--text-muted)';
  };

  const getStatusIcon = (estado: string) => {
    if (estado.includes('Cuadrada')) return <CheckCircle2 size={18} />;
    if (estado.includes('Descuadre')) return <AlertTriangle size={18} />;
    if (estado === 'Abierta') return <Clock size={18} />;
    return <Monitor size={18} />;
  };

  const handleEditOperador = (id: number, currentName: string) => {
    const nuevoNombre = window.prompt(`Cambiar operador de la Caja ${String(id).padStart(2, '0')}:\n(Escriba el nombre o login del nuevo cajero asignado)`, currentName);
    if (nuevoNombre && nuevoNombre.trim() !== '') {
      setCajas(prev => prev.map(c => c.id === id ? { ...c, cajero: nuevoNombre.trim() } : c));
    }
  };

  const handleToggleLock = async (cajaNombre: string) => {
    const username = window.prompt(`🔒 Bloquear / Desbloquear Turno\n\nIngrese el Login del Cajero activo en ${cajaNombre} (ej. cagutier, kisla):`);
    if (!username) return;

    const fecha = new Date().toISOString().split('T')[0];
    
    try {
      const res = await fetch('/api/cierre-turno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cajero_username: username, caja: cajaNombre, fecha, cerrado_por: 'Supervisora' })
      });
      const data = await res.json();
      
      if (res.ok) {
        alert(`🔒 Turno cerrado exitosamente para el cajero "${username}".\nYa no podrá ingresar ni modificar folios hoy.`);
      } else {
        if (data.error === 'Turno ya está cerrado') {
          if (window.confirm(`🔓 El turno de "${username}" ya se encuentra cerrado hoy.\n¿Deseas DESBLOQUEARLO para permitirle hacer modificaciones?`)) {
            await fetch(`/api/cierre-turno?username=${username}&fecha=${fecha}`, { method: 'DELETE' });
            alert('Turno desbloqueado exitosamente.');
          }
        } else {
          alert(`Error: ${data.error}`);
        }
      }
    } catch (e) {
      alert('Error de conexión con el servidor.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', paddingBottom: '40px' }}>
      <header className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)', margin: 0 }}>Supervisión de Cajas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Monitor global de las 18 cajas de la sucursal</p>
        </div>
      </header>

      {/* PANEL DE ALERTAS DE JEFATURA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--warning-color)' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--warning-color)', padding: '12px', borderRadius: '12px' }}>
            <Clock size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="text" 
                value={alertas.cajasSinCerrar}
                onChange={(e) => setAlertas({...alertas, cajasSinCerrar: e.target.value})}
                style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--warning-color)', width: '40px', outline: 'none' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cajas sin cerrar</span>
            </div>
            <input 
              type="text" 
              value={alertas.cajasSinCerrarDetalle}
              onChange={(e) => setAlertas({...alertas, cajasSinCerrarDetalle: e.target.value})}
              placeholder="¿Qué cajas o cajeros?"
              style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--warning-color)', background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(139, 92, 246, 0.4)', width: '100%', outline: 'none' }}
            />
          </div>
          <Edit3 size={14} color="var(--text-muted)" style={{ opacity: 0.5 }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--danger-color)' }}>
          <div style={{ background: 'rgba(211, 47, 47, 0.1)', color: 'var(--danger-color)', padding: '12px', borderRadius: '12px' }}>
            <DollarSign size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="text" 
                value={alertas.diferenciaDinero}
                onChange={(e) => setAlertas({...alertas, diferenciaDinero: e.target.value})}
                style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--danger-color)', width: '40px', outline: 'none' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Descuadres</span>
            </div>
            <input 
              type="text" 
              value={alertas.diferenciaDineroDetalle}
              onChange={(e) => setAlertas({...alertas, diferenciaDineroDetalle: e.target.value})}
              placeholder="Detalle (Ej: Caja 12 kisla)"
              style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--danger-color)', background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(211, 47, 47, 0.4)', width: '100%', outline: 'none' }}
            />
          </div>
          <Edit3 size={14} color="var(--text-muted)" style={{ opacity: 0.5 }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--primary-color)' }}>
          <div style={{ background: 'rgba(25, 118, 210, 0.1)', color: 'var(--primary-color)', padding: '12px', borderRadius: '12px' }}>
            <FileWarning size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="text" 
                value={alertas.foliosPendientes}
                onChange={(e) => setAlertas({...alertas, foliosPendientes: e.target.value})}
                style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--primary-color)', width: '40px', outline: 'none' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Folios Pend.</span>
            </div>
            <input 
              type="text" 
              value={alertas.foliosPendientesDetalle}
              onChange={(e) => setAlertas({...alertas, foliosPendientesDetalle: e.target.value})}
              placeholder="¿De qué cajero?"
              style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--primary-color)', background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(25, 118, 210, 0.4)', width: '100%', outline: 'none' }}
            />
          </div>
          <Edit3 size={14} color="var(--text-muted)" style={{ opacity: 0.5 }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #757575' }}>
          <div style={{ background: 'rgba(117, 117, 117, 0.1)', color: '#757575', padding: '12px', borderRadius: '12px' }}>
            <XCircle size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="text" 
                value={alertas.docsAnulados}
                onChange={(e) => setAlertas({...alertas, docsAnulados: e.target.value})}
                style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', background: 'transparent', border: 'none', borderBottom: '1px dashed #757575', width: '40px', outline: 'none' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Docs Anulados</span>
            </div>
            <input 
              type="text" 
              value={alertas.docsAnuladosDetalle}
              onChange={(e) => setAlertas({...alertas, docsAnuladosDetalle: e.target.value})}
              placeholder="¿Qué cajero anuló?"
              style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#757575', background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(117, 117, 117, 0.4)', width: '100%', outline: 'none' }}
            />
          </div>
          <Edit3 size={14} color="var(--text-muted)" style={{ opacity: 0.5 }} />
        </motion.div>

      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <BellRing size={18} color="var(--primary-color)" />
        <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)', fontWeight: '600' }}>Monitoreo en Tiempo Real</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {cajas.map((caja, idx) => (
          <motion.div
            key={caja.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-panel"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              borderTop: `4px solid ${getStatusColor(caja.estado)}` 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Caja {String(caja.id).padStart(2, '0')}
                <button 
                  onClick={() => handleToggleLock(`Caja ${String(caja.id).padStart(2, '0')}`)}
                  title="Cerrar / Bloquear Turno"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                >
                  <Lock size={16} />
                </button>
              </h3>
              <div style={{ color: getStatusColor(caja.estado) }}>
                {getStatusIcon(caja.estado)}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Operador: <strong style={{color:'var(--text-main)'}}>{caja.cajero}</strong></p>
              <button 
                onClick={() => handleEditOperador(caja.id, caja.cajero)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--primary-color)' }}
                title="Cambiar Operador de Caja"
              >
                <Edit3 size={14} />
              </button>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: '600', color: getStatusColor(caja.estado) }}>{caja.estado}</p>
            
            {caja.estado === 'Abierta' && (
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '8px', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ingresos en turno</p>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>${caja.ingresos.toLocaleString('es-CL')}</p>
                </div>
                <button 
                  onClick={() => setCajaArqueo(caja.id)}
                  className="btn-primary" 
                  style={{ width: '100%', padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--warning-color)', color: 'white', border: 'none' }}
                >
                  <Calculator size={14} /> Arqueo Sorpresa
                </button>
              </div>
            )}
            {caja.estado.includes('Descuadre') && (
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: 'rgba(211, 47, 47, 0.05)', padding: '8px', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger-color)', fontWeight: '600' }}>Requiere revisión de jefatura</p>
                </div>
                <button 
                  onClick={() => setCajaArqueo(caja.id)}
                  className="btn-primary" 
                  style={{ width: '100%', padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--danger-color)', color: 'white', border: 'none' }}
                >
                  <Calculator size={14} /> Re-Contar Billetes
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {cajaArqueo !== null && (
          <ArqueoCiegoModal 
            title={`Arqueo Sorpresa - Caja ${String(cajaArqueo).padStart(2, '0')}`}
            subtitle="Conteo físico de auditoría realizado por Supervisora."
            onConfirm={(total) => {
              alert(`Arqueo realizado con éxito en Caja ${cajaArqueo}.\nTotal contado: $${total.toLocaleString('es-CL')}`);
              setCajaArqueo(null);
            }}
            onClose={() => setCajaArqueo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
