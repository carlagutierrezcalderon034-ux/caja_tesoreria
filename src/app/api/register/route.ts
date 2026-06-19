import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password, nombre, role } = await request.json();

    // Comprobar si el usuario ya existe
    const existingResult = await sql`SELECT * FROM "User" WHERE username = ${username}`;
    
    if (existingResult.rowCount > 0) {
      return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 400 });
    }

    // Insertar usando Vercel Postgres
    const insertResult = await sql`
      INSERT INTO "User" (username, password, nombre, role)
      VALUES (${username}, ${password}, ${nombre}, ${role})
      RETURNING id
    `;
    
    const user = {
      id: insertResult.rows[0].id,
      username,
      nombre,
      role
    };

    return NextResponse.json(user);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Error al registrar usuario en la base de datos' }, { status: 500 });
  }
}
