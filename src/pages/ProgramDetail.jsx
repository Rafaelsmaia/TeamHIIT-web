import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { Play, Clock, Target } from 'lucide-react';

function ProgramDetail() {
  const { programId } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgram = () => {
      try {
        if (window.trainingsData && window.trainingsData.programs) {
          const foundProgram = window.trainingsData.programs.find(p => p.id === programId);
          if (foundProgram) {
            setProgram(foundProgram);
          } else {
            setError('Programa não encontrado');
          }
        } else {
          setError('Dados dos programas não carregados');
        }
      } catch (err) {
        setError('Erro ao carregar o programa');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Ensure trainings.js is loaded
    if (window.trainingsData) {
      fetchProgram();
    } else {
      const script = document.createElement('script');
      script.src = '/trainings.js';
      script.onload = fetchProgram;
      script.onerror = () => setError('Erro ao carregar arquivo de treinos');
      document.head.appendChild(script);
    }
  }, [programId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
        <Header />
        <div className="container mx-auto px-6 py-8 pt-20">
          <h1 className="text-4xl font-bold text-white mb-8">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
        <Header />
        <div className="container mx-auto px-6 py-8 pt-20">
          <h1 className="text-4xl font-bold text-red-500 mb-8">Erro: {error}</h1>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
        <Header />
        <div className="container mx-auto px-6 py-8 pt-20">
          <h1 className="text-4xl font-bold text-white mb-8">Programa não encontrado.</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      <div className="container mx-auto px-6 py-8 pt-20">
        <h1 className="text-4xl font-bold text-white mb-4">{program.title}</h1>
        <p className="text-gray-400 mb-6">{program.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 flex items-center">
            <Target className="w-6 h-6 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-400">Instrutor</p>
              <p className="font-bold">{program.instructor}</p>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 flex items-center">
            <Clock className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-400">Duração</p>
              <p className="font-bold">{program.duration}</p>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 flex items-center">
            <Play className="w-6 h-6 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-400">Nível</p>
              <p className="font-bold">{program.level}</p>
            </div>
          </div>
        </div>

        {program.modules.map(module => (
          <div key={module.id} className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">{module.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {module.lessons.map(lesson => (
                <div key={lesson.id} className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer">
                  <img src={`/src/assets/training_images/CAPAS TEAM HIIT/${lesson.imageUrl}`} alt={lesson.title} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{lesson.title}</h3>
                    <button 
                      onClick={() => window.open(lesson.videoUrl, '_blank')}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                    >
                      Assistir Aula
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgramDetail;


