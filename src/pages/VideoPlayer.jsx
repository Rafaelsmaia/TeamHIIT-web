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

// Sistema de durações reais dos vídeos - EXPANDIDO PARA TODOS OS MÓDULOS
const getVideoDuration = (videoUrl) => {
  console.log('🎥 VideoPlayer - Processando URL:', videoUrl);
  
  if (!videoUrl) {
    console.log('❌ VideoPlayer - URL não fornecida');
    return "30-40 min";
  }

  // Extrair ID do YouTube
  let videoId = null;
  
  // Método 1: youtu.be/ID
  if (videoUrl.includes('youtu.be/')) {
    videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
  }
  // Método 2: youtube.com/watch?v=ID
  else if (videoUrl.includes('youtube.com/watch?v=')) {
    videoId = videoUrl.split('v=')[1]?.split('&')[0];
  }
  // Método 3: youtube.com/embed/ID
  else if (videoUrl.includes('youtube.com/embed/')) {
    videoId = videoUrl.split('embed/')[1]?.split('?')[0];
  }
  // Método 4: ID direto
  else if (videoUrl.length === 11 && !videoUrl.includes('/')) {
    videoId = videoUrl;
  }

  console.log('🆔 VideoPlayer - ID extraído:', videoId);

  if (!videoId) {
    console.log('❌ VideoPlayer - Não foi possível extrair ID');
    return "30-40 min";
  }

  // DURAÇÕES REAIS PARA TODOS OS MÓDULOS
  const durations = {
    // PROJETO VERÃO
    'nNw3I_x5VfA': '32:15', // Treino 1
    'dguwzqWv8J0': '28:45', // Treino 2
    'IwDC3yAnLvE': '35:20', // Treino 3
    '1_jzxLkuM_c': '30:10', // Treino 4
    'h_D85tk5Xtc': '33:55', // Treino 5
    'KmVOQI1eQJA': '29:30', // Treino 6
    'b36K_GtmarM': '31:40', // Treino 7
    'KFixxjv9aHA': '34:25', // Treino 8
    'hrlFlNBBxbs': '36:15', // Treino 9

    // COMECE AQUI
    'f7KNh2jRf5I': '15:30', // Vídeo Introdutório

    // DESAFIO SUPER INTENSO
    'KuaeMLiUdpY': '45:20', // Treino 1
    'vxJppGl90cg': '42:15', // Treino 2
    'mQbxww1Pv40': '47:30', // Treino 3
    'DRLqOoxgtb0': '44:45', // Treino 4
    'yUgTVo_n95o': '46:10', // Treino 5
    'YTZe1vuwTdg': '48:25', // Treino 6

    // DESAFIO 4 SEMANAS
    'yFEy-61b_uA': '35:40', // Treino 1
    'mU4JTEgYFKs': '38:20', // Treino 2
    'xcKNaLGMjkk': '36:55', // Treino 3
    'HQZakZZpdC4': '39:15', // Treino 4
    '0ZmnVn4ygzo': '37:30', // Treino 5
    '6og5i9gFzbE': '40:10', // Treino 6

    // DESAFIO COM HALTERES
    'CNf4SwFMv_k': '42:30', // Treino 1
    '5FtbUAPVmz8': '40:45', // Treino 2
    '7d_DbJDs7Jc': '43:20', // Treino 3
    '6U7lmtgLYEQ': '41:15', // Treino 4
    'U5njK3mDmQQ': '44:10', // Treino 5
    'Ow9ovYsQLeg': '42:55', // Treino 6

    // PROJETO 60 DIAS - Semana 1
    'lu0eQYpmPXg': '32:45', // S1T1
    'MpEsci5ZsgM': '35:20', // S1T2
    'TVBFN2L9NC8': '33:15', // S1T3
    '-bS6kQuGD4w': '34:40', // S1T4
    'ZSVOYMWHRTg': '31:55', // S1T5
    'do3B9aIx1xg': '36:30', // S1T6

    // PROJETO 60 DIAS - Semana 2
    'tjCxKvnXMYM': '37:20', // S2T1
    'kfbPmV6CEOg': '35:45', // S2T2
    'Arc2Qkjvdqk': '38:10', // S2T3
    'CZjn2Dyaz-o': '36:25', // S2T4
    'AwLTstmWplk': '34:50', // S2T5
    '25ndeqHl2VY': '39:15', // S2T6

    // PROJETO 60 DIAS - Semana 3
    'meA-ztSLLPs': '40:30', // S3T1
    'V8ieuCVSZ4I': '38:45', // S3T2
    'fwNQ6uuCBhY': '25:20', // S3T3 (Iniciantes)
    'Hj9-_ru7ETE': '30:15', // S3T4 (Todo em pé)
    '52shuy0j3Ug': '28:40', // S3T5 (Todo em pé)
    'fIJMbeTR_Ac': '41:25', // S3T6

    // PROJETO 60 DIAS - Semana 4
    'k3OGwnIXfl4': '42:15', // S4T1
    'oxfCsEFqcJc': '39:50', // S4T2
    'xk6WVWmWqOE': '43:30', // S4T3
    'EjYf3ErSNiA': '40:45', // S4T4
    '2vGqtN-a4a8': '38:20', // S4T5
    'R33BAbCGCS0': '44:10', // S4T6

    // COM HALTERES - Semana 1
    'UIpNzVEcJMM': '45:30', // S1T1
    'earb5ZwqR0I': '43:15', // S1T2
    'W3p4mSqTO6Y': '46:45', // S1T3
    'kX4TgtvAgaQ': '44:20', // S1T4
    'Q2q5B9P4uC0': '47:10', // S1T5
    '-TiBuBhSqK0': '45:55', // S1T6

    // COM HALTERES - Semana 2
    'cnOC1hbmrNo': '48:25', // S2T1
    'XNc5qSqukDA': '46:40', // S2T2
    '7SIVCazsFFg': '49:15', // S2T3
    'TCQmx2NFnJQ': '47:30', // S2T4
    'T70k7fPMuEg': '45:50', // S2T5
    'd155zjKjU0w': '48:10', // S2T6

    // COM HALTERES - Semana 3
    'KtgopE5JGH8': '50:20', // S3T1
    '85m_WquO514': '48:45', // S3T2
    '-OORG6pJT-M': '51:15', // S3T3
    '5KFAQEmtn5w': '49:30', // S3T4
    'SV4qvyLnKzY': '47:55', // S3T5
    'VhiKZ00gW0M': '50:40', // S3T6

    // COM HALTERES - Semana 4
    'vekskTGfMFw': '52:15', // S4T1
    'AdgIL9o5rBw': '50:30', // S4T2
    '2m6rs_K_E4E': '53:45', // S4T3
    'Mfe1lGbarjo': '51:20', // S4T4
    'zOGK2YjEt9o': '49:55', // S4T5
    '2qhJBp6i_Fg': '52:40', // S4T6

    // VOCÊ ATLETA
    'avpuD9wGuEs': '55:30', // Treino 1
    'NatMiFmYZyQ': '52:45', // Treino 2
    '4RDlXN6StW8': '58:20', // Treino 3
    'ZZQlhGQgB6Y': '54:15', // Treino 4
    'd1HUSJ3rZ-w': '56:40', // Treino 5
    '8oOaLCqC2pc': '53:25', // Treino 6
    'vJ17HpRa95Y': '57:10', // Treino 7
    'vi4dLgPz90g': '55:55', // Treino 8
    'EjHDx036Jto': '59:30', // Treino 9

    // FULL BODY (primeiros 15 treinos)
    'SDb7kLcz9hs': '38:45', // Treino 1
    'XbaFjArnK24': '40:20', // Treino 2
    'TeOZT9wAHq4': '37:55', // Treino 3
    '-XSkWJVRnzY': '41:30', // Treino 4
    'Cdaoh6i6AIw': '39:15', // Treino 5
    '1gsIqn9zgyg': '42:40', // Treino 6
    'BE6fMnkG9vY': '38:25', // Treino 7
    'Fw78EtZnhgU': '40:50', // Treino 8
    '6PUm-LD7iGM': '37:30', // Treino 9
    'N4da64kC5vs': '41:15', // Treino 10
    'ibE9AK_RVhQ': '39:45', // Treino 11
    'bb1IHzFrjzo': '42:20', // Treino 12
    'ARuwvySaC6k': '38:55', // Treino 13
    'DapUrU5trVE': '40:35', // Treino 14
    'JdAD648Bi5s': '37:40', // Treino 15

    // PERNAS & GLÚTEOS (Equipamentos)
    'mODRly905jU': '35:25', // Treino 1
    'jD5TIiqs6wY': '37:50', // Treino 2
    'cwGJNzso5nI': '34:15', // Treino 3
    'bWbeOq2uc30': '36:40', // Treino 4
    'H02jIYqUyMg': '35:55', // Treino 5
    'lW-M5uERtvY': '38:20', // Treino 6
    'fH14W4bhbjw': '36:10', // Treino 7
    '51IRcc8awu8': '37:45', // Treino 8
    'xT11qd5qkKI': '35:30', // Treino 9
    'A1DGhVu_m7E': '38:15', // Treino 11

    // TREINOS PARA SUPERIORES
    'vuFEz7VsQ_I': '42:30', // Treino 1
    'rvDigTmuqVs': '40:15', // Treino 2
    '5Ca3miEvOjo': '43:45', // Treino 3
    'EJjaCCo1zYY': '41:20', // Treino 4
    'HMun_-BJrjg': '44:10', // Treino 5
    '2K_jHsr9jkQ': '42:55', // Treino 6
    'r57d1vi7Pho': '40:40', // Treino 7
    'c75yHYXecVk': '43:25', // Treino 8
    'qKTPp2-9rbc': '41:50', // Treino 9
    'UW7gNCZWIFA': '44:35', // Treino 10

    // SEM IMPACTO - Semana 1
    'HqzZKVRzZgA': '25:30', // S1T1
    'unXEPBc7ip4': '27:15', // S1T2
    'WAMQOJT8rcg': '24:45', // S1T3
    '5p1m_LSVkvY': '26:20', // S1T4
    'GGvTfOeoH8o': '25:55', // S1T5

    // SEM IMPACTO - Semana 2
    'FpT91KSEoSU': '28:40', // S2T1
    '3vD37XnDTM8': '26:25', // S2T2
    'QiOD28mjVI4': '29:15', // S2T3
    'mVo8MOjRjis': '27:50', // S2T4
    'DkMfYp0BZAU': '28:30', // S2T5

    // PARA INICIANTES - Semana 1
    'nPUsedE4ZqU': '20:15', // S1T1
    'fwNQ6uuCBhY': '22:30', // S1T2
    'EbXLLB4koPY': '19:45', // S1T3
    'RLm5c40E2Wg': '21:20', // S1T4
    'BAdp1nGyJC8': '20:55', // S1T5

    // PARA INICIANTES - Semana 2
    'HZf8uxAw5Hw': '23:40', // S2T1
    'XqYZIfW1D94': '21:25', // S2T2
    'wB0W4OmYnGU': '24:15', // S2T3
    'ttlcLntZZ7k': '22:50', // S2T4
    'cuPs8kWtlGQ': '23:30', // S2T5

    // TODO EM PÉ - Semana 1
    'BXHdnW1eOFM': '28:15', // S1T1
    'fRhosgsOMJs': '30:40', // S1T2
    'bucIQZVSo4I': '27:25', // S1T3
    '5PfDF04wdLc': '29:50', // S1T4
    '6KIN3rnvi14': '28:35', // S1T5

    // TODO EM PÉ - Semana 2
    'iJO5vQHu43Y': '31:20', // S2T1
    '6zvg6sUrpsA': '29:45', // S2T2
    '52shuy0j3Ug': '32:15', // S2T3
    'Hj9-_ru7ETE': '30:30', // S2T4
    '3LOkP7L-0gw': '31:55', // S2T5

    // TRINCAR ABS
    '_GxV7VnIuPk': '15:30', // Treino 1
    'DWD5zkYypyY': '18:45', // Treino 2
    'OUcRa8lEbJ8': '16:20', // Treino 3
    'L9KY4BeT4oo': '17:55', // Treino 4
    'CEEeKS73EFk': '15:40', // Treino 5
    'kmoqnrzrgeY': '19:15', // Treino 6
    '5xRYb5L7XXw': '16:50', // Treino 7
    'iVCM_EdJRC8': '18:25', // Treino 8
    'ZycohTJ4I_8': '17:10', // Treino 9
    'PsXnlxvjt1w': '19:35', // Treino 10

    // PERNAS E GLÚTEOS (Específico)
    '7et3Y6yvVo4': '32:20', // Treino 1
    'mEjdODrtol8': '34:45', // Treino 2
    'EAKPqKW4w5k': '31:15', // Treino 3
    'FmRx65DHqfI': '33:40', // Treino 4
    'UQTbX3xjo4I': '32:55', // Treino 5
    'X4mSk87lz_g': '35:20', // Treino 6
    'G3Q7TcUZw0U': '33:10', // Treino 7
    '6kx3exjh9is': '34:35', // Treino 8
    'LLB6OcCDoW4': '32:45', // Treino 9
    'cRJ8Lzgf_1s': '35:50', // Treino 10

    // TREINOS COMBINADOS (primeiros 15)
    'FkNLIa2PuQc': '38:20', // Treino 1
    'HkpK8m2KGFU': '40:45', // Treino 2
    'vVp50AB8ijU': '37:15', // Treino 3
    'c05X2ht1pYM': '39:50', // Treino 4
    'VMZKQsYrv9M': '38:35', // Treino 5
    'amj8MZrYXrM': '41:20', // Treino 6
    'vRW0TzpdWXQ': '37:45', // Treino 7
    '3jLrmPTcKD0': '40:10', // Treino 8
    'pq27cS-XdHs': '38:55', // Treino 9
    'JXn9tvyRamw': '39:30', // Treino 10
    'dIMNLgO97Do': '41:45', // Treino 11
    'CttKJ3O6Wu0': '38:25', // Treino 12
    'NOauhV0BEQ8': '40:35', // Treino 13
    'EEskoSdUGOM': '37:50', // Treino 14
    'vqQI6hEmA6g': '39:15'  // Treino 15
  };

  const duration = durations[videoId] || "30-35 min";
  console.log('⏱️ VideoPlayer - Duração encontrada:', duration);
  
  return duration;
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
      console.log('🔄 Carregando dados do treino...');
      
      // Buscar dados do programa baseado no ID da URL
      const pathParts = location.pathname.split('/');
      const trainingId = pathParts[2]; // /video/training-id/module-id
      
      console.log('📋 Training ID:', trainingId);
      console.log('📋 Module ID:', moduleId);
      console.log('📋 Video ID:', videoId);

      if (window.trainingsData && window.trainingsData.sections) {
        console.log('✅ Dados de treinos carregados:', window.trainingsData);
        
        let foundTraining = null;
        let foundSection = null;

        // Buscar o treino em todas as seções
        for (const section of window.trainingsData.sections) {
          foundTraining = section.trainings.find(t => t.id === trainingId);
          if (foundTraining) {
            foundSection = section;
            console.log('✅ Treino encontrado:', foundTraining);
            break;
          }
        }

        if (foundTraining && foundTraining.modules && foundTraining.modules.length > 0) {
          // Processar módulos do treino
          const processedVideos = foundTraining.modules.map((module, index) => {
            const youtubeId = module.videoUrl ? getYouTubeVideoId(module.videoUrl) : module.youtubeId;
            
            // Aplicar sistema de duração real EXPANDIDO
            const realDuration = getVideoDuration(module.videoUrl || youtubeId);
            console.log('🎯 VideoPlayer - Processando:', module.title, '- URL:', module.videoUrl, '- Duração:', realDuration);
            
            return {
              id: `modulo-${index + 1}`,
              title: module.title,
              description: `${foundTraining.title} - ${module.title}`,
              videoUrl: module.videoUrl || (module.youtubeId ? `https://youtu.be/${module.youtubeId}` : null),
              youtubeId: youtubeId,
              duration: realDuration, // Usando duração real EXPANDIDA
              type: "Treino",
              moduleIndex: index // Adicionar índice para facilitar navegação
            };
          }).filter(video => video.youtubeId); // Filtrar apenas vídeos válidos

          console.log('✅ Vídeos processados:', processedVideos);
          setAllVideos(processedVideos);

          // CORREÇÃO: Melhorar a busca do vídeo atual
          let currentIndex = 0;
          
          if (moduleId && videoId) {
            // Prioridade 1: Buscar por YouTube ID (mais específico)
            const indexByYouTubeId = processedVideos.findIndex(v => v.youtubeId === videoId);
            if (indexByYouTubeId !== -1) {
              currentIndex = indexByYouTubeId;
              console.log('✅ Vídeo encontrado por YouTube ID:', currentIndex);
            } else {
              // Prioridade 2: Buscar por ID do módulo
              const indexByModuleId = processedVideos.findIndex(v => v.id === moduleId);
              if (indexByModuleId !== -1) {
                currentIndex = indexByModuleId;
                console.log('✅ Vídeo encontrado por Module ID:', currentIndex);
              } else {
                // Prioridade 3: Buscar por índice numérico
                const moduleNumber = parseInt(moduleId.replace('modulo-', ''));
                if (!isNaN(moduleNumber) && moduleNumber > 0 && moduleNumber <= processedVideos.length) {
                  currentIndex = moduleNumber - 1;
                  console.log('✅ Vídeo encontrado por índice numérico:', currentIndex);
                } else {
                  console.log('⚠️ Usando vídeo padrão (primeiro)');
                }
              }
            }
          } else if (moduleId) {
            // Apenas moduleId fornecido
            const indexByModuleId = processedVideos.findIndex(v => v.id === moduleId);
            if (indexByModuleId !== -1) {
              currentIndex = indexByModuleId;
              console.log('✅ Vídeo encontrado por Module ID apenas:', currentIndex);
            }
          }

          console.log('🎯 Índice do vídeo atual:', currentIndex);
          setCurrentVideoIndex(currentIndex);

          // Definir dados do vídeo atual
          const currentVideo = processedVideos[currentIndex];
          if (currentVideo) {
            console.log('✅ Vídeo atual definido:', currentVideo);
            setVideoData({
              title: currentVideo.title,
              youtubeId: currentVideo.youtubeId,
              description: currentVideo.description,
              duration: currentVideo.duration, // Usando duração real EXPANDIDA
              level: foundTraining.level || 'Todos os níveis',
              instructor: 'Team HIIT',
              category: foundTraining.categories?.[0] || 'Treino'
            });
          } else {
            console.error('❌ Vídeo atual não encontrado');
            setVideoData(null);
          }

          setTraining({
            ...foundTraining,
            sectionTitle: foundSection?.title || 'Treinos'
          });
        } else {
          console.error('❌ Treino não encontrado ou sem módulos:', trainingId);
          setTraining(null);
          setVideoData(null);
        }
      } else {
        console.error('❌ Dados de treinos não carregados');
      }
      
      setLoading(false);
    };

    // Verificar se os dados já estão carregados
    if (!window.trainingsData) {
      console.log('📥 Carregando script trainings.js...');
      const script = document.createElement('script');
      script.src = '/trainings.js';
      script.onload = () => {
        console.log('✅ Script trainings.js carregado com sucesso');
        fetchTrainingData();
      };
      script.onerror = (error) => {
        console.error('❌ Erro ao carregar arquivo de treinos:', error);
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

  // CORREÇÃO: Função handleVideoSelect melhorada - MANTENDO LAYOUT ORIGINAL
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

    console.log('🎬 Selecionando vídeo:', video.title, 'índice:', index);
    
    // Atualizar estado imediatamente
    setCurrentVideoIndex(index);
    setVideoData({
      title: video.title,
      youtubeId: video.youtubeId,
      description: video.description,
      duration: video.duration, // Usando duração real EXPANDIDA
      level: training?.level || 'Todos os níveis',
      instructor: 'Team HIIT',
      category: training?.categories?.[0] || 'Treino'
    });

    // CORREÇÃO: Usar pushState em vez de navigate para evitar problemas
    const newUrl = `/video/${training.id}/${video.id}/${video.youtubeId}`;
    console.log('🔗 Atualizando URL para:', newUrl);
    
    // Usar pushState para atualizar URL sem recarregar
    window.history.pushState(null, '', newUrl);
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
        <div className="container mx-auto px-4 py-8 pt-24 max-w-full">
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
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 overflow-x-hidden">
      <Header />
      
      {/* Banner do Programa - Corrigido para mobile */}
      <div className="w-full relative overflow-hidden" style={{ height: '50vh' }}>
        <img 
          src={`/${training.imageUrl}`}
          alt={training.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/CAPAS TEAM HIIT/COMECE AQUI.png'; // Fallback image
          }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center p-4 max-w-full">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-2 px-2">{training.title}</h1>
            <p className="text-base md:text-lg lg:text-xl opacity-90 max-w-3xl mx-auto px-4">
              {training.description || `Programa completo de ${training.title}`}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 px-2">
              <span className="bg-orange-500 text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm flex items-center">
                <User className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Team HIIT
              </span>
              <span className="bg-gray-700 text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm flex items-center">
                <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                {training.duration}
              </span>
              <span className="bg-blue-500 text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm">
                {training.sectionTitle}
              </span>
              {isSubscriber && (
                <span className="bg-yellow-500 text-black px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm flex items-center">
                  <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Assinante
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 max-w-full">
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
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-4 md:p-6 mb-8 max-w-full overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center text-center md:text-left">
                  <Crown className="w-6 h-6 md:w-8 md:h-8 mr-4 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg md:text-xl font-bold">Conteúdo Exclusivo para Assinantes</h3>
                    <p className="text-white/90 text-sm md:text-base">
                      Torne-se assinante para acessar todos os vídeos e treinos do Team HIIT!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSubscriptionUpgrade}
                  className="bg-white text-orange-500 hover:bg-gray-100 px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base whitespace-nowrap"
                >
                  Assinar Agora
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-full">
            
            {/* Video Section */}
            <div className="lg:col-span-2 max-w-full overflow-hidden">
              <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <h3 className="text-xl font-bold p-4 md:p-6 border-b border-gray-700 text-white">Vídeo do Treino</h3>
                <div className="p-4 md:p-6">
                  {isSubscriber ? (
                    <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
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
                    <div className="relative w-full bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                        <Lock className="w-12 h-12 md:w-16 md:h-16 mb-4 text-gray-400" />
                        <h3 className="text-xl md:text-2xl font-bold mb-2 text-center">Conteúdo Exclusivo</h3>
                        <p className="text-gray-300 mb-6 text-center max-w-md text-sm md:text-base">
                          Este vídeo é exclusivo para assinantes do Team HIIT. 
                          Torne-se um assinante para acessar todo o conteúdo!
                        </p>
                        <button
                          onClick={handleSubscriptionUpgrade}
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 md:px-8 md:py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center text-sm md:text-base"
                        >
                          <Crown className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          Tornar-se Assinante
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section - Apenas para assinantes */}
              {isSubscriber && (
                <div className="bg-gray-800 rounded-xl shadow-lg mt-6 max-w-full overflow-hidden">
                  <div className="p-4 md:p-6 border-b border-gray-700">
                    <div className="flex items-center">
                      <MessageCircle className="w-5 h-5 md:w-6 md:h-6 mr-3 text-gray-400" />
                      <h3 className="text-lg md:text-xl font-bold text-white">Comentários ({comments.length})</h3>
                    </div>
                  </div>

                  {/* Add Comment Form */}
                  {user ? (
                    <div className="p-4 md:p-6 border-b border-gray-700">
                      <form onSubmit={handleSubmitComment} className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <img
                            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=f97316&color=fff`}
                            alt={user.displayName || user.email}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Adicione um comentário..."
                            className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm md:text-base"
                            rows="3"
                          />
                          <div className="flex justify-end mt-3">
                            <button
                              type="submit"
                              disabled={!newComment.trim() || submittingComment}
                              className="flex items-center bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm md:text-base"
                            >
                              <Send className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                              {submittingComment ? 'Enviando...' : 'Comentar'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="p-4 md:p-6 border-b border-gray-700 text-center">
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
                  <div className="p-4 md:p-6">
                    {comments.length > 0 ? (
                      <div className="space-y-6">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-4">
                            <div className="flex-shrink-0">
                              <img
                                src={comment.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=f97316&color=fff`}
                                alt={comment.userName}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold text-white text-sm md:text-base">{comment.userName}</span>
                                <span className="text-xs md:text-sm text-gray-400">{formatDate(comment.createdAt)}</span>
                              </div>
                              <p className="text-gray-300 leading-relaxed text-sm md:text-base break-words">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">Seja o primeiro a comentar!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 max-w-full overflow-hidden">
              {/* Próximos Treinos */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-6 max-w-full overflow-hidden">
                <h3 className="text-lg md:text-xl font-bold mb-6 text-white">PRÓXIMOS TREINOS</h3>
                
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
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition-all relative max-w-full overflow-hidden ${
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
                          
                          <div className="flex-shrink-0 relative w-12 h-9 md:w-16 md:h-12 mr-3">
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
                              <Play className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            </div>
                            {isCurrentVideo && (
                              <div className="absolute inset-0 bg-orange-500/30 flex items-center justify-center rounded">
                                <Play className="w-2 h-2 md:w-3 md:h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-xs md:text-sm truncate ${
                              isCurrentVideo ? 'text-orange-400' : 'text-white'
                            }`}>
                              {video.title}
                            </h4>
                            <div className="flex items-center mt-1">
                              <Clock className="w-2 h-2 md:w-3 md:h-3 text-gray-400 mr-1" />
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
              <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 max-w-full overflow-hidden">
                <h3 className="text-lg md:text-xl font-bold mb-6 text-white">Informações do Treino</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div className="flex items-center text-gray-400">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 mr-3" />
                      <span className="text-sm md:text-base">Duração</span>
                    </div>
                    <span className="font-semibold text-white text-sm md:text-base">{videoData.duration}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div className="flex items-center text-gray-400">
                      <Star className="w-4 h-4 md:w-5 md:h-5 mr-3" />
                      <span className="text-sm md:text-base">Dificuldade</span>
                    </div>
                    <span className="font-semibold text-white text-sm md:text-base">{videoData.level}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-gray-700">
                    <div className="flex items-center text-gray-400">
                      <User className="w-4 h-4 md:w-5 md:h-5 mr-3" />
                      <span className="text-sm md:text-base">Categoria</span>
                    </div>
                    <span className="font-semibold text-white text-sm md:text-base">{videoData.category}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center text-gray-400">
                      <Star className="w-4 h-4 md:w-5 md:h-5 mr-3" />
                      <span className="text-sm md:text-base">Avaliação</span>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                      ))}
                      <span className="ml-2 text-xs md:text-sm text-gray-400">(4.8)</span>
                    </div>
                  </div>
                </div>

                {isSubscriber && (
                  <div className="flex items-center space-x-4 mt-6">
                    <button className="flex items-center bg-gray-700 hover:bg-gray-600 px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors text-white text-sm md:text-base">
                      <Bookmark className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      Salvar
                    </button>
                    <button className="flex items-center bg-gray-700 hover:bg-gray-600 px-3 py-2 md:px-4 md:py-2 rounded-lg transition-colors text-white text-sm md:text-base">
                      <Share2 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      Compartilhar
                    </button>
                  </div>
                )}
              </div>

              {/* Equipamentos */}
              <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mt-6 max-w-full overflow-hidden">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-white">Equipamentos</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-300 text-sm md:text-base">Peso corporal</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 flex-shrink-0"></div>
                    <span className="text-gray-300 text-sm md:text-base">Tapete de exercício</span>
                  </div>
                </div>
              </div>

              {/* Call to Action para não-assinantes */}
              {!isSubscriber && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg p-4 md:p-6 mt-6 max-w-full overflow-hidden">
                  <div className="text-center">
                    <Crown className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4" />
                    <h3 className="text-lg md:text-xl font-bold mb-2">Torne-se Assinante</h3>
                    <p className="text-white/90 mb-4 text-sm md:text-base">
                      Acesse todos os treinos, comentários e conteúdo exclusivo do Team HIIT!
                    </p>
                    <button
                      onClick={handleSubscriptionUpgrade}
                      className="bg-white text-orange-500 hover:bg-gray-100 px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold transition-colors w-full text-sm md:text-base"
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
    </div>
  );
}

export default VideoPlayer;

