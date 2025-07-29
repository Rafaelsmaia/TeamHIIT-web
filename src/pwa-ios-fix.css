import React, { useState, useEffect } from 'react';

const ImagePreloader = ({ children, onLoadComplete }) => {
  const [loadedImages, setLoadedImages] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Extrair todas as URLs de imagens do trainings.js
  const getAllImageUrls = () => {
    const imageUrls = [];
    
    // Adicionar banner principal
    imageUrls.push('/BANNER PRINCIPAL/TREINOS-GRATIS.png');
    
    // Extrair imagens dos treinos
    if (window.trainingsData && window.trainingsData.sections) {
      window.trainingsData.sections.forEach(section => {
        section.trainings.forEach(training => {
          if (training.imageUrl) {
            imageUrls.push(`/${training.imageUrl}`);
          }
        });
      });
    }
    
    return [...new Set(imageUrls)]; // Remove duplicatas
  };

  const preloadImages = async () => {
    const imageUrls = getAllImageUrls();
    setTotalImages(imageUrls.length);
    
    let loaded = 0;
    
    const loadPromises = imageUrls.map((url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          loaded++;
          setLoadedImages(loaded);
          setLoadingProgress(Math.round((loaded / imageUrls.length) * 100));
          resolve(url);
        };
        
        img.onerror = () => {
          console.warn(`Falha ao carregar imagem: ${url}`);
          loaded++;
          setLoadedImages(loaded);
          setLoadingProgress(Math.round((loaded / imageUrls.length) * 100));
          resolve(url); // Resolve mesmo com erro para não travar
        };
        
        img.src = url;
      });
    });

    try {
      await Promise.all(loadPromises);
      
      // Pequeno delay para suavizar a transição
      setTimeout(() => {
        setIsLoading(false);
        if (onLoadComplete) {
          onLoadComplete();
        }
      }, 500);
      
    } catch (error) {
      console.error('Erro no preload de imagens:', error);
      setIsLoading(false);
      if (onLoadComplete) {
        onLoadComplete();
      }
    }
  };

  useEffect(() => {
    // Aguardar o trainings.js carregar
    const checkTrainingsData = () => {
      if (window.trainingsData) {
        preloadImages();
      } else {
        setTimeout(checkTrainingsData, 100);
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
              Preparando sua experiência de treino...
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
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full" />
            </div>
            
            <div className="flex justify-between text-sm text-gray-400">
              <span>Carregando imagens...</span>
              <span>{loadedImages}/{totalImages}</span>
            </div>
            
            <div className="text-center">
              <span className="text-2xl font-bold text-orange-500">
                {loadingProgress}%
              </span>
            </div>
          </div>

          {/* Indicador de carregamento animado */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>

          {/* Dica motivacional */}
          <div className="text-center text-gray-400 text-sm max-w-sm mx-auto">
            <p>💪 Prepare-se para transformar seu corpo com os melhores treinos HIIT!</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ImagePreloader;

