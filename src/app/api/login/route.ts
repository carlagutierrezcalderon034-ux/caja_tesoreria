import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Buscar en la DB real usando Vercel Postgres
    const result = await sql`SELECT * FROM "User" WHERE username = ${username}`;
    const user = result.rows[0];

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: `Error DB: ${error.message || JSON.stringify(error)}` }, { status: 500 });
  }
}
