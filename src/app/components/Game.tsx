'use client';

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import WinnerScreen from './WinnerScreen';
import LoserScreen from './LoserScreen';
import Auth from './Auth';

let socket: Socket | null = null;

interface RoomEvent {
  roomId: string;
  role: 'even' | 'odd';
  message: string;
}

interface GameStartEvent {
  message: string;
}

interface GameResult {
  winner: string;
  sum: number;
  isEven: boolean;
  numbers: Record<string, number>;
}

interface ErrorEvent {
  message: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

const COUNTDOWN_TIME = 20;
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function Game() {
  const [user, setUser] = useState<User | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [role, setRole] = useState<'even' | 'odd' | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'selecting' | 'finished'>('waiting');
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const initSocket = async () => {
      try {
        await fetch('/api/socket');
        if (!socket) {
          socket = io(undefined, {
            path: '/api/socket',
          });

          socket.on('connect', () => {
            console.log('Connected to server');
            setConnected(true);
            setError(null);
          });

          socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setConnected(false);
          });

          socket.on('roomCreated', ({ roomId, role, message }: RoomEvent) => {
            console.log('Room created:', { roomId, role, message });
            setRoomId(roomId);
            setRole(role);
            setGameState('playing');
            setError(null);
          });

          socket.on('roomJoined', ({ roomId, role, message }: RoomEvent) => {
            console.log('Room joined:', { roomId, role, message });
            setRoomId(roomId);
            setRole(role);
            setGameState('playing');
            setError(null);
          });

          socket.on('gameStart', ({ message }: GameStartEvent) => {
            console.log('Game starting:', message);
            setGameState('selecting');
            setCountdown(COUNTDOWN_TIME);
            setSelectedNumber(null);
          });

          socket.on('gameResult', (data: GameResult) => {
            console.log('Game result:', data);
            setResult(data);
            setGameState('finished');
            setCountdown(null);
          });

          socket.on('error', ({ message }: ErrorEvent) => {
            console.error('Error:', message);
            setError(message);
          });
        }
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        setError('Erro ao conectar ao servidor. Tente novamente.');
      }
    };

    if (user) {
      initSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [user]);

  useEffect(() => {
    if (countdown === null) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          if (selectedNumber !== null && socket?.connected) {
            socket.emit('submitNumber', { roomId, number: selectedNumber });
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, roomId, selectedNumber]);

  const handleLogout = () => {
    setUser(null);
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    setGameState('waiting');
    setRoomId('');
    setRole(null);
    setResult(null);
  };

  const createRoom = () => {
    if (!socket?.connected) {
      setError('Não conectado ao servidor. Aguarde a conexão...');
      return;
    }
    socket.emit('createRoom');
  };

  const joinRoom = () => {
    if (!socket?.connected) {
      setError('Não conectado ao servidor. Aguarde a conexão...');
      return;
    }
    if (!inputRoomId.trim()) {
      setError('Por favor, insira o código da sala');
      return;
    }
    socket.emit('joinRoom', { roomId: inputRoomId });
  };

  const selectNumber = (number: number) => {
    if (selectedNumber === number) {
      setSelectedNumber(null);
    } else {
      setSelectedNumber(number);
      if (countdown === 0 && socket?.connected) {
        socket.emit('submitNumber', { roomId, number });
      }
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setError('Código copiado!');
    setTimeout(() => setError(null), 2000);
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <div className="text-2xl">Conectando ao servidor...</div>
          {error && (
            <div className="text-red-400 mt-2">
              {error}
              <button
                onClick={() => window.location.reload()}
                className="ml-4 text-blue-400 hover:text-blue-300"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'finished' && result && socket?.id) {
    const isWinner = result.winner === socket.id;
    return isWinner ? (
      <WinnerScreen socketId={socket.id} />
    ) : (
      <LoserScreen socketId={socket.id} />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-white border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full"
            />
            <span className="text-gray-300">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition"
          >
            Sair
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">Par ou Ímpar</h1>
            <div className="space-y-4">
              <button
                onClick={createRoom}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
              >
                Criar Sala
              </button>
              <div className="text-center text-gray-400">ou</div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  placeholder="Código da sala"
                  className="w-full p-2 border rounded bg-gray-700 border-gray-600 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={joinRoom}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  Entrar na Sala
                </button>
              </div>
            </div>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'selecting') && (
          <div className="text-center space-y-6">
            <div className="flex justify-between items-center bg-gray-700/50 p-4 rounded">
              <div>
                <span className="text-gray-400">Sala:</span>{' '}
                <span className="font-mono text-blue-400">{roomId}</span>
                <button
                  onClick={copyRoomId}
                  className="ml-2 text-gray-400 hover:text-white transition"
                >
                  📋
                </button>
              </div>
              <div>
                <span className="text-gray-400">Você é:</span>{' '}
                <span className="font-bold text-blue-400">
                  {role === 'even' ? 'Par' : 'Ímpar'}
                </span>
              </div>
            </div>

            {gameState === 'playing' && (
              <div className="text-xl text-gray-400">
                Aguardando o outro jogador...
              </div>
            )}

            {gameState === 'selecting' && (
              <div className="space-y-6">
                <div className="text-2xl font-bold text-blue-400">
                  {countdown !== null && countdown > 0
                    ? `Escolha um número (${countdown}s)`
                    : 'Tempo esgotado!'}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {NUMBERS.map((num) => (
                    <button
                      key={num}
                      onClick={() => selectNumber(num)}
                      disabled={countdown === 0}
                      className={`
                        p-6 rounded-lg text-2xl font-bold transition
                        ${selectedNumber === num
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                        ${countdown === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                {selectedNumber !== null && (
                  <div className="text-green-400">
                    Número selecionado: {selectedNumber}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 