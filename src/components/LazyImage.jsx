import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {},
  onLoad,
  onError,
  placeholder = null
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const currentImg = imgRef.current;
    
    if (!currentImg) return;

    // Configuração MUITO mais agressiva para carrosséis
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0, // 0% - qualquer pixel visível já carrega
        rootMargin: '500px' // Margem MUITO grande - carrega antes mesmo de aparecer
      }
    );

    observerRef.current.observe(currentImg);

    return () => {
      if (observerRef.current && currentImg) {
        observerRef.current.unobserve(currentImg);
      }
    };
  }, []);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  // Placeholder padrão quando há erro
  const defaultErrorPlaceholder = (
    <div 
      className={`flex items-center justify-center bg-gray-200 ${className}`}
      style={style}
    >
      <div className="text-center text-gray-500">
        <svg 
          className="w-8 h-8 mx-auto mb-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
        <p className="text-xs">Erro ao carregar imagem</p>
      </div>
    </div>
  );

  // Se há erro, mostrar placeholder de erro
  if (hasError) {
    return placeholder || defaultErrorPlaceholder;
  }

  return (
    <div ref={imgRef} className="relative">
      {/* Placeholder enquanto não carregou */}
      {!isLoaded && (
        <div 
          className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${className}`}
          style={style}
        >
          {placeholder || (
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-xs">Carregando...</p>
            </div>
          )}
        </div>
      )}
      
      {/* Imagem real - só carrega quando está em view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default LazyImage;

