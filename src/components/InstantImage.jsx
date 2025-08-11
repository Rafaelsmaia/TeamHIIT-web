import React, { useState, useEffect } from 'react';

const InstantImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {},
  onLoad,
  onError,
  placeholder = null,
  darkMode = false
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Função para processar URL com encoding se necessário
  const processImageUrl = (url) => {
    if (!url) return '';
    
    // Se a URL contém espaços, fazer encoding
    if (url.includes(' ')) {
      return url.replace(/ /g, '%20');
    }
    
    return url;
  };

  const processedSrc = processImageUrl(src);

  useEffect(() => {
    // Reset states when src changes
    setHasError(false);
    setIsLoaded(false);
    setShowPlaceholder(true);
  }, [src]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    setShowPlaceholder(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    console.warn(`Falha ao carregar imagem: ${src} (processada: ${processedSrc})`);
    setHasError(true);
    setShowPlaceholder(false);
    if (onError) onError(e);
  };

  // Placeholder de carregamento elegante
  const loadingPlaceholder = (
    <div className={`flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`}>
      <div className="text-center">
        <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} animate-pulse`}></div>
        <div className={`w-16 h-2 mx-auto rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} animate-pulse`}></div>
      </div>
    </div>
  );

  // Placeholder de erro elegante
  const errorPlaceholder = (
    <div className={`flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
      <div className="text-center">
        <svg 
          className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" 
          />
        </svg>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Imagem indisponível
        </p>
      </div>
    </div>
  );

  if (hasError) {
    return (
      <div className={`${className}`} style={style}>
        {placeholder || errorPlaceholder}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Placeholder enquanto carrega */}
      {showPlaceholder && (
        <div className="absolute inset-0">
          {placeholder || loadingPlaceholder}
        </div>
      )}
      
      {/* Imagem real */}
      {processedSrc && (
        <img
          src={processedSrc}
          alt={alt}
          className={`w-full h-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectFit: style?.objectFit || 'cover' }}
          onLoad={handleLoad}
          onError={handleError}
          loading="eager"
        />
      )}
    </div>
  );
};

export default InstantImage;

