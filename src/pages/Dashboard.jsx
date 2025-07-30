import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Play, Clock, Target, Zap, Filter, Grid3X3, List, TrendingUp, Users, Award, Bookmark } from 'lucide-react';
import Header from '../components/ui/Header.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import LazyImage from '../components/LazyImage.jsx';
import ContinueJourney from '../components/ContinueJourney.jsx';

function Dashboard() {
  const [allSections, setAllSections] = useState([]);
  const [message, setMessage] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        // Carrega o script com os dados dos treinos
        const script = document.createElement('script');
        script.src = '/trainings.js';
        script.onload = () => {
          if (window.trainingsData && window.trainingsData.sections) {
            setAllSections(window.trainingsData.sections);
            setLoading(false);
          } else {
            throw new Error('Dados dos treinos não encontrados');
          }
        };
        script.onerror = () => {
          throw new Error('Erro ao carregar arquivo de treinos');
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error("Erro ao carregar treinos:", error);
        setMessage(`Erro ao carregar treinos: ${error.message}`);
        addToast("Erro ao carregar treinos", "error");
        setLoading(false);
      }
    };

    fetchTrainings();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'força':
      case 'específico':
        return 'from-blue-500 to-blue-600';
      case 'cardio':
      case 'hiit':
      case 'desafio':
        return 'from-red-500 to-orange-500';
      case 'guia':
      case 'suporte':
        return 'from-green-500 to-teal-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  // Slides otimizados para o carousel
  const carouselSlides = [
    <div key="slide1" className="relative overflow-hidden" style={{ height: '800px' }}>
      <LazyImage
        src="/BANNER PRINCIPAL/TREINOS-GRATIS.png"
        alt="Team HIIT - Treinos Grátis"
        className="w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center center' }}
      />
      <div className="absolute inset-0 bg-black/10"></div>
    </div>,
    <div key="slide2" className="relative overflow-hidden" style={{ height: '800px' }}>
      <LazyImage
        src="/BANNER PRINCIPAL/Indique-um-amigo.png"
        alt="Team HIIT - Indique um Amigo"
        className="w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center center' }}
      />
      <div className="absolute inset-0 bg-black/10"></div>
    </div>
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="skeleton h-48 rounded-lg mb-4 bg-gray-200 animate-pulse"></div>
                <div className="skeleton h-6 rounded mb-2 bg-gray-200 animate-pulse"></div>
                <div className="skeleton h-4 rounded mb-4 bg-gray-200 animate-pulse"></div>
                <div className="skeleton h-10 rounded bg-gray-200 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      <ToastContainer />
      
      {/* Hero Carousel Otimizado */}
      <div className="w-full mb-8 animate-fade-in-up pt-20">
        <div 
          className="relative overflow-hidden"
          style={{ height: '800px' }}
        >
          {/* Slides Container */}
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {carouselSlides.map((slide, index) => (
              <div key={index} className="w-full flex-shrink-0 h-full">
                {slide}
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => setCurrentSlide(currentSlide === 0 ? carouselSlides.length - 1 : currentSlide - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10"
          >
            ←
          </button>
          
          <button
            onClick={() => setCurrentSlide(currentSlide === carouselSlides.length - 1 ? 0 : currentSlide + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm z-10"
          >
            →
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {carouselSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-white scale-125'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">

        {/* Continue Sua Jornada - Nova Seção */}
        <ContinueJourney />

        {/* Error Message */}
        {message && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}
        
        {/* Dynamic Sections com Lazy Loading */}
        {allSections.map((section, sectionIndex) => (
          <div key={section.id} className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {section.title === "CANAIS DE SUPORTE" ? "CRONOGRAMAS SEMANAIS" : section.title}
            </h2>
            {section.description && (
              <p className="text-gray-400 mb-6">{section.description}</p>
            )}
            
            {section.trainings.length > 0 ? (
              <div className="overflow-x-auto pb-4 md:overflow-visible">
                <div className="flex gap-8 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-8">
                  {section.trainings.map((training, trainingIndex) => (
                    <div
                      key={training.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105 hover:shadow-xl flex-shrink-0 w-72 md:w-auto flex flex-col aspect-[3/4]"
                      onClick={() => navigate(`/trainings/${training.id}`)}
                    >
                      <div className="relative flex-1">
                        <LazyImage
                          src={`/${training.imageUrl}`}
                          alt={training.title}
                          className="w-full h-full"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className="p-4 bg-white">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{training.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{training.duration}</span>
                          <span className="mx-2">•</span>
                          <span>{training.level}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {training.categories.slice(0, 2).map(category => (
                            <span 
                              key={category} 
                              className={`px-3 py-1 text-sm font-medium rounded-full text-white 
                                bg-gradient-to-r ${getCategoryColor(category)}
                              `}
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum treino encontrado</h3>
                <p className="text-gray-600">Nenhum treino disponível nesta categoria no momento.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;

