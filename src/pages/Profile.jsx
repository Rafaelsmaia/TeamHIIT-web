import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Importar Storage
import Header from '../components/Header.jsx';

function Profile() {
  const auth = getAuth();
  const storage = getStorage(); // Inicializar Storage
  const [currentUser, setCurrentUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(''); // Novo estado para a URL da foto de perfil
  const [selectedFile, setSelectedFile] = useState(null); // Novo estado para o arquivo selecionado
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUser(user);
        setDisplayName(user.displayName || '');
        setProfilePhoto(user.photoURL || ''); // Carregar foto de perfil existente
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!currentUser) {
      setMessage('Nenhum usuário logado.');
      return;
    }

    try {
      let newPhotoURL = profilePhoto;

      if (selectedFile) {
        setMessage('Fazendo upload da foto...');
        const photoRef = ref(storage, `profile_pictures/${currentUser.uid}/${selectedFile.name}`);
        await uploadBytes(photoRef, selectedFile);
        newPhotoURL = await getDownloadURL(photoRef);
        setProfilePhoto(newPhotoURL);
      }

      // Atualizar displayName e photoURL no Firebase Authentication
      await updateProfile(currentUser, {
        displayName: displayName,
        photoURL: newPhotoURL
      });

      // Atualizar displayName e photoURL no Firestore (se o usuário já existir lá)
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        await setDoc(userDocRef, { displayName: displayName, photoURL: newPhotoURL }, { merge: true });
      } else {
        // Se o documento do usuário não existir, crie-o
        await setDoc(userDocRef, {
          email: currentUser.email,
          displayName: displayName,
          photoURL: newPhotoURL,
          createdAt: new Date()
        });
      }

      setMessage('Perfil atualizado com sucesso!');
      setSelectedFile(null); // Limpar o arquivo selecionado após o upload
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage(`Erro ao atualizar perfil: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#1a1a1a] text-gray-100 flex items-center justify-center">Carregando perfil...</div>;
  }

  if (!currentUser) {
    return <div className="min-h-screen bg-[#1a1a1a] text-gray-100 flex items-center justify-center">Você precisa estar logado para ver esta página.</div>;
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      <div className="container mx-auto px-6 py-8 pt-20">
        <h1 className="text-4xl font-bold text-white mb-8">Meu Perfil</h1>

        <div className="bg-gray-800 rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <div className="mb-4 text-center">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Foto de Perfil" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-700 flex items-center justify-center text-gray-400 text-6xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
            )}
            <label className="block text-gray-300 text-sm font-bold mb-2">E-mail:</label>
            <p className="text-white text-lg">{currentUser.email}</p>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="mb-4">
              <label htmlFor="displayName" className="block text-gray-300 text-sm font-bold mb-2">Nome de Exibição:</label>
              <input
                type="text"
                id="displayName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome de exibição"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="profilePhoto" className="block text-gray-300 text-sm font-bold mb-2">Foto de Perfil:</label>
              <input
                type="file"
                id="profilePhoto"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            {message && <p className="text-green-500 text-center mb-4">{message}</p>}
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Atualizar Perfil
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;



