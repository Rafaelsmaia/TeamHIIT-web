import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from './ui/Toast.jsx';

function PWALogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validação básica
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, insira um e-mail válido');
      setLoading(false);
      return;
    }

    try {
      // Autenticação real com Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Salvar estado de autenticação PWA
      localStorage.setItem('pwa_authenticated', 'true');
      localStorage.setItem('pwa_user_email', user.email);
      localStorage.setItem('pwa_user_uid', user.uid);
      
      addToast('Login realizado com sucesso!', 'success');
      onLogin(true);
    } catch (err) {
      console.error('Erro de autenticação:', err);
      
      // Tratar diferentes tipos de erro do Firebase
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado. Verifique o e-mail.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta. Tente novamente.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta conta foi desabilitada.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Credenciais inválidas. Verifique e-mail e senha.';
          break;
        default:
          errorMessage = `Erro: ${err.message}`;
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Digite seu e-mail primeiro para recuperar a senha');
      addToast('Digite seu e-mail primeiro', 'error');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      addToast('E-mail de recuperação enviado! Verifique sua caixa de entrada.', 'success');
    } catch (err) {
      console.error('Erro ao enviar e-mail de recuperação:', err);
      let errorMessage = 'Erro ao enviar e-mail de recuperação';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'E-mail não encontrado em nossa base de dados';
          break;
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido';
          break;
        default:
          errorMessage = `Erro: ${err.message}`;
      }
      
      addToast(errorMessage, 'error');
    }
  };

  const handleCreateAccount = () => {
    addToast('Para criar uma conta, acesse pelo navegador web primeiro', 'info');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="text-4xl font-bold text-red-500">
            Team HIIT
          </div>
        </div>
        
        {/* Título */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Acesso ao App
          </h2>
          <p className="text-gray-600 mt-2">
            Faça login para continuar
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">
                E-mail
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-4 border-0 border-b-2 border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500 focus:z-10 bg-transparent text-lg"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mt-8">
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-4 border-0 border-b-2 border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500 focus:z-10 bg-transparent text-lg pr-10"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-center mt-6">
              <button
                type="button"
                className="text-gray-600 text-sm hover:text-gray-800 transition-colors"
                onClick={handleForgotPassword}
              >
                Esqueceu sua senha?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <div className="mt-12">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-full text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>

            {/* Create Account */}
            <div className="flex justify-center mt-8">
              <button
                type="button"
                className="text-gray-600 text-lg hover:text-gray-800 transition-colors"
                onClick={handleCreateAccount}
              >
                Criar nova conta
              </button>
            </div>
          </form>
          
          {/* Info adicional */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Use as mesmas credenciais do site web
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWALogin;

