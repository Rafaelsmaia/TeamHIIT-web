// Sistema de Gerenciamento de Progresso do Usuário

class ProgressManager {
  constructor() {
    this.storageKey = 'teamhiit_user_progress';
  }

  // Salvar progresso do usuário
  saveProgress(progressData) {
    try {
      const currentProgress = this.getProgress();
      const updatedProgress = {
        ...currentProgress,
        lastUpdated: new Date().toISOString(),
        ...progressData
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(updatedProgress));
      return true;
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      return false;
    }
  }

  // Buscar progresso atual
  getProgress() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Erro ao buscar progresso:', error);
      return null;
    }
  }

  // Atualizar progresso de vídeo
  updateVideoProgress(trainingId, moduleId, videoId, videoData) {
    const progressData = {
      trainingId,
      moduleId,
      videoId,
      trainingTitle: videoData.trainingTitle,
      moduleTitle: videoData.moduleTitle,
      videoTitle: videoData.videoTitle,
      thumbnail: videoData.thumbnail,
      currentVideo: videoData.currentVideo,
      totalVideos: videoData.totalVideos,
      completedVideos: videoData.completedVideos,
      timeRemaining: videoData.timeRemaining,
      nextVideos: videoData.nextVideos || []
    };

    return this.saveProgress(progressData);
  }

  // Marcar vídeo como concluído
  markVideoCompleted(trainingId, moduleId, videoId) {
    const currentProgress = this.getProgress();
    if (currentProgress) {
      const completedVideos = currentProgress.completedVideos || [];
      const videoKey = `${trainingId}-${moduleId}-${videoId}`;
      
      if (!completedVideos.includes(videoKey)) {
        completedVideos.push(videoKey);
        return this.saveProgress({
          ...currentProgress,
          completedVideos
        });
      }
    }
    return false;
  }

  // Verificar se vídeo foi concluído
  isVideoCompleted(trainingId, moduleId, videoId) {
    const progress = this.getProgress();
    if (!progress || !progress.completedVideos) return false;
    
    const videoKey = `${trainingId}-${moduleId}-${videoId}`;
    return progress.completedVideos.includes(videoKey);
  }

  // Calcular progresso do módulo
  calculateModuleProgress(trainingId, moduleId, totalVideos) {
    const progress = this.getProgress();
    if (!progress || !progress.completedVideos) return 0;

    const completedInModule = progress.completedVideos.filter(videoKey => 
      videoKey.startsWith(`${trainingId}-${moduleId}-`)
    ).length;

    return Math.round((completedInModule / totalVideos) * 100);
  }

  // Buscar próximo vídeo para assistir
  getNextVideo(trainingData, currentTrainingId, currentModuleId, currentVideoId) {
    try {
      const training = trainingData.find(t => t.id === currentTrainingId);
      if (!training) return null;

      const module = training.modules.find(m => m.id === currentModuleId);
      if (!module) return null;

      const currentVideoIndex = module.videos.findIndex(v => v.id === currentVideoId);
      
      // Próximo vídeo no mesmo módulo
      if (currentVideoIndex < module.videos.length - 1) {
        return {
          trainingId: currentTrainingId,
          moduleId: currentModuleId,
          videoId: module.videos[currentVideoIndex + 1].id,
          video: module.videos[currentVideoIndex + 1]
        };
      }

      // Próximo módulo
      const currentModuleIndex = training.modules.findIndex(m => m.id === currentModuleId);
      if (currentModuleIndex < training.modules.length - 1) {
        const nextModule = training.modules[currentModuleIndex + 1];
        return {
          trainingId: currentTrainingId,
          moduleId: nextModule.id,
          videoId: nextModule.videos[0].id,
          video: nextModule.videos[0]
        };
      }

      return null; // Fim do treino
    } catch (error) {
      console.error('Erro ao buscar próximo vídeo:', error);
      return null;
    }
  }

  // Limpar progresso
  clearProgress() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Erro ao limpar progresso:', error);
      return false;
    }
  }

  // Exportar progresso (para backup)
  exportProgress() {
    return this.getProgress();
  }

  // Importar progresso (de backup)
  importProgress(progressData) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(progressData));
      return true;
    } catch (error) {
      console.error('Erro ao importar progresso:', error);
      return false;
    }
  }

  // Estatísticas do usuário
  getUserStats() {
    const progress = this.getProgress();
    if (!progress) {
      return {
        totalVideosWatched: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        lastActivity: null
      };
    }

    return {
      totalVideosWatched: progress.completedVideos?.length || 0,
      totalTimeSpent: progress.totalTimeSpent || 0,
      currentStreak: progress.currentStreak || 0,
      lastActivity: progress.lastUpdated
    };
  }
}

// Instância singleton
const progressManager = new ProgressManager();

export default progressManager;

