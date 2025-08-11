import React, { useState, useEffect } from 'react';

const ImagePreloader = ({ children, onLoadComplete }) => {
  const [loadedImages, setLoadedImages] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('Iniciando...');

  // Extrair apenas imagens que realmente existem nos dados
  const getAllImageUrls = () => {
    const imageUrls = new Set();
    
    // FASE 1: Imagens críticas conhecidas
    const criticalImages = [
      '/BANNER PRINCIPAL/TREINOS-GRATIS.png',
      '/icone team hiit.png'
    ];
    
    criticalImages.forEach(url => imageUrls.add(url));
    
    // FASE 2: Apenas imagens dos treinos que existem nos dados
    if (window.trainingsData && window.trainingsData.sections) {
      window.trainingsData.sections.forEach(section => {
        section.trainings.forEach(training => {
          if (training.imageUrl) {
            imageUrls.add(`/${training.imageUrl}`);
          }
        });
      });
    }
    
    return Array.from(imageUrls);
  };

  // Preload inteligente com validação
  const preloadImages = async () => {
    const imageUrls = getAllImageUrls();
    setTotalImages(imageUrls.length);
    setCurrentPhase(`Carregando ${imageUrls.length} imagens...`);
    
    let loaded = 0;
    const maxConcurrent = 6; // Reduzido para ser mais conservador
    
    // Função para carregar uma imagem com timeout
    const loadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        let timeoutId;
        
        const handleComplete = (success = true) => {
          if (timeoutId) clearTimeout(timeoutId);
          loaded++;
          setLoadedImages(loaded);
          setLoadingProgress(Math.round((loaded / imageUrls.length) * 100));
          
          // Atualizar fase baseada no progresso
          if (loaded < imageUrls.length * 0.5) {
            setCurrentPhase('Carregando imagens principais...');
          } else if (loaded < imageUrls.length * 0.8) {
            setCurrentPhase('Carregando cards de treino...');
          } else {
            setCurrentPhase('Finalizando...');
          }
          
          resolve({ url, success });
        };
        
        // Timeout de 5 segundos por imagem
        timeoutId = setTimeout(() => {
          console.warn(`Timeout ao carregar: ${url}`);
          handleComplete(false);
        }, 5000);
        
        img.onload = () => handleComplete(true);
        img.onerror = () => {
          console.warn(`Falha ao carregar: ${url}`);
          handleComplete(false);
        };
        
        img.src = url;
      });
    };
    
    try {
      // Carregar em lotes menores para evitar sobrecarga
      const batches = [];
      for (let i = 0; i < imageUrls.length; i += maxConcurrent) {
        batches.push(imageUrls.slice(i, i + maxConcurrent));
      }
      
      for (const batch of batches) {
        await Promise.all(batch.map(loadImage));
      }
      
      setCurrentPhase('Preparando interface...');
      
      // Delay mínimo para suavizar transição
      setTimeout(() => {
        setIsLoading(false);
        if (onLoadComplete) {
          onLoadComplete();
        }
      }, 500);
      
    } catch (error) {
      console.error('Erro no preload:', error);
      // Mesmo com erro, continuar para não travar a aplicação
      setTimeout(() => {
        setIsLoading(false);
        if (onLoadComplete) {
          onLoadComplete();
        }
      }, 1000);
    }
  };

  useEffect(() => {
    // Aguardar trainings.js carregar com timeout
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos máximo
    
    const checkTrainingsData = () => {
      attempts++;
      
      if (window.trainingsData) {
        preloadImages();
      } else if (attempts < maxAttempts) {
        setTimeout(checkTrainingsData, 100);
      } else {
        // Se não conseguir carregar os dados, continuar sem preload
        console.warn('Timeout ao aguardar trainings.js');
        setIsLoading(false);
        if (onLoadComplete) {
          onLoadComplete();
        }
      }
    };
    
    checkTrainingsData();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center z-50">
        <div className="text-center space-y-8 px-6">
          {/* Logo/Título */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
              Team<span className="text-orange-500">HIIT</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Preparando sua experiência...
            </p>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full max-w-md mx-auto space-y-4">
            <div className="relative">
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-400">
              <span className="truncate">{currentPhase}</span>
              <span className="font-mono">{loadedImages}/{totalImages}</span>
            </div>
            
            <div className="text-center">
              <span className="text-2xl font-bold text-orange-500 font-mono">
                {loadingProgress}%
              </span>
            </div>
          </div>

          {/* Indicador de carregamento */}
          <div className="flex justify-center space-x-2">
            {[0, 150, 300].map((delay, index) => (
              <div 
                key={index}
                className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" 
                style={{ animationDelay: `${delay}ms` }} 
              />
            ))}
          </div>

          {/* Mensagem motivacional */}
          <div className="text-center text-gray-400 text-sm max-w-sm mx-auto">
            <p>💪 Carregando os melhores treinos para você!</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ImagePreloader;

