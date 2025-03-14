interface LoserScreenProps {
  onPlayAgain: () => void;
  onLogout: () => void;
}

export default function LoserScreen({ onPlayAgain, onLogout }: LoserScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-white border border-gray-700">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-red-400 mb-4">Você Perdeu...</h2>
          </div>
          <button
            onClick={onPlayAgain}
            className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition text-lg font-bold"
          >
            Tentar Novamente
          </button>
          <button
            onClick={onLogout}
            className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition text-lg font-bold mt-4"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
} 