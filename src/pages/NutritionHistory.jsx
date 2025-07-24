import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, BarChart3, PieChart, Clock, Filter, Search, Download, Share2, Target, Award, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

const NutritionHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mealHistory, setMealHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});

  const auth = getAuth();
  const db = getFirestore();

  // Monitorar autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadMealHistory(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // Carregar histórico de refeições
  const loadMealHistory = (userId) => {
    const startDate = getStartDate(selectedPeriod);
    
    const mealsRef = collection(db, 'meals');
    const q = query(
      mealsRef,
      where('userId', '==', userId),
      where('createdAt', '>=', startDate),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      setMealHistory(meals);
      calculateStats(meals);
      setLoading(false);
    });

    return unsubscribe;
  };

  // Obter data de início baseada no período
  const getStartDate = (period) => {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  // Calcular estatísticas
  const calculateStats = (meals) => {
    if (meals.length === 0) {
      setStats({});
      return;
    }

    const totals = meals.reduce((acc, meal) => {
      if (meal.nutritionData && meal.nutritionData.totals) {
        acc.calories += meal.nutritionData.totals.calories || 0;
        acc.protein += meal.nutritionData.totals.protein || 0;
        acc.carbs += meal.nutritionData.totals.carbs || 0;
        acc.fat += meal.nutritionData.totals.fat || 0;
        acc.fiber += meal.nutritionData.totals.fiber || 0;
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const days = Math.max(1, Math.ceil((new Date() - getStartDate(selectedPeriod)) / (1000 * 60 * 60 * 24)));
    
    const averages = {
      calories: Math.round(totals.calories / days),
      protein: Math.round((totals.protein / days) * 10) / 10,
      carbs: Math.round((totals.carbs / days) * 10) / 10,
      fat: Math.round((totals.fat / days) * 10) / 10,
      fiber: Math.round((totals.fiber / days) * 10) / 10
    };

    // Análise por tipo de refeição
    const mealTypes = meals.reduce((acc, meal) => {
      const type = meal.mealType || 'Outros';
      if (!acc[type]) {
        acc[type] = { count: 0, calories: 0 };
      }
      acc[type].count++;
      acc[type].calories += meal.nutritionData?.totals?.calories || 0;
      return acc;
    }, {});

    // Tendências (comparar com período anterior)
    const previousPeriodMeals = meals.filter(meal => {
      const mealDate = meal.createdAt;
      const periodStart = getStartDate(selectedPeriod);
      const previousPeriodStart = new Date(periodStart.getTime() - (new Date() - periodStart));
      return mealDate >= previousPeriodStart && mealDate < periodStart;
    });

    const previousTotals = previousPeriodMeals.reduce((acc, meal) => {
      if (meal.nutritionData && meal.nutritionData.totals) {
        acc.calories += meal.nutritionData.totals.calories || 0;
      }
      return acc;
    }, { calories: 0 });

    const trend = totals.calories > previousTotals.calories ? 'up' : 'down';
    const trendPercentage = previousTotals.calories > 0 
      ? Math.round(((totals.calories - previousTotals.calories) / previousTotals.calories) * 100)
      : 0;

    setStats({
      totals,
      averages,
      mealTypes,
      trend,
      trendPercentage,
      totalMeals: meals.length,
      days
    });
  };

  // Filtrar refeições
  const filteredMeals = mealHistory.filter(meal => {
    const matchesMealType = selectedMealType === 'all' || meal.mealType === selectedMealType;
    const matchesSearch = searchTerm === '' || 
      meal.nutritionData?.foods?.some(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesMealType && matchesSearch;
  });

  // Exportar dados
  const exportData = () => {
    const csvData = filteredMeals.map(meal => ({
      Data: meal.createdAt.toLocaleDateString('pt-BR'),
      Hora: meal.createdAt.toLocaleTimeString('pt-BR'),
      Tipo: meal.mealType,
      Calorias: meal.nutritionData?.totals?.calories || 0,
      Proteína: meal.nutritionData?.totals?.protein || 0,
      Carboidratos: meal.nutritionData?.totals?.carbs || 0,
      Gordura: meal.nutritionData?.totals?.fat || 0,
      Fibra: meal.nutritionData?.totals?.fiber || 0
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-nutricional-${selectedPeriod}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
          <p className="text-gray-400">Faça login para ver seu histórico nutricional.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/nutrition')}
            className="mr-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">📊 Histórico Nutricional</h1>
            <p className="text-white/90">Acompanhe sua evolução alimentar</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filtros */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Período */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-orange-500"
              >
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
                <option value="year">Último Ano</option>
              </select>

              {/* Tipo de Refeição */}
              <select
                value={selectedMealType}
                onChange={(e) => setSelectedMealType(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todas as Refeições</option>
                <option value="Café da Manhã">Café da Manhã</option>
                <option value="Almoço">Almoço</option>
                <option value="Lanche">Lanche</option>
                <option value="Jantar">Jantar</option>
              </select>

              {/* Busca */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar alimento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Exportar */}
            {filteredMeals.length > 0 && (
              <button
                onClick={exportData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Exportar</span>
              </button>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        {stats.totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Calorias Médias */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Calorias/Dia</h3>
                {stats.trend === 'up' ? (
                  <TrendingUp className="w-6 h-6 text-green-500" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-500" />
                )}
              </div>
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {stats.averages.calories}
              </div>
              <div className={`text-sm ${stats.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {stats.trendPercentage > 0 ? '+' : ''}{stats.trendPercentage}% vs período anterior
              </div>
            </div>

            {/* Proteína Média */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Proteína/Dia</h3>
                <Target className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {stats.averages.protein}g
              </div>
              <div className="text-sm text-gray-400">
                Meta: 1.6g/kg peso corporal
              </div>
            </div>

            {/* Total de Refeições */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Refeições</h3>
                <BarChart3 className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-500 mb-2">
                {stats.totalMeals}
              </div>
              <div className="text-sm text-gray-400">
                {Math.round(stats.totalMeals / stats.days * 10) / 10} por dia
              </div>
            </div>

            {/* Fibra Média */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Fibra/Dia</h3>
                <Award className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-yellow-500 mb-2">
                {stats.averages.fiber}g
              </div>
              <div className="text-sm text-gray-400">
                Meta: 25-35g por dia
              </div>
            </div>
          </div>
        )}

        {/* Distribuição por Tipo de Refeição */}
        {stats.mealTypes && Object.keys(stats.mealTypes).length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <PieChart className="w-6 h-6 mr-2 text-orange-500" />
              Distribuição por Tipo de Refeição
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.mealTypes).map(([type, data]) => (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {data.count}
                  </div>
                  <div className="text-sm text-gray-400 mb-1">{type}</div>
                  <div className="text-xs text-gray-500">
                    {Math.round(data.calories / data.count)} cal/média
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Refeições */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-gray-400" />
            Histórico de Refeições ({filteredMeals.length})
          </h3>

          {filteredMeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Nenhuma refeição encontrada para os filtros selecionados.</p>
              <p className="text-sm text-gray-500">Tente ajustar os filtros ou adicionar novas refeições.</p>
              <button
                onClick={() => navigate('/nutrition')}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Adicionar Refeição
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredMeals.map((meal) => (
                <div key={meal.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                        🍽️
                      </div>
                      <div>
                        <div className="font-semibold">{meal.mealType || 'Refeição'}</div>
                        <div className="text-sm text-gray-400">
                          {meal.createdAt.toLocaleDateString('pt-BR')} às {meal.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-500">
                        {meal.nutritionData?.totals?.calories || 0} cal
                      </div>
                      <div className="text-sm text-gray-400">
                        {meal.nutritionData?.confidence || 0}% confiança
                      </div>
                    </div>
                  </div>

                  {/* Macronutrientes */}
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-blue-400">
                        {meal.nutritionData?.totals?.protein || 0}g
                      </div>
                      <div className="text-xs text-gray-500">Proteína</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-400">
                        {meal.nutritionData?.totals?.carbs || 0}g
                      </div>
                      <div className="text-xs text-gray-500">Carboidratos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-yellow-400">
                        {meal.nutritionData?.totals?.fat || 0}g
                      </div>
                      <div className="text-xs text-gray-500">Gordura</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-purple-400">
                        {meal.nutritionData?.totals?.fiber || 0}g
                      </div>
                      <div className="text-xs text-gray-500">Fibra</div>
                    </div>
                  </div>

                  {/* Alimentos identificados */}
                  {meal.nutritionData?.foods && meal.nutritionData.foods.length > 0 && (
                    <div className="border-t border-gray-600 pt-3">
                      <div className="text-sm text-gray-400 mb-2">Alimentos identificados:</div>
                      <div className="flex flex-wrap gap-2">
                        {meal.nutritionData.foods.slice(0, 4).map((food, index) => (
                          <span
                            key={index}
                            className="bg-gray-600 text-xs px-2 py-1 rounded-full capitalize"
                          >
                            {food.name} ({food.confidence}%)
                          </span>
                        ))}
                        {meal.nutritionData.foods.length > 4 && (
                          <span className="text-xs text-gray-400">
                            +{meal.nutritionData.foods.length - 4} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NutritionHistory;

