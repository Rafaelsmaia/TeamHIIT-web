import React, { useState, useEffect } from 'react';
import Header from '../components/ui/Header.jsx';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
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
  const [userInteractions, setUserInteractions] = useState({}); // Armazenar interações do usuário

  const emojis = ['👍', '❤️', '😂', '🔥', '😢', '🙏'];
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      if (user) {
        fetchUserInteractions(user.uid);
      }
    });
    return unsubscribe;
  }, [auth]);

  // Buscar interações do usuário atual
  const fetchUserInteractions = async (userId) => {
    try {
      const interactionsCollection = collection(db, 'userInteractions', userId, 'posts');
      const querySnapshot = await getDocs(interactionsCollection);
      const interactions = {};
      querySnapshot.docs.forEach(doc => {
        interactions[doc.id] = doc.data();
      });
      setUserInteractions(interactions);
    } catch (error) {
      console.error('Erro ao buscar interações do usuário:', error);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
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
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
    }
    setLoadingPosts(false);
  };

  // Atualizar um post específico sem recarregar todos
  const updatePostInState = (postId, updates) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      )
    );
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
        authorPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        reactions: {}
      });
      setNewPostContent('');
      fetchPosts(); // Recarregar apenas quando adicionar novo post
    } catch (e) {
      console.error('Erro ao adicionar documento: ', e);
    }
  };

  const handleLikePost = async (postId) => {
    if (!currentUser) {
      alert('Você precisa estar logado para curtir uma postagem.');
      return;
    }

    const userInteraction = userInteractions[postId];
    const hasLiked = userInteraction?.liked;

    try {
      const postRef = doc(db, 'posts', postId);
      const userInteractionRef = doc(db, 'userInteractions', currentUser.uid, 'posts', postId);

      if (hasLiked) {
        // Remover curtida
        await updateDoc(postRef, {
          likes: increment(-1)
        });
        await deleteDoc(userInteractionRef);
        
        // Atualizar estado local
        setUserInteractions(prev => {
          const newInteractions = { ...prev };
          delete newInteractions[postId];
          return newInteractions;
        });
        
        // Atualizar post no estado
        const currentPost = posts.find(p => p.id === postId);
        updatePostInState(postId, { likes: currentPost.likes - 1 });
      } else {
        // Adicionar curtida (remover reação se existir)
        const increment_value = userInteraction?.reaction ? 0 : 1; // Se tinha reação, não incrementa
        
        await updateDoc(postRef, {
          likes: increment(increment_value),
          ...(userInteraction?.reaction && {
            [`reactions.${userInteraction.reaction}`]: increment(-1)
          })
        });
        
        await setDoc(userInteractionRef, {
          liked: true,
          timestamp: serverTimestamp()
        });
        
        // Atualizar estado local
        setUserInteractions(prev => ({
          ...prev,
          [postId]: { liked: true, timestamp: new Date() }
        }));
        
        // Atualizar post no estado
        const currentPost = posts.find(p => p.id === postId);
        const updates = { likes: currentPost.likes + increment_value };
        if (userInteraction?.reaction) {
          updates.reactions = {
            ...currentPost.reactions,
            [userInteraction.reaction]: (currentPost.reactions[userInteraction.reaction] || 1) - 1
          };
        }
        updatePostInState(postId, updates);
      }
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
      const newComment = {
        content: content,
        author: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        authorPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, 'posts', postId, 'comments'), newComment);
      await updateDoc(postRef, {
        comments: increment(1)
      });
      
      // Atualizar estado local
      const currentPost = posts.find(p => p.id === postId);
      const newCommentWithId = {
        ...newComment,
        id: Date.now().toString(), // ID temporário
        timestamp: new Date()
      };
      
      updatePostInState(postId, {
        comments: currentPost.comments + 1,
        commentsList: [...(currentPost.commentsList || []), newCommentWithId]
      });
      
      setCommentContent(prev => ({ ...prev, [postId]: '' }));
    } catch (e) {
      console.error('Erro ao comentar post: ', e);
    }
  };

  const handleReaction = async (postId, emoji) => {
    if (!currentUser) {
      alert('Você precisa estar logado para reagir a uma postagem.');
      return;
    }

    const userInteraction = userInteractions[postId];
    const currentReaction = userInteraction?.reaction;

    try {
      const postRef = doc(db, 'posts', postId);
      const userInteractionRef = doc(db, 'userInteractions', currentUser.uid, 'posts', postId);

      if (currentReaction === emoji) {
        // Remover reação atual
        await updateDoc(postRef, {
          [`reactions.${emoji}`]: increment(-1),
          ...(userInteraction?.liked && { likes: increment(-1) })
        });
        await deleteDoc(userInteractionRef);
        
        // Atualizar estado local
        setUserInteractions(prev => {
          const newInteractions = { ...prev };
          delete newInteractions[postId];
          return newInteractions;
        });
        
        // Atualizar post no estado
        const currentPost = posts.find(p => p.id === postId);
        const updates = {
          reactions: {
            ...currentPost.reactions,
            [emoji]: (currentPost.reactions[emoji] || 1) - 1
          }
        };
        if (userInteraction?.liked) {
          updates.likes = currentPost.likes - 1;
        }
        updatePostInState(postId, updates);
      } else {
        // Trocar reação ou adicionar nova
        const updateData = {
          [`reactions.${emoji}`]: increment(1)
        };
        
        // Se tinha reação anterior, decrementar
        if (currentReaction) {
          updateData[`reactions.${currentReaction}`] = increment(-1);
        }
        
        // Se tinha curtida, remover
        if (userInteraction?.liked) {
          updateData.likes = increment(-1);
        }
        
        await updateDoc(postRef, updateData);
        await setDoc(userInteractionRef, {
          reaction: emoji,
          timestamp: serverTimestamp()
        });
        
        // Atualizar estado local
        setUserInteractions(prev => ({
          ...prev,
          [postId]: { reaction: emoji, timestamp: new Date() }
        }));
        
        // Atualizar post no estado
        const currentPost = posts.find(p => p.id === postId);
        const updates = {
          reactions: {
            ...currentPost.reactions,
            [emoji]: (currentPost.reactions[emoji] || 0) + 1
          }
        };
        
        if (currentReaction) {
          updates.reactions[currentReaction] = (currentPost.reactions[currentReaction] || 1) - 1;
        }
        
        if (userInteraction?.liked) {
          updates.likes = currentPost.likes - 1;
        }
        
        updatePostInState(postId, updates);
      }
      
      setShowEmojiPicker(null);
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
              posts.map((post) => {
                const userInteraction = userInteractions[post.id];
                const hasLiked = userInteraction?.liked;
                const userReaction = userInteraction?.reaction;
                
                return (
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
                          className={`flex items-center space-x-1 transition-colors ${
                            currentUser 
                              ? hasLiked 
                                ? 'text-red-500 hover:text-red-400' 
                                : 'hover:text-red-500'
                              : 'cursor-not-allowed text-gray-500'
                          }`}
                          onClick={() => handleLikePost(post.id)}
                          disabled={!currentUser}
                        >
                          <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} /> 
                          <span className="text-sm">{post.likes || 0}</span>
                        </button>
                        <button 
                          className={`flex items-center space-x-1 ${currentUser ? 'hover:text-blue-500' : 'cursor-not-allowed text-gray-500'}`}
                          onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                          disabled={!currentUser}
                        >
                          <MessageCircle className="w-4 h-4" /> <span className="text-sm">{post.comments || 0}</span>
                        </button>
                        <div className="relative">
                          <button 
                            className={`flex items-center space-x-1 transition-colors ${
                              currentUser 
                                ? userReaction 
                                  ? 'text-yellow-500 hover:text-yellow-400' 
                                  : 'hover:text-yellow-500'
                                : 'cursor-not-allowed text-gray-500'
                            }`}
                            onClick={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                            disabled={!currentUser}
                          >
                            {userReaction ? (
                              <span className="text-lg">{userReaction}</span>
                            ) : (
                              <Smile className="w-4 h-4" />
                            )}
                          </button>
                          {showEmojiPicker === post.id && (
                            <div className="absolute bottom-full left-0 mb-2 bg-gray-700 p-2 rounded-lg shadow-lg flex space-x-1 z-10">
                              {emojis.map(emoji => (
                                <button
                                  key={emoji}
                                  className={`text-xl hover:scale-110 transition-transform ${
                                    userReaction === emoji ? 'bg-gray-600 rounded' : ''
                                  }`}
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
                          count > 0 && (
                            <span key={emoji} className="text-sm bg-gray-700 px-2 py-1 rounded-full">
                              {emoji} {count}
                            </span>
                          )
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
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCommentPost(post.id);
                          }
                        }}
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
                              <p className="text-xs text-gray-400 ml-2">{comment.timestamp ? new Date(comment.timestamp.toDate ? comment.timestamp.toDate() : comment.timestamp).toLocaleString() : 'Carregando...'}</p>
                            </div>
                            <p className="text-gray-300 text-sm">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
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