import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';

// Importa todas as imagens da pasta 'CAPAS TEAM HIIT' dinamicamente
const images = import.meta.glob('../assets/training_images/CAPAS TEAM HIIT/*', { eager: true, as: 'url' });

function TrainingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainingData = () => {
      if (window.trainingsData && window.trainingsData.sections) {
        let foundTraining = null;
        let foundProgram = null;

        // Encontrar o treino e o programa associado
        for (const section of window.trainingsData.sections) {
          foundTraining = section.trainings.find(t => t.id === id);
          if (foundTraining) {
            // Assumindo que o programId no trainingData aponta para um programa real
            // Para este exemplo, vamos simular um programa com base no programId
            // Em um cenário real, você buscaria o programa de uma lista de programas
            foundProgram = {
              id: foundTraining.programId,
              title: foundTraining.title, // Usando o título do treino como título do programa
              description: `Detalhes do programa ${foundTraining.title}. Combine movimentos de 5 artes marciais, no ritmo da música, para trabalhar o seu corpo por inteiro. Você vai acelerar muito o seu metabolismo e queimar muitas calorias.`,
              instructor: "Carol Borba",
              duration: "20 minutos",
              level: "Iniciante",
              modules: [
                {
                  id: "explicando-movimentos",
                  title: "Explicando os Movimentos",
                  lessons: [
                    { id: "apresentacao", title: "Apresentação", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", imageUrl: "power-combat-apresentacao.jpg" },
                    { id: "como-funciona", title: "Como Funciona", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", imageUrl: "power-combat-como-funciona.jpg" }
                  ]
                },
                {
                  id: "round-1",
                  title: "Round 1",
                  lessons: [
                    { id: "aula-1", title: "Aula 1", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
                    { id: "aula-2", title: "Aula 2", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
                  ]
                }
              ]
            };
            break;
          }
        }

        setTraining(foundTraining);
        setProgram(foundProgram);
        setLoading(false);
      }
    };

    // Garante que trainingsData esteja disponível
    if (window.trainingsData) {
      fetchTrainingData();
    } else {
      const script = document.createElement('script');
      script.src = '/trainings.js';
      script.onload = fetchTrainingData;
      script.onerror = () => {
        console.error('Erro ao carregar arquivo de treinos');
        setLoading(false);
      };
      document.head.appendChild(script);
    }
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-[#1a1a1a] text-gray-100 flex items-center justify-center">Carregando detalhes do treino...</div>;
  }

  if (!training || !program) {
    return <div className="min-h-screen bg-[#1a1a1a] text-gray-100 flex items-center justify-center">Treino ou programa não encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      <div className="w-full relative" style={{ height: '50vh' }}>
        <img 
          src={images[`../assets/training_images/CAPAS TEAM HIIT/${program.id}-banner.jpg`] || '/renan-slide.png'} 
          alt={program.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center p-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-2">{program.title}</h1>
            <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">{program.description}</p>
            <div className="mt-4 flex justify-center space-x-4">
              <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm">{program.instructor}</span>
              <span className="bg-gray-700 text-white px-4 py-2 rounded-full text-sm">{program.duration}</span>
              <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm">{program.level}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Módulos do Programa</h2>
          {program.modules.map(module => (
            <div key={module.id} className="bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-white mb-4">{module.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {module.lessons.map(lesson => (
                  <div key={lesson.id} className="bg-gray-700 rounded-lg overflow-hidden">
                    {lesson.videoUrl ? (
                      <div className="relative h-48">
                        <iframe
                          className="w-full h-full"
                          src={lesson.videoUrl}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={lesson.title}
                        ></iframe>
                      </div>
                    ) : lesson.imageUrl && (
                      <img 
                        src={images[`../assets/training_images/CAPAS TEAM HIIT/${lesson.imageUrl}`] || '/renan-slide.png'} 
                        alt={lesson.title} 
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h4 className="text-lg font-bold text-white mb-2">{lesson.title}</h4>
                      {lesson.videoUrl && (
                        <button 
                          onClick={() => window.open(lesson.videoUrl.replace('/embed/', '/watch?v='), '_blank')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300"
                        >
                          Assistir Aula
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TrainingDetail;


