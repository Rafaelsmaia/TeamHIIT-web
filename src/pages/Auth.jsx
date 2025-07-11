import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth as firebaseAuth } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

function Auth() {
  const [isLogin, setIsLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();
  const auth = firebaseAuth;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/community');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await updateProfile(userCredential.user, {
          displayName: displayName
        });

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: displayName,
          createdAt: new Date()
        });
        navigate('/community');
      }
    } catch (err) {
      console.error('Erro no handleSubmit:', err);
      setError(err.message);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setResetEmailSent(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setError('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
    } catch (err) {
      console.error('Erro no handlePasswordReset:', err);
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      console.log('Firebase Auth instance:', auth);
      const result = await signInWithPopup(auth, provider);
      
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        displayName: result.user.displayName || result.user.email,
        createdAt: new Date()
      }, { merge: true });
      navigate('/community');
    } catch (err) {
      console.error('Erro no handleGoogleSignIn:', err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          {showResetPassword ? 'Redefinir Senha' : (isLogin ? 'Entrar' : 'Criar Conta')}
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        {!showResetPassword ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">E-mail:</label>
              <input
                type="email"
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {!isLogin && (
              <div className="mb-4">
                <label htmlFor="displayName" className="block text-gray-300 text-sm font-bold mb-2">Nome de Exibição (opcional):</label>
                <input
                  type="text"
                  id="displayName"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">Senha:</label>
              <input
                type="password"
                id="password"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white mb-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
              >
                {isLogin ? 'Entrar' : 'Registrar'}
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="inline-block align-baseline font-bold text-sm text-red-500 hover:text-red-800"
              >
                {isLogin ? 'Não tem uma conta? Crie uma!' : 'Já tem uma conta? Faça login!'}
              </button>
            </div>
            {isLogin && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="inline-block align-baseline font-bold text-sm text-gray-400 hover:text-gray-200"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <div className="mb-4">
              <label htmlFor="resetEmail" className="block text-gray-300 text-sm font-bold mb-2">E-mail para redefinição:</label>
              <input
                type="email"
                id="resetEmail"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
              >
                Enviar E-mail de Redefinição
              </button>
              <button
                type="button"
                onClick={() => setShowResetPassword(false)}
                className="inline-block align-baseline font-bold text-sm text-gray-400 hover:text-gray-200"
              >
                Voltar para o Login
              </button>
            </div>
            {resetEmailSent && (
              <p className="text-green-500 text-center mt-4">E-mail de redefinição enviado! Verifique sua caixa de entrada.</p>
            )}
          </form>
        )}

        {/* Botão de Login com Google */}
        {!showResetPassword && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 flex items-center justify-center"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5 mr-2" />
              Entrar com Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Auth;



