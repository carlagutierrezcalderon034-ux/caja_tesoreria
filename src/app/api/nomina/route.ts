import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const result = await sql`SELECT * FROM Nomina ORDER BY createdAt DESC`;
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error obteniendo nóminas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const billetes = JSON.stringify(data.billetes || []);
    
    const result = await sql`
      INSERT INTO Nomina (
        cajero, username, folioInicio, folioFin, totalDocumentos, 
        ingresoReal, diferencia, sobrante, faltante, cheques, 
        tarjetas, efectivo, billetes, estado, fecha, 
        fechaAsignacion, observacion
      ) VALUES (
        ${data.cajero}, ${data.username || ''}, ${data.folioInicio || 0}, ${data.folioFin || 0}, ${data.totalDocumentos || 0},
        ${data.ingresoReal || 0}, ${data.diferencia || 0}, ${data.sobrante || 0}, ${data.faltante || 0}, ${data.cheques || 0},
        ${data.tarjetas || 0}, ${data.efectivo || 0}, ${billetes}, ${data.estado || 'Recaudado'}, ${data.fecha || new Date().toISOString()},
        ${data.fechaAsignacion || new Date().toISOString()}, ${data.observacion || ''}
      )
      RETURNING *
    `;

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error guardando nómina' }, { status: 500 });
  }
}
