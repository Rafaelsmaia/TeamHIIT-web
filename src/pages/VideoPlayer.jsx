import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, User, Star, Bookmark, Share2, Play } from 'lucide-react';
import Header from '../components/ui/Header.jsx';

function VideoPlayer() {
  const { moduleId, videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca dados do vídeo baseado nos parâmetros ou state
    const loadVideoData = () => {
      if (location.state) {
        setVideoData(location.state);
        setLoading(false);
      } else {
        // Buscar dados do trainings.js baseado nos IDs
        const script = document.createElement('script');
        script.src = '/trainings.js';
        script.onload = () => {
          if (window.trainingsData) {
            // Encontrar o vídeo específico
            const projetoVerao = window.trainingsData.sections
              .find(s => s.id === 'programas-especiais')
              ?.trainings.find(t => t.id === 'projeto-verao');
            
            if (projetoVerao && projetoVerao.modules) {
              const module = projetoVerao.modules.find(m => m.title === `Módulo ${moduleId}`);
              const video = module?.videos?.[0];
              
              if (video) {
                setVideoData({
                  title: `${module.title} - ${video.title}`,
                  youtubeId: video.youtubeId,
                  description: `Vídeo do ${module.title} do Projeto Verão`,
                  duration: '30-40 min',
                  level: 'Intermediário',
                  instructor: 'Team HIIT',
                  category: 'Especial'
                });
              }
            }
          }
          setLoading(false);
        };
        document.head.appendChild(script);
      }
    };

    loadVideoData();
  }, [moduleId, videoId, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-gray-300 h-96 rounded-lg mb-6"></div>
            <div className="bg-gray-300 h-8 rounded mb-4"></div>
            <div className="bg-gray-300 h-4 rounded mb-2"></div>
            <div className="bg-gray-300 h-4 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Vídeo não encontrado</h2>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section com gradiente */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          
          <div className="flex items-center mb-4">
            <Play className="w-6 h-6 mr-3" />
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Especial</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">{videoData.title}</h1>
          <p className="text-xl text-white/90 mb-6">{videoData.description}</p>
          
          <div className="flex items-center space-x-6 text-white/80">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              <span>{videoData.duration}</span>
            </div>
            <div className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              <span>Instrutor: {videoData.instructor}</span>
            </div>
            <div className="flex items-center">
              <Star className="w-5 h-5 mr-2" />
              <span>{videoData.level}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-6">
            <button className="flex items-center bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
              <Bookmark className="w-5 h-5 mr-2" />
              Salvar
            </button>
            <button className="flex items-center bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
              <Share2 className="w-5 h-5 mr-2" />
              Compartilhar
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Video Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <h3 className="text-xl font-bold p-6 border-b border-gray-200">Vídeo do Treino</h3>
              <div className="p-6">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${videoData.youtubeId}`}
                    title={videoData.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-6">Informações do Treino</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-3" />
                    <span>Duração</span>
                  </div>
                  <span className="font-semibold">{videoData.duration}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center text-gray-600">
                    <Star className="w-5 h-5 mr-3" />
                    <span>Dificuldade</span>
                  </div>
                  <span className="font-semibold">{videoData.level}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center text-gray-600">
                    <User className="w-5 h-5 mr-3" />
                    <span>Categoria</span>
                  </div>
                  <span className="font-semibold">{videoData.category}</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center text-gray-600">
                    <Star className="w-5 h-5 mr-3" />
                    <span>Avaliação</span>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">(4.8)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipamentos */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h3 className="text-xl font-bold mb-4">Equipamentos</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span>Peso corporal</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span>Tapete de exercício</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;

