import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {},
  darkMode = false,
  onLoad,
  onError,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Função para processar URL com encoding de espaços
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
    const currentRef = imgRef.current;
    
    if (!currentRef) return;

    // Configurar Intersection Observer
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
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(currentRef);

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    if (!isInView || !processedSrc) return;

    // Criar uma nova imagem para carregar em background
    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setHasError(false);
      if (onLoad) onLoad();
    };
    
    img.onerror = (e) => {
      console.warn(`Falha ao carregar imagem: ${src} (processada: ${processedSrc})`);
      setHasError(true);
      setIsLoaded(false);
      if (onError) onError(e);
    };
    
    // Iniciar carregamento
    img.src = processedSrc;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, processedSrc, src, onLoad, onError]);

  // Reset states quando src muda
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Placeholder para erro (só aparece se houver erro)
  const ErrorPlaceholder = () => (
    <div 
      className={`flex items-center justify-center bg-gray-100 ${darkMode ? 'bg-gray-800' : ''} ${className}`}
      style={style}
    >
      <div className="text-center text-gray-400">
        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        <p className="text-xs">Imagem não encontrada</p>
      </div>
    </div>
  );

  return (
    <div ref={imgRef} className={className} style={style}>
      {/* Só mostra a imagem quando estiver completamente carregada */}
      {isLoaded && !hasError && (
        <img
          src={processedSrc}
          alt={alt}
          className="w-full h-full"
          style={{ 
            objectFit: style?.objectFit || 'cover',
            display: 'block'
          }}
          loading="eager"
          {...props}
        />
      )}
      
      {/* Só mostra placeholder de erro se houver erro */}
      {hasError && <ErrorPlaceholder />}
      
      {/* Enquanto não carregou e não deu erro, não mostra nada (invisível) */}
    </div>
  );
};

export default LazyImage;

