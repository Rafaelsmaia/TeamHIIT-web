import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { 
  Trophy, Target, Calendar, Award, Star, Flame, Zap, 
  Clock, TrendingUp, Medal, Crown, ChevronRight, 
  CheckCircle, Lock, ArrowLeft, BarChart3, Timer
} from 'lucide-react';
import Header from '../components/ui/Header.jsx';

const JornadaHIIT = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userStats, setUserStats] = useState({
    completedWorkouts: 0,
    completedWeeks: 0,
    achievements: 0,
    totalMinutes: 0,
    streak: 0,
    level: 1,
    xp: 0
  });
  const [loading, setLoading] = useState(true);

  // Definição das conquistas/medalhas
  const achievements = [
    {
      id: 'first_workout',
      title: 'Primeiro Passo',
      description: 'Complete seu primeiro treino',
      icon: <Target className="w-8 h-8" />,
      requirement: 1,
      type: 'workouts',
      color: 'from-blue-500 to-blue-600',
      unlocked: false
    },
    {
      id: 'week_warrior',
      title: 'Guerreiro Semanal',
      description: 'Complete uma semana inteira',
      icon: <Calendar className="w-8 h-8" />,
      requirement: 1,
      type: 'weeks',
      color: 'from-green-500 to-green-600',
      unlocked: false
    },
    {
      id: 'fire_starter',
      title: 'Iniciador de Fogo',
      description: 'Complete 5 treinos',
      icon: <Flame className="w-8 h-8" />,
      requirement: 5,
      type: 'workouts',
      color: 'from-orange-500 to-red-500',
      unlocked: false
    },
    {
      id: 'lightning_bolt',
      title: 'Raio Veloz',
      description: 'Complete 10 treinos',
      icon: <Zap className="w-8 h-8" />,
      requirement: 10,
      type: 'workouts',
      color: 'from-yellow-500 to-orange-500',
      unlocked: false
    },
    {
      id: 'time_master',
      title: 'Mestre do Tempo',
      description: 'Acumule 60 minutos de treino',
      icon: <Clock className="w-8 h-8" />,
      requirement: 60,
      type: 'minutes',
      color: 'from-purple-500 to-purple-600',
      unlocked: false
    },
    {
      id: 'streak_master',
      title: 'Sequência Perfeita',
      description: 'Mantenha uma sequência de 7 dias',
      icon: <TrendingUp className="w-8 h-8" />,
      requirement: 7,
      type: 'streak',
      color: 'from-pink-500 to-purple-500',
      unlocked: false
    },
    {
      id: 'month_champion',
      title: 'Campeão Mensal',
      description: 'Complete 4 semanas',
      icon: <Medal className="w-8 h-8" />,
      requirement: 4,
      type: 'weeks',
      color: 'from-indigo-500 to-purple-600',
      unlocked: false
    },
    {
      id: 'hiit_legend',
      title: 'Lenda HIIT',
      description: 'Complete 50 treinos',
      icon: <Crown className="w-8 h-8" />,
      requirement: 50,
      type: 'workouts',
      color: 'from-yellow-400 to-yellow-600',
      unlocked: false
    }
  ];

  // Níveis e XP
  const levels = [
    { level: 1, xpRequired: 0, title: 'Iniciante' },
    { level: 2, xpRequired: 100, title: 'Aprendiz' },
    { level: 3, xpRequired: 250, title: 'Praticante' },
    { level: 4, xpRequired: 500, title: 'Experiente' },
    { level: 5, xpRequired: 1000, title: 'Veterano' },
    { level: 6, xpRequired: 2000, title: 'Expert' },
    { level: 7, xpRequired: 3500, title: 'Mestre' },
    { level: 8, xpRequired: 5000, title: 'Lenda' }
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const stats = {
              completedWorkouts: userData.completedWorkouts || 0,
              completedWeeks: userData.completedWeeks || 0,
              achievements: userData.achievements || 0,
              totalMinutes: userData.totalMinutes || 0,
              streak: userData.streak || 0,
              level: userData.level || 1,
              xp: userData.xp || 0
            };
            setUserStats(stats);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // Calcular conquistas desbloqueadas
  const unlockedAchievements = achievements.map(achievement => {
    let unlocked = false;
    switch (achievement.type) {
      case 'workouts':
        unlocked = userStats.completedWorkouts >= achievement.requirement;
        break;
      case 'weeks':
        unlocked = userStats.completedWeeks >= achievement.requirement;
        break;
      case 'minutes':
        unlocked = userStats.totalMinutes >= achievement.requirement;
        break;
      case 'streak':
        unlocked = userStats.streak >= achievement.requirement;
        break;
    }
    return { ...achievement, unlocked };
  });

  // Calcular nível atual
  const currentLevel = levels.find(level => 
    userStats.xp >= level.xpRequired && 
    (levels[level.level] ? userStats.xp < levels[level.level].xpRequired : true)
  ) || levels[0];

  const nextLevel = levels.find(level => level.level === currentLevel.level + 1);
  const progressToNextLevel = nextLevel ? 
    ((userStats.xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100 : 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      
      <div className="container mx-auto px-6 py-8 pt-20">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/profile')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">Jornada HIIT</h1>
            <p className="text-gray-400">Acompanhe seu progresso e conquistas</p>
          </div>
        </div>

        {/* Nível e XP */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Nível {currentLevel.level}</h2>
              <p className="text-red-100">{currentLevel.title}</p>
            </div>
            <div className="text-right">
              <p className="text-red-100 text-sm">XP</p>
              <p className="text-2xl font-bold text-white">
                {userStats.xp}{nextLevel && ` / ${nextLevel.xpRequired}`}
              </p>
            </div>
          </div>
          
          {nextLevel && (
            <div>
              <div className="flex justify-between text-sm text-red-100 mb-2">
                <span>Progresso para {nextLevel.title}</span>
                <span>{Math.round(progressToNextLevel)}%</span>
              </div>
              <div className="w-full bg-red-800 rounded-full h-3">
                <div 
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${progressToNextLevel}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="text-white" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">{userStats.completedWorkouts}</div>
            <div className="text-sm text-gray-400">Treinos</div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="bg-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="text-white" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">{userStats.completedWeeks}</div>
            <div className="text-sm text-gray-400">Semanas</div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Timer className="text-white" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">{userStats.totalMinutes}</div>
            <div className="text-sm text-gray-400">Minutos</div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <div className="bg-orange-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Flame className="text-white" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">{userStats.streak}</div>
            <div className="text-sm text-gray-400">Sequência</div>
          </div>
        </div>

        {/* Conquistas */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-yellow-500" size={24} />
            <h2 className="text-2xl font-bold text-white">Conquistas</h2>
            <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">
              {unlockedAchievements.filter(a => a.unlocked).length} / {achievements.length}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {unlockedAchievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  achievement.unlocked 
                    ? `bg-gradient-to-br ${achievement.color} border-transparent shadow-lg` 
                    : 'bg-gray-700 border-gray-600'
                }`}
              >
                {!achievement.unlocked && (
                  <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-xl flex items-center justify-center">
                    <Lock className="text-gray-400" size={24} />
                  </div>
                )}
                
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    achievement.unlocked ? 'bg-white bg-opacity-20' : 'bg-gray-600'
                  }`}>
                    <div className={achievement.unlocked ? 'text-white' : 'text-gray-400'}>
                      {achievement.icon}
                    </div>
                  </div>
                  
                  <h3 className={`font-bold mb-1 ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-sm ${achievement.unlocked ? 'text-white text-opacity-80' : 'text-gray-500'}`}>
                    {achievement.description}
                  </p>
                  
                  {achievement.unlocked && (
                    <div className="mt-2">
                      <CheckCircle className="text-white mx-auto" size={20} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos Desafios */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Star className="text-yellow-500" size={24} />
            <h2 className="text-2xl font-bold text-white">Próximos Desafios</h2>
          </div>
          
          <div className="space-y-4">
            {unlockedAchievements
              .filter(achievement => !achievement.unlocked)
              .slice(0, 3)
              .map((achievement) => {
                let progress = 0;
                let current = 0;
                
                switch (achievement.type) {
                  case 'workouts':
                    current = userStats.completedWorkouts;
                    break;
                  case 'weeks':
                    current = userStats.completedWeeks;
                    break;
                  case 'minutes':
                    current = userStats.totalMinutes;
                    break;
                  case 'streak':
                    current = userStats.streak;
                    break;
                }
                
                progress = (current / achievement.requirement) * 100;
                
                return (
                  <div key={achievement.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${achievement.color} flex items-center justify-center`}>
                          <div className="text-white scale-75">
                            {achievement.icon}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{achievement.title}</h3>
                          <p className="text-sm text-gray-400">{achievement.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-400" size={20} />
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Progresso</span>
                      <span>{current} / {achievement.requirement}</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r ${achievement.color} rounded-full h-2 transition-all duration-500`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Motivação */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Continue Assim!</h2>
          <p className="text-purple-100 mb-4">
            {userStats.completedWorkouts === 0 
              ? "Comece sua jornada HIIT hoje mesmo! Cada treino te deixa mais forte."
              : userStats.completedWorkouts < 5
              ? "Você está no caminho certo! Continue treinando para desbloquear novas conquistas."
              : userStats.completedWorkouts < 20
              ? "Incrível progresso! Você está se tornando um verdadeiro atleta HIIT."
              : "Você é uma inspiração! Continue quebrando seus próprios recordes."
            }
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Treinar Agora
          </button>
        </div>
      </div>
    </div>
  );
};

export default JornadaHIIT;