import React, { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Send, ThumbsUp, MessageCircle, Smile, PlusCircle } from 'lucide-react';

function Community() {
  const [activeTab, setActiveTab] = useState('feed');
  const [newPostContent, setNewPostContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [commentContent, setCommentContent] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  const emojis = ['👍', '❤️', '😂', '🔥', '😢', '🙏'];
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, [auth]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    const postsCollection = collection(db, 'posts');
    const q = query(postsCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const fetchedPosts = await Promise.all(querySnapshot.docs.map(async docSnapshot => {
      const postData = { id: docSnapshot.id, ...docSnapshot.data() };
      
      // Fetch author's photoURL from users collection
      let authorPhotoURL = '';
      if (postData.authorId) {
        const userDocRef = doc(db, 'users', postData.authorId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          authorPhotoURL = userDocSnap.data().photoURL || '';
        }
      }

      const commentsCollection = collection(db, 'posts', postData.id, 'comments');
      const commentsQuery = query(commentsCollection, orderBy('timestamp', 'asc'));
      const commentsSnapshot = await getDocs(commentsQuery);
      const fetchedComments = await Promise.all(commentsSnapshot.docs.map(async commentDoc => {
        const commentData = { id: commentDoc.id, ...commentDoc.data() };
        
        // Fetch commenter's photoURL from users collection
        let commenterPhotoURL = '';
        if (commentData.authorId) {
          const userDocRef = doc(db, 'users', commentData.authorId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            commenterPhotoURL = userDocSnap.data().photoURL || '';
          }
        }
        return { ...commentData, authorPhotoURL: commenterPhotoURL };
      }));
      return { ...postData, authorPhotoURL: authorPhotoURL, commentsList: fetchedComments };
    }));
    setPosts(fetchedPosts);
    setLoadingPosts(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleAddPost = async () => {
    if (newPostContent.trim() === '') return;
    if (!currentUser) {
      alert('Você precisa estar logado para fazer uma postagem.');
      return;
    }

    try {
      await addDoc(collection(db, 'posts'), {
        content: newPostContent,
        author: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        authorPhotoURL: currentUser.photoURL || '', // Salvar a foto de perfil do autor
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        reactions: {}
      });
      setNewPostContent('');
      fetchPosts();
    } catch (e) {
      console.error('Erro ao adicionar documento: ', e);
    }
  };

  const handleLikePost = async (postId) => {
    if (!currentUser) {
      alert('Você precisa estar logado para curtir uma postagem.');
      return;
    }
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
      fetchPosts();
    } catch (e) {
      console.error('Erro ao curtir post: ', e);
    }
  };

  const handleCommentPost = async (postId) => {
    const content = commentContent[postId];
    if (!content || content.trim() === '') return;
    if (!currentUser) {
      alert('Você precisa estar logado para comentar uma postagem.');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        content: content,
        author: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        authorPhotoURL: currentUser.photoURL || '', // Salvar a foto de perfil do comentarista
        timestamp: serverTimestamp()
      });
      await updateDoc(postRef, {
        comments: increment(1)
      });
      setCommentContent(prev => ({ ...prev, [postId]: '' }));
      fetchPosts();
    } catch (e) {
      console.error('Erro ao comentar post: ', e);
    }
  };

  const handleReaction = async (postId, emoji) => {
    if (!currentUser) {
      alert('Você precisa estar logado para reagir a uma postagem.');
      return;
    }
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        [`reactions.${emoji}`]: increment(1)
      });
      setShowEmojiPicker(null);
      fetchPosts();
    } catch (e) {
      console.error('Erro ao reagir ao post: ', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      <div className="container mx-auto px-6 py-8 pt-20">
        <h1 className="text-4xl font-bold text-white mb-8">Comunidade</h1>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 mb-8">
          <button
            className={`px-6 py-3 text-lg font-medium ${activeTab === 'feed' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('feed')}
          >
            Feed
          </button>
          <button
            className={`px-6 py-3 text-lg font-medium ${activeTab === 'announcements' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('announcements')}
          >
            Anúncios
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Post Creation Form */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6">
              <textarea
                className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                rows="3"
                placeholder={currentUser ? "O que você está pensando?" : "Faça login para postar..."}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                disabled={!currentUser}
              ></textarea>
              <button
                className={`w-full font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 ${currentUser ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'}`}
                onClick={handleAddPost}
                disabled={!currentUser}
              >
                <PlusCircle className="w-5 h-5" />
                <span>Publicar</span>
              </button>
            </div>

            {/* Feed Posts */}
            {loadingPosts ? (
              <div className="text-center text-gray-400">Carregando posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center text-gray-400">Nenhum post ainda. Seja o primeiro a publicar!</div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-gray-800 rounded-xl shadow-lg p-6 relative">
                  <div className="flex items-center mb-4">
                    {post.authorPhotoURL ? (
                      <img src={post.authorPhotoURL} alt="User Avatar" className="w-10 h-10 rounded-full mr-3 object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full mr-3 bg-gray-700 flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{post.author}</p>
                      <p className="text-sm text-gray-400">{post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Carregando...'}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">{post.content}</p>
                  <div className="flex justify-between items-center text-gray-400">
                    <div className="flex space-x-4">
                      <button 
                        className={`flex items-center space-x-1 ${currentUser ? 'hover:text-red-500' : 'cursor-not-allowed text-gray-500'}`}
                        onClick={() => handleLikePost(post.id)}
                        disabled={!currentUser}
                      >
                        <ThumbsUp className="w-4 h-4" /> <span className="text-sm">{post.likes}</span>
                      </button>
                      <button 
                        className={`flex items-center space-x-1 ${currentUser ? 'hover:text-blue-500' : 'cursor-not-allowed text-gray-500'}`}
                        onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                        disabled={!currentUser}
                      >
                        <MessageCircle className="w-4 h-4" /> <span className="text-sm">{post.comments}</span>
                      </button>
                      <div className="relative">
                        <button 
                          className={`flex items-center space-x-1 ${currentUser ? 'hover:text-yellow-500' : 'cursor-not-allowed text-gray-500'}`}
                          onClick={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                          disabled={!currentUser}
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                        {showEmojiPicker === post.id && (
                          <div className="absolute bottom-full left-0 mb-2 bg-gray-700 p-2 rounded-lg shadow-lg flex space-x-1">
                            {emojis.map(emoji => (
                              <button
                                key={emoji}
                                className="text-xl hover:scale-110 transition-transform"
                                onClick={() => handleReaction(post.id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {Object.entries(post.reactions || {}).map(([emoji, count]) => (
                        <span key={emoji} className="text-sm bg-gray-700 px-2 py-1 rounded-full">
                          {emoji} {count}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Comment Input */}
                  <div className="mt-4 flex items-center space-x-2">
                    <input
                      type="text"
                      className={`flex-grow p-2 rounded-lg ${currentUser ? 'bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                      placeholder={currentUser ? "Escreva um comentário..." : "Faça login para comentar..."}
                      value={commentContent[post.id] || ''}
                      onChange={(e) => setCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                      disabled={!currentUser}
                    />
                    <button
                      className={`p-2 rounded-lg transition-colors duration-200 ${currentUser ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                      onClick={() => handleCommentPost(post.id)}
                      disabled={!currentUser}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Comments List */}
                  {showComments[post.id] && post.commentsList && post.commentsList.length > 0 && (
                    <div className="mt-4 border-t border-gray-700 pt-4 space-y-3">
                      {post.commentsList.map(comment => (
                        <div key={comment.id} className="bg-gray-700 p-3 rounded-lg">
                          <div className="flex items-center mb-1">
                            {comment.authorPhotoURL ? (
                              <img src={comment.authorPhotoURL} alt="Commenter Avatar" className="w-6 h-6 rounded-full mr-2 object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full mr-2 bg-gray-600 flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                              </div>
                            )}
                            <p className="font-semibold text-white text-sm">{comment.author}</p>
                            <p className="text-xs text-gray-400 ml-2">{comment.timestamp ? new Date(comment.timestamp.toDate()).toLocaleString() : 'Carregando...'}</p>
                          </div>
                          <p className="text-gray-300 text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Anúncios Importantes</h2>
            <p className="text-gray-300">Aqui serão exibidos os anúncios da equipe Team HIIT. Fique ligado para novidades, eventos e promoções!</p>
            <ul className="list-disc list-inside mt-4 text-gray-300">
              <li>Novo desafio de 30 dias começando em 01/07!</li>
              <li>Live especial com o Renan Gonçalves na próxima semana.</li>
              <li>Desconto exclusivo para membros premium.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Community;



