import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, User, Star, Bookmark, Share2, Play, Send, MessageCircle, Lock, Crown } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import Header from '../components/ui/Header.jsx';

function VideoPlayer() {
  const { moduleId, videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
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
    // Redirecionar para página de assinatura ou contato
    window.open('https://wa.me/5511999999999?text=Olá! Gostaria de me tornar assinante do Team HIIT', '_blank');
  };

  if (loading || checkingSubscription) {
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
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{videoData.category}</span>
            {isSubscriber && (
              <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-sm ml-2 flex items-center">
                <Crown className="w-4 h-4 mr-1" />
                Assinante
              </span>
            )}
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
          
          {isSubscriber && (
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
          )}
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
              <div className="bg-white rounded-xl shadow-lg mt-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <MessageCircle className="w-6 h-6 mr-3 text-gray-600" />
                    <h3 className="text-xl font-bold">Comentários ({comments.length})</h3>
                  </div>
                </div>

                {/* Add Comment Form */}
                {user ? (
                  <div className="p-6 border-b border-gray-200">
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
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          rows="3"
                        />
                        <div className="flex justify-end mt-3">
                          <button
                            type="submit"
                            disabled={!newComment.trim() || submittingComment}
                            className="flex items-center bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {submittingComment ? 'Enviando...' : 'Comentar'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="p-6 border-b border-gray-200 text-center">
                    <p className="text-gray-600 mb-4">Faça login para comentar</p>
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
                              <span className="font-semibold text-gray-800">{comment.userName}</span>
                              <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Seja o primeiro a comentar!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
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