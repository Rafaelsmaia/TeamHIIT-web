import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, User, Star, Bookmark, Share2, Play, Send, MessageCircle, Lock, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import Header from '../components/ui/Header.jsx';

// Helper function to get YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(?:youtu.be\/|v\/|e\/|embed\/|watch\?v=|youtube.com\/user\/[^\/]+\/|youtube.com\/\?v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
};

function VideoPlayer() {
  const { moduleId, videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [videoData, setVideoData] = useState(null);
  const [training, setTraining] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const playlistRef = useRef(null);
  
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    // Monitor authentication state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Verificar se o usuário é assinante
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsSubscriber(userData.isSubscriber || false);
          } else {
            setIsSubscriber(false);
          }
        } catch (error) {
          console.error('Erro ao verificar assinatura:', error);
          setIsSubscriber(false);
        }
      } else {
        setIsSubscriber(false);
      }
      
      setCheckingSubscription(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  useEffect(() => {
    const fetchTrainingData = () => {
      console.log('Carregando dados do treino...');
      
      // Buscar dados do programa baseado no ID da URL
      const pathParts = location.pathname.split('/');
      const trainingId = pathParts[2]; // /video/training-id/module-id
      
      console.log('Training ID:', trainingId);
      console.log('Module ID:', moduleId);
      console.log('Video ID:', videoId);

      if (window.trainingsData && window.trainingsData.sections) {
        console.log('Dados de treinos carregados:', window.trainingsData);
        
        let foundTraining = null;
        let foundSection = null;

        // Buscar o treino em todas as seções
        for (const section of window.trainingsData.sections) {
          foundTraining = section.trainings.find(t => t.id === trainingId);
          if (foundTraining) {
            foundSection = section;
            console.log('Treino encontrado:', foundTraining);
            break;
          }
        }

        if (foundTraining && foundTraining.modules && foundTraining.modules.length > 0) {
          // Processar módulos do treino
          const processedVideos = foundTraining.modules.map((module, index) => {
            const youtubeId = module.videoUrl ? getYouTubeVideoId(module.videoUrl) : module.youtubeId;
            
            return {
              id: `modulo-${index + 1}`,
              title: module.title,
              description: `${foundTraining.title} - ${module.title}`,
              videoUrl: module.videoUrl || (module.youtubeId ? `https://youtu.be/${module.youtubeId}` : null),
              youtubeId: youtubeId,
              duration: "30-40 min",
              type: "Treino"
            };
          }).filter(video => video.youtubeId); // Filtrar apenas vídeos válidos

          console.log('Vídeos processados:', processedVideos);
          setAllVideos(processedVideos);

          // Encontrar o vídeo atual
          let currentIndex = 0;
          if (moduleId) {
            // Buscar por ID do módulo
            currentIndex = processedVideos.findIndex(v => v.id === moduleId);
            if (currentIndex === -1) {
              // Buscar por YouTube ID
              currentIndex = processedVideos.findIndex(v => v.youtubeId === videoId);
            }
            if (currentIndex === -1) {
              // Buscar por índice numérico
              const moduleNumber = parseInt(moduleId.replace('modulo-', ''));
              if (!isNaN(moduleNumber) && moduleNumber > 0 && moduleNumber <= processedVideos.length) {
                currentIndex = moduleNumber - 1;
              }
            }
          }

          console.log('Índice do vídeo atual:', currentIndex);
          setCurrentVideoIndex(currentIndex);

          // Definir dados do vídeo atual
          const currentVideo = processedVideos[currentIndex];
          if (currentVideo) {
            console.log('Vídeo atual:', currentVideo);
            setVideoData({
              title: currentVideo.title,
              youtubeId: currentVideo.youtubeId,
              description: currentVideo.description,
              duration: currentVideo.duration,
              level: foundTraining.level || 'Todos os níveis',
              instructor: 'Team HIIT',
              category: foundTraining.categories?.[0] || 'Treino'
            });
          } else {
            console.error('Vídeo atual não encontrado');
            setVideoData(null);
          }

          setTraining({
            ...foundTraining,
            sectionTitle: foundSection?.title || 'Treinos'
          });
        } else {
          console.error('Treino não encontrado ou sem módulos:', trainingId);
          setTraining(null);
          setVideoData(null);
        }
      } else {
        console.error('Dados de treinos não carregados');
      }
      
      setLoading(false);
    };

    // Verificar se os dados já estão carregados
    if (!window.trainingsData) {
      console.log('Carregando script trainings.js...');
      const script = document.createElement('script');
      script.src = '/trainings.js';
      script.onload = () => {
        console.log('Script trainings.js carregado com sucesso');
        fetchTrainingData();
      };
      script.onerror = (error) => {
        console.error('Erro ao carregar arquivo de treinos:', error);
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      fetchTrainingData();
    }
  }, [moduleId, videoId, location.pathname]);

  useEffect(() => {
    // Load comments for this video (apenas se for assinante)
    if (videoData?.youtubeId && isSubscriber) {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const videoComments = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(comment => comment.videoId === videoData.youtubeId);
        
        setComments(videoComments);
      });

      return () => unsubscribe();
    }
  }, [videoData?.youtubeId, db, isSubscriber]);

  const handleVideoSelect = (video, index) => {
    if (!isSubscriber) {
      const shouldUpgrade = window.confirm(
        'Este conteúdo é exclusivo para assinantes do Team HIIT.\n\nGostaria de se tornar um assinante para acessar todo o conteúdo?'
      );
      
      if (shouldUpgrade) {
        window.open('https://wa.me/5511999999999?text=Olá! Gostaria de me tornar assinante do Team HIIT', '_blank');
      }
      return;
    }

    console.log('Selecionando vídeo:', video, 'índice:', index);
    
    setCurrentVideoIndex(index);
    setVideoData({
      title: video.title,
      youtubeId: video.youtubeId,
      description: video.description,
      duration: video.duration,
      level: training?.level || 'Todos os níveis',
      instructor: 'Team HIIT',
      category: training?.categories?.[0] || 'Treino'
    });

    // Atualizar URL
    navigate(`/video/${training.id}/${video.id}/${video.youtubeId}`, { replace: true });
  };

  const scrollPlaylist = (direction) => {
    if (playlistRef.current) {
      const scrollAmount = 300;
      playlistRef.current.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Você precisa estar logado para comentar');
      return;
    }

    if (!isSubscriber) {
      alert('Apenas assinantes podem comentar');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setSubmittingComment(true);

    try {
      await addDoc(collection(db, 'comments'), {
        videoId: videoData.youtubeId,
        text: newComment.trim(),
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL || null,
        createdAt: serverTimestamp()
      });

      setNewComment('');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário. Tente novamente.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Agora';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const handleSubscriptionUpgrade = () => {
    window.open('https://wa.me/5511999999999?text=Olá! Gostaria de me tornar assinante do Team HIIT', '_blank');
  };

  if (loading || checkingSubscription) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando vídeo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!videoData || !training) {
    console.error('Dados não encontrados:', { videoData, training });
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
        <Header />
        <div className="container mx-auto px-6 py-8 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Vídeo não encontrado</h1>
            <p className="text-gray-400 mb-6">
              Não foi possível carregar os dados do vídeo. Verifique se o link está correto.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      
      {/* Banner do Programa */}
      <div className="w-full relative" style={{ height: '50vh' }}>
        <img 
          src={`/${training.imageUrl}`}
          alt={training.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/CAPAS TEAM HIIT/COMECE AQUI.png'; // Fallback image
          }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center p-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-2">{training.title}</h1>
            <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
              {training.description || `Programa completo de ${training.title}`}
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm">
                <User className="w-4 h-4 inline mr-1" />
                Team HIIT
              </span>
              <span className="bg-gray-700 text-white px-4 py-2 rounded-full text-sm">
                <Clock className="w-4 h-4 inline mr-1" />
                {training.duration}
              </span>
              <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm">
                {training.sectionTitle}
              </span>
              {isSubscriber && (
                <span className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm flex items-center">
                  <Crown className="w-4 h-4 mr-1" />
                  Assinante
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Botão Voltar */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
        </div>

        {/* Call to Action para não-assinantes */}
        {!isSubscriber && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Crown className="w-8 h-8 mr-4" />
                <div>
                  <h3 className="text-xl font-bold">Conteúdo Exclusivo para Assinantes</h3>
                  <p className="text-white/90">
                    Torne-se assinante para acessar todos os vídeos e treinos do Team HIIT!
                  </p>
                </div>
              </div>
              <button
                onClick={handleSubscriptionUpgrade}
                className="bg-white text-orange-500 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Assinar Agora
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Video Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <h3 className="text-xl font-bold p-6 border-b border-gray-700 text-white">Vídeo do Treino</h3>
              <div className="p-6">
                {isSubscriber ? (
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
                ) : (
                  <div className="relative w-full bg-gray-900 rounded-lg flex items-center justify-center" style={{ paddingBottom: '56.25%' }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <Lock className="w-16 h-16 mb-4 text-gray-400" />
                      <h3 className="text-2xl font-bold mb-2">Conteúdo Exclusivo</h3>
                      <p className="text-gray-300 mb-6 text-center max-w-md">
                        Este vídeo é exclusivo para assinantes do Team HIIT. 
                        Torne-se um assinante para acessar todo o conteúdo!
                      </p>
                      <button
                        onClick={handleSubscriptionUpgrade}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center"
                      >
                        <Crown className="w-5 h-5 mr-2" />
                        Tornar-se Assinante
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section - Apenas para assinantes */}
            {isSubscriber && (
              <div className="bg-gray-800 rounded-xl shadow-lg mt-6">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center">
                    <MessageCircle className="w-6 h-6 mr-3 text-gray-400" />
                    <h3 className="text-xl font-bold text-white">Comentários ({comments.length})</h3>
                  </div>
                </div>

                {/* Add Comment Form */}
                {user ? (
                  <div className="p-6 border-b border-gray-700">
                    <form onSubmit={handleSubmitComment} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=f97316&color=fff`}
                          alt={user.displayName || user.email}
                          className="w-10 h-10 rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Adicione um comentário..."
                          className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          rows="3"
                        />
                        <div className="flex justify-end mt-3">
                          <button
                            type="submit"
                            disabled={!newComment.trim() || submittingComment}
                            className="flex items-center bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {submittingComment ? 'Enviando...' : 'Comentar'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="p-6 border-b border-gray-700 text-center">
                    <p className="text-gray-400 mb-4">Faça login para comentar</p>
                    <button
                      onClick={() => navigate('/auth')}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Fazer Login
                    </button>
                  </div>
                )}

                {/* Comments List */}
                <div className="p-6">
                  {comments.length > 0 ? (
                    <div className="space-y-6">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-4">
                          <div className="flex-shrink-0">
                            <img
                              src={comment.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=f97316&color=fff`}
                              alt={comment.userName}
                              className="w-10 h-10 rounded-full"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold text-white">{comment.userName}</span>
                              <span className="text-sm text-gray-400">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Seja o primeiro a comentar!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Próximos Treinos */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-6 text-white">PRÓXIMOS TREINOS</h3>
              
              <div className="relative">
                {allVideos.length > 3 && (
                  <>
                    <button
                      onClick={() => scrollPlaylist(-1)}
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-1 rounded-full transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollPlaylist(1)}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-1 rounded-full transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                <div 
                  ref={playlistRef}
                  className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide"
                >
                  {allVideos.map((video, index) => {
                    const thumbnailUrl = video.youtubeId ? `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg` : null;
                    const isCurrentVideo = index === currentVideoIndex;

                    return (
                      <div 
                        key={video.id} 
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all relative ${
                          isCurrentVideo 
                            ? 'bg-orange-500/20 border border-orange-500' 
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => handleVideoSelect(video, index)}
                      >
                        {/* Overlay de cadeado para não-assinantes */}
                        {!isSubscriber && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-lg">
                            <Lock className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        <div className="flex-shrink-0 relative w-16 h-12 mr-3">
                          {thumbnailUrl ? (
                            <img 
                              src={thumbnailUrl} 
                              alt={video.title} 
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full bg-gray-600 flex items-center justify-center rounded" style={{ display: thumbnailUrl ? 'none' : 'flex' }}>
                            <Play className="w-4 h-4 text-white" />
                          </div>
                          {isCurrentVideo && (
                            <div className="absolute inset-0 bg-orange-500/30 flex items-center justify-center rounded">
                              <Play className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold text-sm truncate ${
                            isCurrentVideo ? 'text-orange-400' : 'text-white'
                          }`}>
                            {video.title}
                          </h4>
                          <div className="flex items-center mt-1">
                            <Clock className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-gray-400 text-xs">{video.duration}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-6 text-white">Informações do Treino</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div className="flex items-center text-gray-400">
                    <Clock className="w-5 h-5 mr-3" />
                    <span>Duração</span>
                  </div>
                  <span className="font-semibold text-white">{videoData.duration}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div className="flex items-center text-gray-400">
                    <Star className="w-5 h-5 mr-3" />
                    <span>Dificuldade</span>
                  </div>
                  <span className="font-semibold text-white">{videoData.level}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div className="flex items-center text-gray-400">
                    <User className="w-5 h-5 mr-3" />
                    <span>Categoria</span>
                  </div>
                  <span className="font-semibold text-white">{videoData.category}</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center text-gray-400">
                    <Star className="w-5 h-5 mr-3" />
                    <span>Avaliação</span>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="ml-2 text-sm text-gray-400">(4.8)</span>
                  </div>
                </div>
              </div>

              {isSubscriber && (
                <div className="flex items-center space-x-4 mt-6">
                  <button className="flex items-center bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors text-white">
                    <Bookmark className="w-5 h-5 mr-2" />
                    Salvar
                  </button>
                  <button className="flex items-center bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors text-white">
                    <Share2 className="w-5 h-5 mr-2" />
                    Compartilhar
                  </button>
                </div>
              )}
            </div>

            {/* Equipamentos */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
              <h3 className="text-xl font-bold mb-4 text-white">Equipamentos</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-gray-300">Peso corporal</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-gray-300">Tapete de exercício</span>
                </div>
              </div>
            </div>

            {/* Call to Action para não-assinantes */}
            {!isSubscriber && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-6 mt-6">
                <div className="text-center">
                  <Crown className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Torne-se Assinante</h3>
                  <p className="text-white/90 mb-4">
                    Acesse todos os treinos, comentários e conteúdo exclusivo do Team HIIT!
                  </p>
                  <button
                    onClick={handleSubscriptionUpgrade}
                    className="bg-white text-orange-500 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors w-full"
                  >
                    Assinar Agora
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;

