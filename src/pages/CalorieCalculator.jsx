import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Zap, TrendingUp, Info, AlertTriangle, CheckCircle, Clock, User, Share2, Save, RotateCcw, Loader } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

const CalorieCalculator = () => {
  // Estados principais
  const [currentView, setCurrentView] = useState('home'); // home, camera, analysis, result, history
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [estimatedWeight, setEstimatedWeight] = useState(150);
  const [user, setUser] = useState(null);
  const [mealHistory, setMealHistory] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Refs
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Firebase
  const auth = getAuth();
  const db = getFirestore();

  // Monitorar autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadMealHistory(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // Carregar histórico de refeições
  const loadMealHistory = (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mealsRef = collection(db, 'meals');
    const q = query(
      mealsRef,
      where('userId', '==', userId),
      where('createdAt', '>=', today),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMealHistory(meals);

      // Calcular totais diários
      const totals = meals.reduce((acc, meal) => {
        if (meal.nutritionData && meal.nutritionData.totals) {
          acc.calories += meal.nutritionData.totals.calories || 0;
          acc.protein += meal.nutritionData.totals.protein || 0;
          acc.carbs += meal.nutritionData.totals.carbs || 0;
          acc.fat += meal.nutritionData.totals.fat || 0;
        }
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      setDailyTotals(totals);
    });

    return unsubscribe;
  };

  // Inicializar câmera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Câmera traseira
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCurrentView('camera');
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  // Capturar foto da câmera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        setSelectedImage(blob);
        setImagePreview(URL.createObjectURL(blob));
        stopCamera();
        setCurrentView('analysis');
      }, 'image/jpeg', 0.8);
    }
  };

  // Parar câmera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Selecionar arquivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setCurrentView('analysis');
    }
  };

  // Analisar imagem
  const analyzeImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);

    try {
      // Verificar se o serviço Clarifai está disponível
      if (!window.clarifaiService) {
        throw new Error('Serviço de análise não disponível. Recarregue a página.');
      }

      // Converter imagem para base64
      const base64 = await window.ClarifaiService.imageToBase64(selectedImage);
      
      // Analisar com Clarifai
      const result = await window.clarifaiService.analyzeImage(base64, estimatedWeight);
      
      if (result.success) {
        setAnalysisResult(result);
        setCurrentView('result');
      } else {
        throw new Error(result.error || 'Erro na análise da imagem');
      }

    } catch (error) {
      console.error('Erro na análise:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Salvar refeição
  const saveMeal = async () => {
    if (!user || !analysisResult) return;

    try {
      await addDoc(collection(db, 'meals'), {
        userId: user.uid,
        imageUrl: imagePreview,
        nutritionData: analysisResult,
        estimatedWeight,
        createdAt: serverTimestamp(),
        mealType: getCurrentMealType()
      });

      alert('Refeição salva com sucesso!');
      setCurrentView('home');
      resetState();
    } catch (error) {
      console.error('Erro ao salvar refeição:', error);
      alert('Erro ao salvar refeição. Tente novamente.');
    }
  };

  // Determinar tipo de refeição baseado no horário
  const getCurrentMealType = () => {
    const hour = new Date().getHours();
    if (hour < 10) return 'Café da Manhã';
    if (hour < 14) return 'Almoço';
    if (hour < 18) return 'Lanche';
    return 'Jantar';
  };

  // Resetar estado
  const resetState = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
    setEstimatedWeight(150);
  };

  // Compartilhar resultado
  const shareResult = () => {
    if (navigator.share && analysisResult) {
      navigator.share({
        title: 'Minha Análise Nutricional - Team HIIT',
        text: `Acabei de analisar minha refeição: ${analysisResult.totals.calories} calorias, ${analysisResult.totals.protein}g proteína!`,
        url: window.location.href
      });
    }
  };

  // Renderizar tela inicial
  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">🍽️ Calculadora de Calorias</h1>
        <p className="text-white/90">Analise suas refeições com Inteligência Artificial</p>
      </div>

      {/* Resumo Diário */}
      <div className="p-6">
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-orange-500" />
            Resumo de Hoje
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{Math.round(dailyTotals.calories)}</div>
              <div className="text-sm text-gray-400">Calorias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{Math.round(dailyTotals.protein)}g</div>
              <div className="text-sm text-gray-400">Proteína</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{Math.round(dailyTotals.carbs)}g</div>
              <div className="text-sm text-gray-400">Carboidratos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{Math.round(dailyTotals.fat)}g</div>
              <div className="text-sm text-gray-400">Gorduras</div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-4 mb-6">
          <button
            onClick={startCamera}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all transform hover:scale-105"
          >
            <Camera className="w-6 h-6" />
            <span>Tirar Foto do Prato</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all"
          >
            <Upload className="w-6 h-6" />
            <span>Escolher da Galeria</span>
          </button>
        </div>

        {/* Histórico Recente */}
        {mealHistory.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-400" />
              Refeições Recentes
            </h3>
            <div className="space-y-3">
              {mealHistory.slice(0, 3).map((meal) => (
                <div key={meal.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                      🍽️
                    </div>
                    <div>
                      <div className="font-semibold">{meal.mealType}</div>
                      <div className="text-sm text-gray-400">
                        {meal.nutritionData?.totals?.calories || 0} cal
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {meal.createdAt?.toDate().toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );

  // Renderizar câmera
  const renderCamera = () => (
    <div className="min-h-screen bg-black text-white relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Overlay com guias */}
      <div className="absolute inset-0 flex flex-col justify-between p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Posicione seu prato</h2>
          <p className="text-white/80">Centralize o prato na tela para melhor análise</p>
        </div>

        {/* Guia visual */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-80 h-80 border-4 border-white/50 rounded-full border-dashed"></div>
        </div>

        {/* Controles */}
        <div className="flex justify-center space-x-6">
          <button
            onClick={() => {
              stopCamera();
              setCurrentView('home');
            }}
            className="bg-gray-600 hover:bg-gray-500 text-white p-4 rounded-full transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          
          <button
            onClick={capturePhoto}
            className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-full transition-all transform hover:scale-105"
          >
            <Camera className="w-8 h-8" />
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );

  // Renderizar análise
  const renderAnalysis = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Analisar Refeição</h2>

        {/* Preview da imagem */}
        {imagePreview && (
          <div className="mb-6">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>
        )}

        {/* Controle de peso estimado */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium mb-3">
            Peso estimado da porção: {estimatedWeight}g
          </label>
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            value={estimatedWeight}
            onChange={(e) => setEstimatedWeight(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>50g</span>
            <span>500g</span>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              <span className="text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="space-y-4">
          <button
            onClick={analyzeImage}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 text-white p-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all"
          >
            {loading ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                <span>Analisando...</span>
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                <span>Analisar com IA</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              resetState();
              setCurrentView('home');
            }}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-xl font-semibold transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizar resultado
  const renderResult = () => {
    if (!analysisResult) return null;

    const { foods, totals, insights, confidence } = analysisResult;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Resultado da Análise</h2>

          {/* Confiança da análise */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6 text-center">
            <div className="text-sm text-gray-400 mb-1">Confiança da IA</div>
            <div className="text-2xl font-bold text-green-500">{confidence}%</div>
          </div>

          {/* Totais nutricionais */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 text-center">Informações Nutricionais</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">{totals.calories}</div>
                <div className="text-sm text-gray-400">Calorias</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">{totals.protein}g</div>
                <div className="text-sm text-gray-400">Proteína</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{totals.carbs}g</div>
                <div className="text-sm text-gray-400">Carboidratos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500">{totals.fat}g</div>
                <div className="text-sm text-gray-400">Gorduras</div>
              </div>
            </div>
          </div>

          {/* Alimentos identificados */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Alimentos Identificados</h3>
            <div className="space-y-3">
              {foods.map((food, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                  <div>
                    <div className="font-semibold capitalize">{food.name}</div>
                    <div className="text-sm text-gray-400">Confiança: {food.confidence}%</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-500">{food.calories} cal</div>
                    <div className="text-sm text-gray-400">{food.portion}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {insights && insights.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Insights Nutricionais</h3>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'success' ? 'bg-green-500/20 border-green-500' :
                    insight.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500' :
                    'bg-blue-500/20 border-blue-500'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{insight.icon}</span>
                      <div>
                        <div className="font-semibold">{insight.title}</div>
                        <div className="text-sm text-gray-300">{insight.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="space-y-4">
            {user && (
              <button
                onClick={saveMeal}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all"
              >
                <Save className="w-6 h-6" />
                <span>Salvar Refeição</span>
              </button>
            )}

            <button
              onClick={shareResult}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all"
            >
              <Share2 className="w-6 h-6" />
              <span>Compartilhar</span>
            </button>

            <button
              onClick={() => {
                resetState();
                setCurrentView('home');
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-xl font-semibold transition-colors"
            >
              Nova Análise
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar view atual
  const renderCurrentView = () => {
    switch (currentView) {
      case 'camera':
        return renderCamera();
      case 'analysis':
        return renderAnalysis();
      case 'result':
        return renderResult();
      default:
        return renderHome();
    }
  };

  return renderCurrentView();
};

export default CalorieCalculator;

