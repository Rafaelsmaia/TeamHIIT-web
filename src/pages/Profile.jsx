import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Trophy, Target, Award, Camera, Edit3, LogOut, Crown, Upload, Heart, MessageCircle, Share, Image as ImageIcon } from 'lucide-react';
import Header from '../components/ui/Header.jsx';

function Profile() {
  const auth = getAuth();
  const storage = getStorage();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userStats, setUserStats] = useState({
    completedWorkouts: 0,
    completedWeeks: 0,
    achievements: 0
  });
  const [userPosts, setUserPosts] = useState([]);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    photoURL: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        setFormData({
          displayName: user.displayName || '',
          email: user.email || '',
          phone: '',
          photoURL: user.photoURL || ''
        });

        // Buscar dados adicionais do usuário no Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsSubscriber(userData.isSubscriber || false);
            setFormData(prev => ({
              ...prev,
              phone: userData.phone || ''
            }));
            setUserStats({
              completedWorkouts: userData.completedWorkouts || 0,
              completedWeeks: userData.completedWeeks || 0,
              achievements: userData.achievements || 0
            });
          }

          // Buscar postagens do usuário na comunidade
          await fetchUserPosts(user.uid);
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      } else {
        setCurrentUser(null);
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const fetchUserPosts = async (userId) => {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(6) // Mostrar apenas as 6 postagens mais recentes
      );
      
      const querySnapshot = await getDocs(postsQuery);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUserPosts(posts);
    } catch (error) {
      console.error('Erro ao buscar postagens do usuário:', error);
      // Se houver erro (ex: coleção não existe), definir array vazio
      setUserPosts([]);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveChanges = async () => {
    if (!currentUser) return;

    try {
      setUploading(true);
      setMessage('Atualizando perfil...');
      
      let newPhotoURL = formData.photoURL;

      // Upload da foto se houver arquivo selecionado
      if (selectedFile) {
        setMessage('Fazendo upload da foto...');
        const photoRef = ref(storage, `profile_pictures/${currentUser.uid}/${selectedFile.name}`);
        await uploadBytes(photoRef, selectedFile);
        newPhotoURL = await getDownloadURL(photoRef);
      }

      // Atualizar displayName e photoURL no Firebase Authentication
      await updateProfile(currentUser, {
        displayName: formData.displayName,
        photoURL: newPhotoURL
      });

      // Atualizar dados no Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        await setDoc(userDocRef, {
          displayName: formData.displayName,
          photoURL: newPhotoURL,
          phone: formData.phone,
          updatedAt: new Date()
        }, { merge: true });
      } else {
        // Se o documento do usuário não existir, crie-o
        await setDoc(userDocRef, {
          email: currentUser.email,
          displayName: formData.displayName,
          photoURL: newPhotoURL,
          phone: formData.phone,
          createdAt: new Date(),
          isSubscriber: false,
          completedWorkouts: 0,
          completedWeeks: 0,
          achievements: 0
        });
      }

      // Atualizar estado local
      setFormData(prev => ({ ...prev, photoURL: newPhotoURL }));
      setSelectedFile(null);
      setEditMode(false);
      setMessage('Perfil atualizado com sucesso!');
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-gray-100 flex items-center justify-center">
        Você precisa estar logado para ver esta página.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      
      <div className="container mx-auto px-6 py-8 pt-20">
        <h1 className="text-4xl font-bold text-white mb-8">Meu Perfil</h1>

        {/* Cabeçalho do Perfil */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Foto de Perfil */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white overflow-hidden">
                {formData.photoURL ? (
                  <img 
                    src={formData.photoURL} 
                    alt="Foto de perfil" 
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <User size={48} />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors cursor-pointer">
                <Camera size={16} />
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </label>
            </div>

            {/* Informações Básicas */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {formData.displayName || 'Usuário'}
                </h2>
                {isSubscriber && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <Crown size={14} />
                    Assinante
                  </div>
                )}
              </div>
              <p className="text-gray-400 mb-4">{formData.email}</p>
              
              {/* Stats Rápidas */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-500">{userStats.completedWorkouts}</div>
                  <div className="text-sm text-gray-400">Treinos</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-500">{userStats.completedWeeks}</div>
                  <div className="text-sm text-gray-400">Semanas</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-500">{userStats.achievements}</div>
                  <div className="text-sm text-gray-400">Conquistas</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Minha Jornada HIIT */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
                <Trophy className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white">Jornada HIIT</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="text-red-500" size={20} />
                  <span className="text-gray-300">Treinos Concluídos</span>
                </div>
                <span className="font-semibold text-red-500">{userStats.completedWorkouts}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="text-green-500" size={20} />
                  <span className="text-gray-300">Semanas Completas</span>
                </div>
                <span className="font-semibold text-green-500">{userStats.completedWeeks}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="text-purple-500" size={20} />
                  <span className="text-gray-300">Conquistas</span>
                </div>
                <span className="font-semibold text-purple-500">{userStats.achievements}</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/jornada-hiit')}
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
            >
              Ver Jornada Completa
            </button>
          </div>

          {/* InstaHIIT - Minhas Postagens */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-red-500 p-2 rounded-lg">
                  <ImageIcon className="text-white" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-white">InstaHIIT</h3>
              </div>
              <button
                onClick={() => navigate('/community')}
                className="text-red-500 hover:text-red-400 transition-colors text-sm font-medium"
              >
                Ver todas
              </button>
            </div>
            
            {userPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {userPosts.slice(0, 6).map((post) => (
                    <div key={post.id} className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative group cursor-pointer">
                      {post.imageUrl ? (
                        <img 
                          src={post.imageUrl} 
                          alt="Post" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="text-gray-500" size={24} />
                        </div>
                      )}
                      
                      {/* Overlay com informações */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-4 text-white text-sm">
                          <div className="flex items-center gap-1">
                            <Heart size={16} />
                            <span>{post.likes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle size={16} />
                            <span>{post.comments?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center text-gray-400 text-sm">
                  {userPosts.length} postagem{userPosts.length !== 1 ? 's' : ''} no InstaHIIT
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="mx-auto text-gray-500 mb-3" size={48} />
                <p className="text-gray-400 mb-4">Você ainda não fez nenhuma postagem</p>
                <button
                  onClick={() => navigate('/community')}
                  className="bg-gradient-to-r from-pink-600 to-red-600 text-white py-2 px-4 rounded-lg hover:from-pink-700 hover:to-red-700 transition-all duration-200 font-medium"
                >
                  Fazer primeira postagem
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informações da Conta */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Informações da Conta</h3>
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
            >
              <Edit3 size={16} />
              {editMode ? 'Cancelar' : 'Editar'}
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
              {editMode ? (
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                  <User className="text-gray-400" size={16} />
                  <span className="text-gray-300">{formData.displayName || 'Não informado'}</span>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                <Mail className="text-gray-400" size={16} />
                <span className="text-gray-300">{formData.email}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
              {editMode ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
                  <Phone className="text-gray-400" size={16} />
                  <span className="text-gray-300">{formData.phone || 'Não informado'}</span>
                </div>
              )}
            </div>
          </div>
          
          {editMode && (
            <button
              onClick={handleSaveChanges}
              disabled={uploading}
              className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          )}
        </div>

        {/* Gerenciar Assinatura */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-xl font-semibold text-white mb-4">Gerenciar Assinatura</h3>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${isSubscriber ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium text-white">
                  {isSubscriber ? 'Plano Ativo' : 'Plano Inativo'}
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                {isSubscriber 
                  ? 'Você tem acesso completo a todos os treinos e funcionalidades.'
                  : 'Assine para ter acesso completo à plataforma.'
                }
              </p>
            </div>
            
            <button className="bg-gradient-to-r from-green-600 to-red-600 text-white py-2 px-6 rounded-lg hover:from-green-700 hover:to-red-700 transition-all duration-200 font-medium">
              {isSubscriber ? 'Gerenciar Assinatura' : 'Assinar Agora'}
            </button>
          </div>
        </div>

        {/* Mensagem de Status */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg text-center ${
            message.includes('sucesso') ? 'bg-green-600 text-white' : 
            message.includes('Erro') ? 'bg-red-600 text-white' : 
            'bg-blue-600 text-white'
          }`}>
            {message}
          </div>
        )}

        {/* Botão de Logout */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors font-medium"
          >
            <LogOut size={20} />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;

