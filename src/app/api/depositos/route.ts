import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`SELECT * FROM Deposito ORDER BY createdAt DESC`;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching depositos:', error);
    return NextResponse.json({ error: 'Failed to fetch depositos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.caja || !data.cajero_username || !data.empresa_recaudadora || data.total_depositado === undefined || !data.desglose_billetes) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const fecha = new Date().toISOString().split('T')[0];
    const desglose = JSON.stringify(data.desglose_billetes);

    const result = await sql`
      INSERT INTO Deposito (caja, cajero_username, empresa_recaudadora, total_depositado, desglose_billetes, fecha)
      VALUES (${data.caja}, ${data.cajero_username}, ${data.empresa_recaudadora}, ${data.total_depositado}, ${desglose}, ${fecha})
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error creating deposito:', error);
    return NextResponse.json({ error: 'Failed to create deposito' }, { status: 500 });
  }
}
