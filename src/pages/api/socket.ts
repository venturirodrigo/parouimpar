import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  initDatabase,
  createRoom,
  getRoomById,
  addPlayerToRoom,
  submitNumber,
  deleteRoom,
  addWaitingPlayer,
  getWaitingPlayers,
  removeWaitingPlayer,
  cleanupOldRooms,
  cleanupOldWaitingPlayers
} from '@/lib/db';

interface CustomSocket extends NextApiResponse {
  socket: any;
}

const SocketHandler = async (req: NextApiRequest, res: CustomSocket) => {
  if (res.socket?.server?.io) {
    res.end();
    return;
  }

  console.log('Initializing Socket.io server...');
  const httpServer: HTTPServer = res.socket.server as any;
  const io = new Server(httpServer, {
    path: '/api/socket',
  });
  res.socket.server.io = io;

  // Inicializar o banco de dados
  await initDatabase();

  // Configurar limpeza periódica
  setInterval(async () => {
    try {
      await cleanupOldRooms();
      await cleanupOldWaitingPlayers();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, 5 * 60 * 1000); // A cada 5 minutos

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('createRoom', async () => {
      try {
        const roomId = Date.now().toString();
        const role = Math.random() < 0.5 ? 'even' : 'odd';
        const room = await createRoom(roomId, socket.id, role);
        
        socket.join(roomId);
        socket.emit('roomCreated', {
          roomId,
          role,
          message: 'Sala criada com sucesso!'
        });
        
        console.log(`Room ${roomId} created by ${socket.id} with role ${role}`);
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit('error', { message: 'Erro ao criar sala' });
      }
    });

    socket.on('joinRoom', async ({ roomId }) => {
      try {
        const room = await getRoomById(roomId);
        
        if (!room) {
          socket.emit('error', { message: 'Sala não encontrada' });
          return;
        }

        const players = room.players as string[];
        if (players.length >= 2) {
          socket.emit('error', { message: 'Sala cheia' });
          return;
        }

        const roles = room.roles as Record<string, 'even' | 'odd'>;
        const existingRole = roles[players[0]];
        const newRole = existingRole === 'even' ? 'odd' : 'even';

        await addPlayerToRoom(roomId, socket.id, newRole);
        socket.join(roomId);

        socket.emit('roomJoined', {
          roomId,
          role: newRole,
          message: 'Conectado à sala com sucesso!'
        });

        io.to(roomId).emit('gameStart', { message: 'O jogo vai começar!' });
        console.log(`Player ${socket.id} joined room ${roomId} with role ${newRole}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Erro ao entrar na sala' });
      }
    });

    socket.on('submitNumber', async ({ roomId, number }) => {
      try {
        const room = await getRoomById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Sala não encontrada' });
          return;
        }

        const updatedRoom = await submitNumber(roomId, socket.id, number);
        const numbers = updatedRoom.numbers as Record<string, number>;
        const players = updatedRoom.players as string[];

        // Verificar se ambos os jogadores submeteram números
        if (Object.keys(numbers).length === 2) {
          const sum = Object.values(numbers).reduce((a, b) => a + b, 0);
          const isEven = sum % 2 === 0;
          const roles = updatedRoom.roles as Record<string, 'even' | 'odd'>;
          
          const winner = players.find(playerId => 
            (isEven && roles[playerId] === 'even') || (!isEven && roles[playerId] === 'odd')
          );

          io.to(roomId).emit('gameResult', {
            winner,
            sum,
            isEven,
            numbers
          });

          // Limpar a sala após o resultado
          await deleteRoom(roomId);
          console.log(`Game in room ${roomId} finished. Winner: ${winner}, Sum: ${sum}`);
        }
      } catch (error) {
        console.error('Error submitting number:', error);
        socket.emit('error', { message: 'Erro ao submeter número' });
      }
    });

    socket.on('disconnect', async () => {
      try {
        await removeWaitingPlayer(socket.id);
        console.log('Client disconnected:', socket.id);
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });

  res.end();
};

export default SocketHandler;

export const config = {
  api: {
    bodyParser: false,
  },
}; 