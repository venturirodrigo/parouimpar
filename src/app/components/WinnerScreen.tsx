interface WinnerScreenProps {
  onPlayAgain: () => void;
  onLogout: () => void;
}

export default function WinnerScreen({ onPlayAgain, onLogout }: WinnerScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-white border border-gray-700">
        <div className="text-center space-y-6">
          <div className="animate-bounce">
            <h2 className="text-4xl font-bold text-green-400 mb-4">🎉 VOCÊ VENCEU! 🎉</h2>
          </div>
          <button
            onClick={onPlayAgain}
            className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition text-lg font-bold"
          >
            Jogar Novamente
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