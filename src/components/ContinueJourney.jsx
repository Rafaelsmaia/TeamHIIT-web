import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';
import LazyImage from './LazyImage.jsx';

function ContinueJourney() {
  const [lastProgress, setLastProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Buscar último progresso do usuário
    const fetchLastProgress = () => {
      try {
        // Buscar do localStorage primeiro
        const savedProgress = localStorage.getItem('userProgress');
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          setLastProgress(progress);
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar progresso:', error);
        setLoading(false);
      }
    };

    fetchLastProgress();
  }, []);

  const handleContinue = () => {
    if (lastProgress) {
      // Navegar para o vídeo onde parou
      navigate(`/video/${lastProgress.trainingId}/${lastProgress.moduleId}/${lastProgress.videoId}`);
    }
  };

  const calculateProgress = () => {
    if (!lastProgress) return 0;
    const { currentVideo, totalVideos } = lastProgress;
    return Math.round((currentVideo / totalVideos) * 100);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-pulse">
        <div className="h-6 bg-gray-700 rounded mb-4 w-48"></div>
        <div className="flex gap-4">
          <div className="w-32 h-20 bg-gray-700 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded mb-2 w-3/4"></div>
            <div className="h-2 bg-gray-700 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lastProgress) {
    return null; // Não mostrar se não há progresso
  }

  const progressPercentage = calculateProgress();

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-lg p-6 mb-8 border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-lg">
          <Play className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Continue Sua Jornada</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Thumbnail do vídeo */}
        <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
          <LazyImage
            src={lastProgress.thumbnail || '/default-thumbnail.jpg'}
            alt={lastProgress.trainingTitle}
            className="w-full h-full"
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white/90 rounded-full p-2">
              <Play className="w-6 h-6 text-gray-800" />
            </div>
          </div>
        </div>

        {/* Informações do progresso */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {lastProgress.trainingTitle}
          </h3>
          <p className="text-gray-400 mb-3">
            {lastProgress.moduleTitle} • Vídeo {lastProgress.currentVideo} de {lastProgress.totalVideos}
          </p>

          {/* Barra de progresso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Progresso do módulo</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Estatísticas rápidas */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{lastProgress.timeRemaining || '15 min'} restantes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4" />
              <span>{lastProgress.completedVideos || 0} concluídos</span>
            </div>
          </div>

          {/* Botão continuar */}
          <button
            onClick={handleContinue}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 group"
          >
            <span>Continuar Treino</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Próximos vídeos (opcional) */}
      {lastProgress.nextVideos && lastProgress.nextVideos.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Próximos vídeos:</h4>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {lastProgress.nextVideos.slice(0, 3).map((video, index) => (
              <div key={index} className="flex-shrink-0 bg-gray-700 rounded-lg p-3 min-w-[200px]">
                <p className="text-sm font-medium text-white truncate">{video.title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{video.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContinueJourney;

