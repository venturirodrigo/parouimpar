import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function POST(request: Request) {
  try {
    const { name, email, password, avatar } = await request.json();

    // Validate input
    if (!name || !email || !password || !avatar) {
      return NextResponse.json(
        { message: 'Nome, email, senha e avatar são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { message: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Insert user with selected avatar
    const result = await pool.query(
      'INSERT INTO users (name, email, password, avatar) VALUES ($1, $2, $3, $4) RETURNING id, name, email, avatar',
      [name, email, hashedPassword, avatar]
    );

    const user = result.rows[0];

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
} 