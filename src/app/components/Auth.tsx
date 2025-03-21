'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AuthProps {
  onLogin: (user: { id: string; name: string; email: string; avatar: string }) => void;
}

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Rocky&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zeus&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivy&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aurora&backgroundColor=ffdfbf'
];

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          avatar: selectedAvatar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao processar requisição');
      }

      onLogin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar requisição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-400 mb-4">Par ou Ímpar Online</h1>
          <p className="text-gray-300 text-lg mb-6">
            Reviva a diversão do clássico jogo de par ou ímpar em uma versão moderna e online!
          </p>
          <div className="bg-gray-800/50 p-6 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">Como Jogar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-3">
                <h3 className="text-xl font-medium text-blue-200">Regras Simples</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Escolha ser Par ou Ímpar</li>
                  <li>Selecione um número de 1 a 9</li>
                  <li>A soma dos números decide o vencedor</li>
                  <li>20 segundos para fazer sua escolha</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-medium text-blue-200">Características</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Jogue com amigos online</li>
                  <li>Avatar personalizado</li>
                  <li>Interface moderna e intuitiva</li>
                  <li>Partidas rápidas e divertidas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md mx-auto text-white border border-gray-700">
          <h2 className="text-3xl font-bold text-center mb-6 text-blue-400">
            {isLogin ? 'Login' : 'Criar Conta'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-gray-400 mb-1" htmlFor="name">
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">
                    Escolha seu avatar
                  </label>
                  <div className="grid grid-cols-5 gap-2 p-2 bg-gray-700 rounded border border-gray-600">
                    {AVATAR_OPTIONS.map((avatar, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative rounded-lg overflow-hidden transition ${
                          selectedAvatar === avatar
                            ? 'ring-2 ring-blue-500 transform scale-105'
                            : 'hover:ring-2 hover:ring-blue-400 hover:scale-105'
                        }`}
                      >
                        <Image
                          src={avatar}
                          alt={`Avatar ${index + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-gray-400 mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-3 rounded-lg font-semibold transition
                ${loading
                  ? 'bg-blue-500/50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300"
            >
              {isLogin ? 'Criar uma nova conta' : 'Já tenho uma conta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 