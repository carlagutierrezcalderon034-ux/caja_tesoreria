import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let result;

    if (startDate && endDate) {
      result = await sql`
        SELECT * FROM Nomina 
        WHERE DATE(createdAt) >= DATE(${startDate}) AND DATE(createdAt) <= DATE(${endDate})
        ORDER BY createdAt DESC
      `;
    } else {
      result = await sql`SELECT * FROM Nomina ORDER BY createdAt DESC`;
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching reportes:', error);
    return NextResponse.json({ error: 'Error al obtener los datos de reportes' }, { status: 500 });
  }
}
