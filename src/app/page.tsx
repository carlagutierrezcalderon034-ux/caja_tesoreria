'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FileText, AlertTriangle, CheckCircle2, Calculator, Trash2, Plus, Zap, X, Printer, Pencil, Save } from 'lucide-react';
import ArqueoCiegoModal from '@/components/ArqueoCiegoModal';
import SupervisorOverrideModal from '@/components/SupervisorOverrideModal';

const BANCOS_CHILE = [
  'BancoEstado',
  'Banco de Chile / Edwards',
  'Banco Santander',
  'Banco BCI',
  'Banco Itaú',
  'Scotiabank',
  'Banco Falabella',
  'Banco Ripley',
  'Banco Security',
  'Banco Consorcio',
  'Banco BICE',
  'Banco Internacional'
];

type NominaRow = {
  id: string;
  giro: number;
  folio: number;
  monto: number;
  medioPago: string;
  autorizacion?: string;
  corrido: boolean;
};

type DocumentoFisico = {
  id: string;
  banco: string;
  numeroDocumento: string;
  monto: number;
};

export default function AuditoriaNomina() {
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [activeCajero, setActiveCajero] = useState<string>(''); // Para el modo supervisor
  const [rows, setRows] = useState<NominaRow[]>([]);
  const [turnoAbierto, setTurnoAbierto] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    try {
      const auth = localStorage.getItem('auth_session');
      if (!auth || auth === 'null' || auth === '{}') {
        window.location.assign('/login');
        return;
      }
      
      const s = JSON.parse(auth);
      if (!s || (!s.username && !s.role)) {
        window.location.assign('/login');
        return;
      }
      
      setSession(s);
      
      // Chequear si el turno de hoy está abierto (solo para cajeros)
      if (s.role !== 'supervisor') {
        const hoy = new Date().toISOString().split('T')[0];
        const turnoStr = localStorage.getItem(`turno_${s.username}`);
        if (turnoStr) {
          const turno = JSON.parse(turnoStr);
          if (turno.fecha === hoy) {
            setTurnoAbierto(true);
          } else {
            setShowTurnoModal(true);
          }
        } else {
          setShowTurnoModal(true);
        }
        setActiveCajero(s.caja); // El cajero siempre usa su propia caja
        
        // Cargar folios desde localStorage para persistencia
        const savedRows = localStorage.getItem(`folios_${s.caja}`);
        if (savedRows) {
          setRows(JSON.parse(savedRows));
        }
      } else {
        // Si es supervisor, asume que el turno está abierto automáticamente para que pueda navegar sin bloqueos
        setTurnoAbierto(true);
        setActiveCajero(''); // Por defecto no selecciona ninguno
      }
    } catch (e) {
      window.location.assign('/login');
    }
  }, [router]);

  // Cada vez que cambien las rows, las guardamos en localStorage para persistencia temporal
  useEffect(() => {
    if (activeCajero) {
      localStorage.setItem(`folios_${activeCajero}`, JSON.stringify(rows));
    }
  }, [rows, activeCajero]);

  useEffect(() => {
    const checkLock = async () => {
      if (!session || session.role === 'supervisor') return;
      const hoy = new Date().toISOString().split('T')[0];
      try {
        const res = await fetch(`/api/cierre-turno?username=${session.username}&fecha=${hoy}`);
        const data = await res.json();
        setIsLocked(data.locked);
      } catch (e) {
        console.error("Error verificando cierre de turno");
      }
    };
    checkLock();
  }, [session]);

  // Al cambiar de cajero en modo supervisor, cargar los folios de ese cajero
  const handleSelectCajero = (caja: string) => {
    setActiveCajero(caja);
    if (!caja) {
      setRows([]);
      return;
    }
    const savedRows = localStorage.getItem(`folios_${caja}`);
    setRows(savedRows ? JSON.parse(savedRows) : []);
  };

  const [showTurnoModal, setShowTurnoModal] = useState(false);
  const [showSupervisorAuth, setShowSupervisorAuth] = useState(false);
  const [sencilloTemporal, setSencilloTemporal] = useState(0);

  const confirmarApertura = (monto: number) => {
    const hoy = new Date().toISOString().split('T')[0];
    localStorage.setItem(`turno_${session.username}`, JSON.stringify({ fecha: hoy, sencillo: monto }));
    setTurnoAbierto(true);
    setShowTurnoModal(false);
    setShowSupervisorAuth(false);
  };

  const handleArqueoSencillo = (total: number) => {
    if (total === 100000) {
      confirmarApertura(total);
    } else {
      setSencilloTemporal(total);
      setShowTurnoModal(false); // Escondemos el contador
      setShowSupervisorAuth(true); // Y pedimos la clave
    }
  };
  
  // Input states
  const [giro, setGiro] = useState('');
  const [folio, setFolio] = useState('');
  const [monto, setMonto] = useState('');
  
  // Tab states
  const [activeTab, setActiveTab] = useState('Efectivo');
  const [tipoTarjeta, setTipoTarjeta] = useState('Débito');
  const [viewMode, setViewMode] = useState<'all' | 'tab'>('all'); // Por defecto ver todos los folios para revisar correlatividad

  // Bulk Entry States
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkQty, setBulkQty] = useState('4');
  const [bulkGiro, setBulkGiro] = useState('');
  const [bulkFolio, setBulkFolio] = useState('');
  const [bulkMonto, setBulkMonto] = useState('');
  const [bulkMedioPago, setBulkMedioPago] = useState('Efectivo');
  const [smartPromptDismissed, setSmartPromptDismissed] = useState(false);

  // Smart Detection (Regla de 3)
  useEffect(() => {
    if (rows.length >= 3 && !smartPromptDismissed) {
      const last3 = rows.slice(-3);
      
      const isConsecutiveFolio = (r1: NominaRow, r2: NominaRow) => parseInt(r2.folio as any) === parseInt(r1.folio as any) + 1;
      const sameMedioPago = (r1: NominaRow, r2: NominaRow) => r1.medioPago === r2.medioPago;

      if (isConsecutiveFolio(last3[0], last3[1]) && isConsecutiveFolio(last3[1], last3[2]) &&
          sameMedioPago(last3[0], last3[1]) && sameMedioPago(last3[1], last3[2])) {
        
        setBulkGiro((parseInt(last3[2].giro as any) + 1).toString());
        setBulkFolio((parseInt(last3[2].folio as any) + 1).toString());
        setBulkMonto(last3[2].monto.toString());
        setBulkMedioPago(last3[2].medioPago);
        setShowBulkModal(true);
        setSmartPromptDismissed(true);
      }
    }
  }, [rows, smartPromptDismissed]);

  const handleBulkInsert = async () => {
    const qty = parseInt(bulkQty);
    if (!qty || qty <= 0 || !bulkGiro || !bulkFolio || !bulkMonto) return;

    const newRows = [];
    for (let i = 0; i < qty; i++) {
      newRows.push({
        giro: parseInt(bulkGiro) + i,
        folio: parseInt(bulkFolio) + i,
        monto: parseFloat(bulkMonto),
        medioPago: bulkMedioPago,
        caja: activeCajero,
        userId: session.id
      });
    }

    try {
      const res = await fetch('/api/nomina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRows)
      });
      if (res.ok) {
        const created = await res.json();
        setRows([...rows, ...created]);
        setShowBulkModal(false);
        setGiro((parseInt(bulkGiro) + qty).toString());
        setFolio((parseInt(bulkFolio) + qty).toString());
      }
    } catch (e) { console.error(e); }
  };

  // Audit (Right Panel) states
  const [cierreTransbank, setCierreTransbank] = useState('');
  const [efectivoFisico, setEfectivoFisico] = useState('');
  
  // Fisicos Check/Vale
  const [chequesFisicos, setChequesFisicos] = useState<DocumentoFisico[]>([]);
  const [valesFisicos, setValesFisicos] = useState<DocumentoFisico[]>([]);

  // Temp states for adding document to Audit
  const [tempBancoCheque, setTempBancoCheque] = useState(BANCOS_CHILE[0]);
  const [tempDocCheque, setTempDocCheque] = useState('');
  const [tempMontoCheque, setTempMontoCheque] = useState('');

  const [tempBancoVale, setTempBancoVale] = useState(BANCOS_CHILE[0]);
  const [tempDocVale, setTempDocVale] = useState('');
  const [tempMontoVale, setTempMontoVale] = useState('');

  const [autorizacion, setAutorizacion] = useState('');

  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giro || !folio || !monto || !session) return;

    const numGiro = parseInt(giro);
    const numFolio = parseInt(folio);
    const numMonto = parseInt(monto);

    let isCorrido = false;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      if (numFolio - lastRow.folio !== 1) {
        isCorrido = true;
      }
    }

    const medioActual = activeTab === 'Tarjetas' ? tipoTarjeta : activeTab;

    const rowData = {
      giro: numGiro,
      folio: numFolio,
      monto: numMonto,
      medioPago: medioActual,
      autorizacion: (activeTab === 'Tarjetas' || activeTab === 'Cheque' || activeTab === 'Vale Vista') ? autorizacion : undefined,
      corrido: isCorrido,
      caja: activeCajero,
      userId: session.id
    };

    try {
      const res = await fetch('/api/nomina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData)
      });
      const newRow = { ...rowData, id: Date.now().toString() };
      setRows([...rows, newRow]);
      setGiro((numGiro + 1).toString());
      setFolio((numFolio + 1).toString());
      setMonto('');
      setAutorizacion('');
    } catch (e) { 
      // Fallback local si falla la BD
      const newRow = { ...rowData, id: Date.now().toString() };
      setRows([...rows, newRow]);
      setGiro((numGiro + 1).toString());
      setFolio((numFolio + 1).toString());
      setMonto('');
      setAutorizacion('');
    }
  };

  const removeRow = async (id: string) => {
    try {
      await fetch(`/api/nomina/${id}`, { method: 'DELETE' });
      setRows(rows.filter(r => r.id !== id));
    } catch (e) { console.error(e); }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ giro: '', folio: '', monto: '', autorizacion: '' });

  const saveEdit = async (id: string) => {
    try {
      const updateData = {
        giro: parseInt(editForm.giro),
        folio: parseInt(editForm.folio),
        monto: parseInt(editForm.monto),
        autorizacion: editForm.autorizacion
      };
      const res = await fetch(`/api/nomina/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        const updated = await res.json();
        setRows(rows.map(r => r.id === id ? updated : r));
        setEditingId(null);
      }
    } catch (e) { console.error(e); }
  };

  const addChequeFisico = () => {
    if (tempDocCheque && tempMontoCheque) {
      setChequesFisicos([...chequesFisicos, { id: Date.now().toString(), banco: tempBancoCheque, numeroDocumento: tempDocCheque, monto: parseInt(tempMontoCheque) }]);
      setTempDocCheque(''); setTempMontoCheque('');
    }
  };

  const addValeFisico = () => {
    if (tempDocVale && tempMontoVale) {
      setValesFisicos([...valesFisicos, { id: Date.now().toString(), banco: tempBancoVale, numeroDocumento: tempDocVale, monto: parseInt(tempMontoVale) }]);
      setTempDocVale(''); setTempMontoVale('');
    }
  };

  // Calculations
  const totalEfectivo = rows.filter(r => r.medioPago === 'Efectivo').reduce((acc, r) => acc + r.monto, 0);
  const totalTarjetas = rows.filter(r => ['Débito', 'Visa', 'Mastercard'].includes(r.medioPago)).reduce((acc, r) => acc + r.monto, 0);
  const totalChequesSist = rows.filter(r => r.medioPago === 'Cheque').reduce((acc, r) => acc + r.monto, 0);
  const totalValesSist = rows.filter(r => r.medioPago === 'Vale Vista').reduce((acc, r) => acc + r.monto, 0);

  const totalChequesFis = chequesFisicos.reduce((acc, c) => acc + c.monto, 0);
  const totalValesFis = valesFisicos.reduce((acc, v) => acc + v.monto, 0);

  const difTransbank = (parseInt(cierreTransbank) || 0) - totalTarjetas;
  const difEfectivo = (parseInt(efectivoFisico) || 0) - totalEfectivo;
  const difCheques = totalChequesFis - totalChequesSist;
  const difVales = totalValesFis - totalValesSist;

  const filteredRows = viewMode === 'all' ? rows : rows.filter(r => {
    if (activeTab === 'Efectivo') return r.medioPago === 'Efectivo';
    if (activeTab === 'Tarjetas') return ['Débito', 'Visa', 'Mastercard'].includes(r.medioPago);
    if (activeTab === 'Cheque') return r.medioPago === 'Cheque';
    if (activeTab === 'Vale Vista') return r.medioPago === 'Vale Vista';
    return true;
  });

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Columna Izquierda: Ingreso Nomina */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {session?.role === 'supervisor' && (
          <div style={{ background: '#f5f3ff', border: '2px solid #8b5cf6', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)' }}>
            <AlertTriangle color="#6d28d9" size={28} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, color: '#4c1d95', fontSize: '1.1rem', fontWeight: '900' }}>Modo Revisión Activo</h3>
              <p style={{ margin: 0, color: '#111827', fontSize: '0.95rem', fontWeight: '600' }}>Estás revisando los folios y cuadratura de otro cajero. Cualquier modificación será guardada en su sesión.</p>
            </div>
            <select 
              className="form-select" 
              value={activeCajero} 
              onChange={e => handleSelectCajero(e.target.value)}
              style={{ width: '200px', background: 'white', color: 'black' }}
            >
              <option value="">-- Seleccionar Cajero --</option>
              {Array.from({length: 18}, (_, i) => `Caja ${String(i + 1).padStart(2, '0')}`).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <header className="glass-panel" style={{ padding: '20px', border: session?.role === 'supervisor' && activeCajero ? '2px solid #8b5cf6' : 'none' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={24} /> 1. Digitación de Nómina (Sistema SMC) {activeCajero && <span style={{ fontSize: '1rem', background: '#8b5cf6', color: 'white', padding: '4px 8px', borderRadius: '8px' }}>{activeCajero}</span>}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Ingrese los comprobantes emitidos por el sistema para obtener los totales base de la cuadratura.
          </p>
          
          {/* Tabs UI */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            {['Efectivo', 'Tarjetas', 'Cheque', 'Vale Vista'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 24px',
                  background: activeTab === tab ? 'var(--glass-bg)' : 'transparent',
                  border: activeTab === tab ? '1px solid rgba(255,255,255,0.8)' : '1px solid transparent',
                  borderRadius: '24px',
                  fontWeight: activeTab === tab ? '600' : '500',
                  color: activeTab === tab ? 'var(--text-main)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {(!session || (session.role === 'supervisor' && !activeCajero)) ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            {isLocked && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(139, 92, 246, 0.9)', color: 'white', padding: '16px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--glass-shadow)' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Turno Cerrado por Supervisión</h2>
                  <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>Tu jornada ha sido bloqueada. Ya no puedes agregar, editar ni eliminar folios. El sistema está en modo de solo lectura.</p>
                </div>
              </motion.div>
            )}
            <h3>Seleccione un cajero para revisar su nómina</h3>
          </div>
        ) : (
          <>
            <div className="glass-panel" style={{ padding: '24px', borderTopLeftRadius: '16px', borderLeft: session?.role === 'supervisor' ? '2px solid #8b5cf6' : 'none' }}>
              <form onSubmit={handleAddRow} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 100px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>N° Giro</label>
              <input type="number" className="form-input" value={giro} onChange={e => setGiro(e.target.value)} required disabled={isLocked} />
            </div>
            <div className="form-group" style={{ flex: '1 1 100px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>N° Folio</label>
              <input type="number" className="form-input" value={folio} onChange={e => setFolio(e.target.value)} required disabled={isLocked} />
            </div>
            {activeTab === 'Tarjetas' && (
              <>
                <div className="form-group" style={{ flex: '1 1 130px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Tipo de Tarjeta</label>
                  <select className="form-select" value={tipoTarjeta} onChange={e => setTipoTarjeta(e.target.value)} disabled={isLocked}>
                    <option value="Débito">Débito</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: '1 1 130px', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>N° Autorización</label>
                  <input type="text" className="form-input" value={autorizacion} onChange={e => setAutorizacion(e.target.value)} required disabled={isLocked} />
                </div>
              </>
            )}
            {(activeTab === 'Cheque' || activeTab === 'Vale Vista') && (
              <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>{activeTab === 'Cheque' ? 'N° Cheque' : 'N° Vale Vista'}</label>
                <input type="text" className="form-input" value={autorizacion} onChange={e => setAutorizacion(e.target.value)} required disabled={isLocked} />
              </div>
            )}
            <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '600' }}>Monto ($)</label>
              <input type="number" className="form-input" value={monto} onChange={e => setMonto(e.target.value)} required disabled={isLocked} />
            </div>
            <div style={{ display: 'flex', gap: '8px', height: '46px', flex: '1 1 auto', minWidth: '220px' }}>
              <button type="submit" className="btn-primary" style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }} disabled={isLocked}>
                <Plus size={18} /> Agregar
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (isLocked) { alert("Turno cerrado."); return; }
                  setBulkGiro(giro);
                  setBulkFolio(folio);
                  setBulkMonto(monto);
                  setBulkMedioPago(activeTab === 'Tarjetas' ? tipoTarjeta : activeTab);
                  setShowBulkModal(true);
                }}
                className="btn-primary" 
                style={{ background: 'var(--warning-color)', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }} 
              >
                <Zap size={18} /> Masivo
              </button>
            </div>
          </form>
        </div>

        <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: 0, display: 'flex', flexDirection: 'column' }}>
          
          {/* Header de la Tabla con Toggle de Vista */}
          <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Registros Ingresados ({filteredRows.length})</span>
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '4px 12px', fontSize: '0.85rem', background: 'white' }}
              value={viewMode}
              onChange={e => setViewMode(e.target.value as 'all' | 'tab')}
            >
              <option value="all">Ver Todos los Folios (Correlativos)</option>
              <option value="tab">Ver solo pestaña: {activeTab}</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
              <tr>
                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>N° Giro/Folio</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Medio Pago</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Monto</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay registros para mostrar.</td></tr>
              ) : (
                <AnimatePresence>
                  {filteredRows.map((r) => (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: r.corrido ? 'rgba(211, 47, 47, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '16px' }}>
                        {editingId === r.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <input type="number" className="form-input" style={{ padding: '4px', fontSize: '0.9rem' }} value={editForm.giro} onChange={e => setEditForm({...editForm, giro: e.target.value})} placeholder="Giro" />
                            <input type="number" className="form-input" style={{ padding: '4px', fontSize: '0.9rem' }} value={editForm.folio} onChange={e => setEditForm({...editForm, folio: e.target.value})} placeholder="Folio" />
                          </div>
                        ) : (
                          <>
                            <div style={{ fontWeight: '500' }}>G: {r.giro}</div>
                            <div style={{ fontWeight: '700', color: r.corrido ? 'var(--danger-color)' : 'var(--text-main)' }}>
                              F: {r.folio} {r.corrido && <span style={{ marginLeft: '4px', fontSize: '0.7rem', background: 'var(--danger-color)', color: 'white', padding: '2px 4px', borderRadius: '4px' }}>Salto</span>}
                            </div>
                          </>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{r.medioPago}</div>
                        {(r.medioPago === 'Débito' || r.medioPago === 'Visa' || r.medioPago === 'Mastercard' || r.medioPago === 'Cheque' || r.medioPago === 'Vale Vista') && (
                          editingId === r.id ? (
                            <input type="text" className="form-input" style={{ padding: '4px', fontSize: '0.8rem', marginTop: '4px' }} value={editForm.autorizacion} onChange={e => setEditForm({...editForm, autorizacion: e.target.value})} placeholder={r.medioPago === 'Cheque' || r.medioPago === 'Vale Vista' ? "N° Documento" : "N° Autorización"} />
                          ) : (
                            r.autorizacion && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.medioPago === 'Cheque' || r.medioPago === 'Vale Vista' ? 'N° Doc:' : 'Aut:'} {r.autorizacion}</div>
                          )
                        )}
                      </td>
                      <td style={{ padding: '16px', fontWeight: '700', color: 'var(--primary-color)' }}>
                        {editingId === r.id ? (
                          <input type="number" className="form-input" style={{ padding: '4px', fontSize: '0.9rem' }} value={editForm.monto} onChange={e => setEditForm({...editForm, monto: e.target.value})} placeholder="Monto" />
                        ) : (
                          `$${r.monto.toLocaleString('es-CL')}`
                        )}
                      </td>
                      <td style={{ padding: '16px', display: 'flex', gap: '8px', alignItems: 'center', height: '100%' }}>
                        {editingId === r.id ? (
                          <button onClick={() => {
                            setRows(rows.map(row => row.id === r.id ? { ...row, giro: parseInt(editForm.giro), folio: parseInt(editForm.folio), monto: parseInt(editForm.monto), autorizacion: editForm.autorizacion } : row));
                            setEditingId(null);
                          }} style={{ background: 'transparent', border: 'none', color: 'var(--success-color)', cursor: 'pointer' }} title="Guardar cambios"><Save size={18} /></button>
                        ) : (
                          <>
                            {session?.role === 'supervisor' && !isLocked && (
                              <button onClick={() => { setEditingId(r.id); setEditForm({ giro: r.giro.toString(), folio: r.folio.toString(), monto: r.monto.toString(), autorizacion: r.autorizacion || '' }); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }} title="Editar registro (Solo Supervisora)"><Pencil size={18} /></button>
                            )}
                            {!isLocked && (
                              <button onClick={() => removeRow(r.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }} title="Eliminar registro"><Trash2 size={18} /></button>
                            )}
                          </>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
          </div>

        {/* Totales Resumen */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.3)', borderTop: '1px solid var(--glass-border)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Efectivo</div>
              <div style={{ fontWeight: '700', color: 'var(--success-color)' }}>${totalEfectivo.toLocaleString('es-CL')}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tarjetas</div>
              <div style={{ fontWeight: '700', color: 'var(--primary-color)' }}>${totalTarjetas.toLocaleString('es-CL')}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cheques</div>
              <div style={{ fontWeight: '700', color: 'var(--warning-color)' }}>${totalChequesSist.toLocaleString('es-CL')}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vales Vista</div>
              <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>${totalValesSist.toLocaleString('es-CL')}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '24px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Nómina General</div>
            <div style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text-main)' }}>${(totalEfectivo + totalTarjetas + totalChequesSist + totalValesSist).toLocaleString('es-CL')}</div>
          </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Columna Derecha: Auditoría de Cierre (Lo físico) */}
      <div className="glass-panel" style={{ flex: '0 0 380px', minWidth: '350px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', padding: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0, paddingBottom: '8px', color: 'var(--text-main)' }}>
          2. Declaración Física y Cuadratura
        </h2>

        {/* Transbank */}
        <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1rem', color: '#1e40af', margin: '0 0 12px 0' }}>Máquina Transbank</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Suma Nómina:</span><span style={{ fontWeight: '600' }}>${totalTarjetas.toLocaleString('es-CL')}</span>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Cierre Z Máquina</label>
            <input type="number" className="form-input" value={cierreTransbank} onChange={e => setCierreTransbank(e.target.value)} style={{ background: 'white' }} disabled={isLocked} />
          </div>
          {cierreTransbank && (
            <div style={{ padding: '12px', borderRadius: '8px', background: difTransbank === 0 ? 'rgba(0, 200, 83, 0.1)' : 'rgba(211, 47, 47, 0.1)', color: difTransbank === 0 ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
              {difTransbank === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {difTransbank === 0 ? 'Cuadrado.' : `Diferencia: ${difTransbank > 0 ? '+' : ''}$${difTransbank.toLocaleString('es-CL')}`}
            </div>
          )}
        </div>

        {/* Efectivo */}
        <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #86efac', padding: '16px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1rem', color: '#166534', margin: '0 0 12px 0' }}>Efectivo en Caja</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Suma Nómina:</span><span style={{ fontWeight: '600' }}>${totalEfectivo.toLocaleString('es-CL')}</span>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Físico Contado</label>
            <input type="number" className="form-input" value={efectivoFisico} onChange={e => setEfectivoFisico(e.target.value)} style={{ background: 'white' }} disabled={isLocked} />
          </div>
          {efectivoFisico && (
            <div style={{ padding: '12px', borderRadius: '8px', background: difEfectivo === 0 ? 'rgba(0, 200, 83, 0.1)' : 'rgba(211, 47, 47, 0.1)', color: difEfectivo === 0 ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
              {difEfectivo === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {difEfectivo === 0 ? 'Cuadrado.' : `Diferencia: ${difEfectivo > 0 ? '+' : ''}$${difEfectivo.toLocaleString('es-CL')}`}
            </div>
          )}
        </div>

        {/* Cheques Físicos */}
        <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #fdba74', padding: '16px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1rem', color: '#c2410c', margin: '0 0 12px 0' }}>Declaración Cheques Físicos</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Suma Nómina:</span><span style={{ fontWeight: '600' }}>${totalChequesSist.toLocaleString('es-CL')}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Banco</label>
              <select className="form-select" style={{ width: '100%', padding: '8px' }} value={tempBancoCheque} onChange={e => setTempBancoCheque(e.target.value)} disabled={isLocked}>
                {BANCOS_CHILE.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Últ. 4</label>
              <input type="text" className="form-input" style={{ width: '100%', padding: '8px' }} placeholder="0000" maxLength={4} value={tempDocCheque} onChange={e => setTempDocCheque(e.target.value.replace(/\D/g, ''))} disabled={isLocked} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto</label>
              <input type="number" className="form-input" style={{ width: '100%', padding: '8px' }} value={tempMontoCheque} onChange={e => setTempMontoCheque(e.target.value)} disabled={isLocked} />
            </div>
            <button onClick={addChequeFisico} style={{ padding: '8px 12px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} disabled={isLocked}><Plus size={18} /></button>
          </div>

          {chequesFisicos.length > 0 && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '8px', marginBottom: '12px' }}>
              {chequesFisicos.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                  <span>{c.banco} ({c.numeroDocumento})</span>
                  <span style={{ fontWeight: '600' }}>${c.monto.toLocaleString('es-CL')}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                <span>Total Declarado:</span><span>${totalChequesFis.toLocaleString('es-CL')}</span>
              </div>
            </div>
          )}

          {chequesFisicos.length > 0 && (
            <div style={{ padding: '12px', borderRadius: '8px', background: difCheques === 0 ? 'rgba(0, 200, 83, 0.1)' : 'rgba(211, 47, 47, 0.1)', color: difCheques === 0 ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
              {difCheques === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {difCheques === 0 ? 'Cheques Cuadrados.' : `Diferencia: ${difCheques > 0 ? '+' : ''}$${difCheques.toLocaleString('es-CL')}`}
            </div>
          )}
        </div>

        {/* Vales Vista Físicos */}
        <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #94a3b8', padding: '16px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: '0 0 12px 0' }}>Declaración Vales Vista Físicos</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Suma Nómina:</span><span style={{ fontWeight: '600' }}>${totalValesSist.toLocaleString('es-CL')}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Banco</label>
              <select className="form-select" style={{ width: '100%', padding: '8px' }} value={tempBancoVale} onChange={e => setTempBancoVale(e.target.value)} disabled={isLocked}>
                {BANCOS_CHILE.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Últ. 4</label>
              <input type="text" className="form-input" style={{ width: '100%', padding: '8px' }} placeholder="0000" maxLength={4} value={tempDocVale} onChange={e => setTempDocVale(e.target.value.replace(/\D/g, ''))} disabled={isLocked} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto</label>
              <input type="number" className="form-input" style={{ width: '100%', padding: '8px' }} value={tempMontoVale} onChange={e => setTempMontoVale(e.target.value)} disabled={isLocked} />
            </div>
            <button onClick={addValeFisico} className="btn-primary" style={{ padding: '8px 12px' }} disabled={isLocked}><Plus size={18} /></button>
          </div>

          {valesFisicos.length > 0 && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '8px', marginBottom: '12px' }}>
              {valesFisicos.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                  <span>{c.banco} ({c.numeroDocumento})</span>
                  <span style={{ fontWeight: '600' }}>${c.monto.toLocaleString('es-CL')}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                <span>Total Declarado:</span><span>${totalValesFis.toLocaleString('es-CL')}</span>
              </div>
            </div>
          )}

          {valesFisicos.length > 0 && (
            <div style={{ padding: '12px', borderRadius: '8px', background: difVales === 0 ? 'rgba(0, 200, 83, 0.1)' : 'rgba(211, 47, 47, 0.1)', color: difVales === 0 ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
              {difVales === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {difVales === 0 ? 'Vales Vista Cuadrados.' : `Diferencia: ${difVales > 0 ? '+' : ''}$${difVales.toLocaleString('es-CL')}`}
            </div>
          )}
        </div>

        {/* Botón de Exportación */}
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          { (difTransbank !== 0 || difEfectivo !== 0 || difCheques !== 0 || difVales !== 0) ? (
            <div style={{ padding: '12px', background: 'rgba(211, 47, 47, 0.1)', color: 'var(--danger-color)', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              Caja Descuadrada: El cierre de caja está bloqueado hasta corregir la diferencia.
            </div>
          ) : null }
          <button 
            onClick={() => window.print()} 
            disabled={difTransbank !== 0 || difEfectivo !== 0 || difCheques !== 0 || difVales !== 0 || isLocked}
            className="btn-primary" 
            style={{ 
              width: '100%', 
              padding: '12px',
              opacity: (difTransbank !== 0 || difEfectivo !== 0 || difCheques !== 0 || difVales !== 0 || isLocked) ? 0.5 : 1,
              cursor: (difTransbank !== 0 || difEfectivo !== 0 || difCheques !== 0 || difVales !== 0 || isLocked) ? 'not-allowed' : 'pointer'
            }}
          >
            <Printer size={18} /> Cierre y Exportación a PDF
          </button>
        </div>
      </div>

      {/* Bulk Insert Modal */}
      <AnimatePresence>
        {showBulkModal && (
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
              style={{ width: '500px', padding: '32px', background: 'rgba(255,255,255,0.95)', position: 'relative' }}
            >
              <button 
                onClick={() => setShowBulkModal(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--warning-color)' }}>
                <Zap size={32} />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>Asistente de Pago Múltiple</h2>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Generación automática de cuotas correlativas (ej: Aseo)</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ textAlign: 'center' }}>Giro Inicial</label>
                    <input type="number" className="form-input" style={{ textAlign: 'center', width: '100%', boxSizing: 'border-box' }} value={bulkGiro} onChange={e => setBulkGiro(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ textAlign: 'center' }}>Folio Inicial</label>
                    <input type="number" className="form-input" style={{ textAlign: 'center', width: '100%', boxSizing: 'border-box' }} value={bulkFolio} onChange={e => setBulkFolio(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ textAlign: 'center' }}>Monto por Cuota ($)</label>
                    <input type="number" className="form-input" style={{ textAlign: 'center', width: '100%', boxSizing: 'border-box' }} value={bulkMonto} onChange={e => setBulkMonto(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ textAlign: 'center' }}>Medio de Pago</label>
                    <select className="form-select" style={{ textAlign: 'center', width: '100%', boxSizing: 'border-box' }} value={bulkMedioPago} onChange={e => setBulkMedioPago(e.target.value)}>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Débito">Débito</option>
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Vale Vista">Vale Vista</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0, background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--warning-color)' }}>
                  <label className="form-label" style={{ color: 'var(--warning-color)', fontWeight: 'bold' }}>
                    ¿Cuántos folios adicionales generarás?
                  </label>
                  <input type="number" className="form-input" style={{ fontSize: '1.2rem', textAlign: 'center' }} value={bulkQty} onChange={e => setBulkQty(e.target.value)} required min="1" max="50" />
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    El sistema generará {bulkQty || 0} filas correlativas sumando ${(parseFloat(bulkMonto || '0') * parseInt(bulkQty || '0')).toLocaleString('es-CL')} en total.
                  </p>
                </div>

                <button onClick={handleBulkInsert} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', padding: '14px', background: 'var(--warning-color)', color: 'white', fontWeight: 'bold' }}>
                  <Zap size={20} /> Generar Automáticamente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal de Apertura de Turno (Arqueo Detallado) */}
      <AnimatePresence>
        {showTurnoModal && (
          <ArqueoCiegoModal 
            title="Apertura de Turno"
            subtitle="Declare el fondo fijo (sencillo) con el que inicia su caja contando sus billetes."
            onConfirm={handleArqueoSencillo}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSupervisorAuth && (
          <SupervisorOverrideModal 
            actionType="apertura"
            montoApertura={sencilloTemporal}
            onSuccess={() => confirmarApertura(sencilloTemporal)}
            onClose={() => {
              setShowSupervisorAuth(false);
              setShowTurnoModal(true); // Vuelve al contador si cancela
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
