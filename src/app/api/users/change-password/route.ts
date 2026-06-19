import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const result = await sql`UPDATE "User" SET password = ${newPassword} WHERE id = ${Number(userId)}`;

    if (result.rowCount === null || result.rowCount === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno conectando a la base de datos' }, { status: 500 });
  }
}
