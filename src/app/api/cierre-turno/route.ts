import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const fecha = searchParams.get('fecha');

  if (!username || !fecha) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  try {
    const result = await sql`SELECT * FROM CierreTurno WHERE cajero_username = ${username} AND fecha = ${fecha}`;
    const cierre = result.rows[0];
    return NextResponse.json({ locked: !!cierre, cierre });
  } catch (error) {
    console.error('Error verificando cierre:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { cajero_username, caja, fecha, cerrado_por } = await request.json();

    if (!cajero_username || !caja || !fecha || !cerrado_por) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // Verificar si ya existe un cierre para ese usuario y fecha
    const existeResult = await sql`SELECT id FROM CierreTurno WHERE cajero_username = ${cajero_username} AND fecha = ${fecha}`;
    
    if (existeResult.rowCount > 0) {
      return NextResponse.json({ error: 'Turno ya está cerrado' }, { status: 400 });
    }

    const insertResult = await sql`
      INSERT INTO CierreTurno (cajero_username, caja, fecha, cerrado_por) 
      VALUES (${cajero_username}, ${caja}, ${fecha}, ${cerrado_por})
      RETURNING id
    `;

    return NextResponse.json({ message: 'Turno cerrado exitosamente', id: insertResult.rows[0].id });
  } catch (error) {
    console.error('Error al cerrar turno:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const fecha = searchParams.get('fecha');

    if (!username || !fecha) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    await sql`DELETE FROM CierreTurno WHERE cajero_username = ${username} AND fecha = ${fecha}`;

    return NextResponse.json({ message: 'Turno reabierto exitosamente' });
  } catch (error) {
    console.error('Error al reabrir turno:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
