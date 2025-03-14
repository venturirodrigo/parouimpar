import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://par_ou_impar_user:OobOFsqN5jYaqx7RKy08HV0BXpoyvcXl@dpg-cva6ionnoe9s73e4e540-a.oregon-postgres.render.com/par_ou_impar',
  ssl: {
    rejectUnauthorized: false
  }
});

// Tabelas necessárias para o jogo
const TABLES = {
  ROOMS: 'game_rooms',
  WAITING_PLAYERS: 'waiting_players'
};

// Queries de criação das tabelas
const CREATE_TABLES = {
  ROOMS: `
    CREATE TABLE IF NOT EXISTS ${TABLES.ROOMS} (
      id VARCHAR(255) PRIMARY KEY,
      players TEXT[] NOT NULL,
      numbers JSONB NOT NULL DEFAULT '{}',
      roles JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `,
  WAITING_PLAYERS: `
    CREATE TABLE IF NOT EXISTS ${TABLES.WAITING_PLAYERS} (
      socket_id VARCHAR(255) PRIMARY KEY,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `
};

// Função para inicializar o banco de dados
export async function initDatabase() {
  try {
    // Criar tabelas se não existirem
    await pool.query(CREATE_TABLES.ROOMS);
    await pool.query(CREATE_TABLES.WAITING_PLAYERS);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Funções para manipular salas
export async function createRoom(roomId: string, socketId: string, role: 'even' | 'odd') {
  const roles = { [socketId]: role };
  const query = `
    INSERT INTO ${TABLES.ROOMS} (id, players, roles)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await pool.query(query, [roomId, [socketId], JSON.stringify(roles)]);
  return result.rows[0];
}

export async function getRoomById(roomId: string) {
  const query = `
    SELECT * FROM ${TABLES.ROOMS}
    WHERE id = $1
  `;
  const result = await pool.query(query, [roomId]);
  return result.rows[0];
}

export async function addPlayerToRoom(roomId: string, socketId: string, role: 'even' | 'odd') {
  const query = `
    UPDATE ${TABLES.ROOMS}
    SET 
      players = array_append(players, $1),
      roles = roles || $2
    WHERE id = $3
    RETURNING *
  `;
  const result = await pool.query(query, [socketId, JSON.stringify({ [socketId]: role }), roomId]);
  return result.rows[0];
}

export async function submitNumber(roomId: string, socketId: string, number: number) {
  const query = `
    UPDATE ${TABLES.ROOMS}
    SET numbers = numbers || $1
    WHERE id = $2
    RETURNING *
  `;
  const result = await pool.query(query, [JSON.stringify({ [socketId]: number }), roomId]);
  return result.rows[0];
}

export async function deleteRoom(roomId: string) {
  const query = `
    DELETE FROM ${TABLES.ROOMS}
    WHERE id = $1
  `;
  await pool.query(query, [roomId]);
}

// Funções para manipular jogadores em espera
export async function addWaitingPlayer(socketId: string) {
  const query = `
    INSERT INTO ${TABLES.WAITING_PLAYERS} (socket_id)
    VALUES ($1)
    ON CONFLICT (socket_id) DO NOTHING
    RETURNING *
  `;
  const result = await pool.query(query, [socketId]);
  return result.rows[0];
}

export async function getWaitingPlayers() {
  const query = `
    SELECT socket_id FROM ${TABLES.WAITING_PLAYERS}
    ORDER BY joined_at ASC
  `;
  const result = await pool.query(query);
  return result.rows.map(row => row.socket_id);
}

export async function removeWaitingPlayer(socketId: string) {
  const query = `
    DELETE FROM ${TABLES.WAITING_PLAYERS}
    WHERE socket_id = $1
  `;
  await pool.query(query, [socketId]);
}

// Função para limpar salas antigas
export async function cleanupOldRooms(maxAgeMinutes: number = 30) {
  const query = `
    DELETE FROM ${TABLES.ROOMS}
    WHERE created_at < NOW() - INTERVAL '${maxAgeMinutes} minutes'
  `;
  await pool.query(query);
}

// Função para limpar jogadores em espera antigos
export async function cleanupOldWaitingPlayers(maxAgeMinutes: number = 5) {
  const query = `
    DELETE FROM ${TABLES.WAITING_PLAYERS}
    WHERE joined_at < NOW() - INTERVAL '${maxAgeMinutes} minutes'
  `;
  await pool.query(query);
}

export default pool; 