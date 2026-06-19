import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const { id } = await params;
    
    const result = await sql`
      UPDATE Nomina SET
        estado = ${data.estado || 'Cuadrado'},
        fechaCierre = ${new Date().toISOString()},
        observacion = ${data.observacion || ''}
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error actualizando nómina' }, { status: 500 });
  }
}
