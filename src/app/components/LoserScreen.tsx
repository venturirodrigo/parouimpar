interface LoserScreenProps {
  socketId: string;
}

export default function LoserScreen({ socketId }: LoserScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-white border border-gray-700">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-red-400 mb-4">Você Perdeu...</h2>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition text-lg font-bold"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    </div>
  );
} 