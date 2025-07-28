import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/ui/Header.jsx';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Send, ThumbsUp, MessageCircle, Smile, PlusCircle, Camera, Image, X, Heart, Share2, Bookmark, MoreHorizontal } from 'lucide-react';

function Community() {
  const [activeTab, setActiveTab] = useState('feed');
  const [newPostContent, setNewPostContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [commentContent, setCommentContent] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [userInteractions, setUserInteractions] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [imagePreview, setImagePreview] = useState([]);
  const [compressingImages, setCompressingImages] = useState(false);
  const fileInputRef = useRef(null);

  const emojis = ['👍', '❤️', '😂', '🔥', '😢', '🙏', '💪', '🎯', '⚡', '🏆'];
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

  // Função para comprimir imagem - VERSÃO MELHORADA E ROBUSTA
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          try {
            // Calcular dimensões mantendo proporção
            let { width, height } = img;
            
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Desenhar imagem redimensionada
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converter para blob comprimido
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({
                    blob: blob,
                    originalSize: file.size,
                    compressedSize: blob.size,
                    compressionRatio: Math.round((1 - blob.size / file.size) * 100)
                  });
                } else {
                  // Fallback: usar arquivo original
                  resolve({
                    blob: file,
                    originalSize: file.size,
                    compressedSize: file.size,
                    compressionRatio: 0
                  });
                }
              },
              'image/jpeg',
              quality
            );
          } catch (error) {
            console.warn('Erro na compressão, usando arquivo original:', error);
            resolve({
              blob: file,
              originalSize: file.size,
              compressedSize: file.size,
              compressionRatio: 0
            });
          }
        };
        
        img.onerror = () => {
          console.warn('Erro ao carregar imagem, usando arquivo original');
          resolve({
            blob: file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0
          });
        };
        
        img.src = URL.createObjectURL(file);
        
      } catch (error) {
        console.warn('Erro geral na compressão, usando arquivo original:', error);
        resolve({
          blob: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0
        });
      }
    });
  };

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

  // Função para selecionar e comprimir imagens - VERSÃO MELHORADA
  const handleImageSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length + selectedImages.length > 4) {
      alert('Você pode selecionar no máximo 4 imagens por post.');
      return;
    }

    setCompressingImages(true);

    try {
      const processedImages = [];
      const newPreviews = [];

      for (const file of files) {
        // Verificar tamanho original - AUMENTADO PARA 50MB
        if (file.size > 50 * 1024 * 1024) {
          alert(`A imagem ${file.name} é muito grande. Máximo 50MB por imagem.`);
          continue;
        }

        if (!file.type.startsWith('image/')) {
          alert(`${file.name} não é um arquivo de imagem válido.`);
          continue;
        }

        try {
          // Tentar compressão
          const compressionResult = await compressImage(file);
          
          // Verificar se precisa comprimir mais
          let finalResult = compressionResult;
          if (compressionResult.compressedSize > 5 * 1024 * 1024) {
            // Comprimir mais agressivamente
            finalResult = await compressImage(file, 800, 0.6);
            
            // Se ainda muito grande, tentar uma última vez
            if (finalResult.compressedSize > 5 * 1024 * 1024) {
              finalResult = await compressImage(file, 600, 0.5);
            }
          }
          
          // Se ainda muito grande após todas as tentativas, rejeitar
          if (finalResult.compressedSize > 5 * 1024 * 1024) {
            alert(`${file.name} não pôde ser comprimida suficientemente. Tente uma imagem menor.`);
            continue;
          }
          
          // Criar arquivo comprimido com nome original
          const compressedFile = new File([finalResult.blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });

          processedImages.push(compressedFile);

          // Criar preview
          const previewUrl = URL.createObjectURL(finalResult.blob);
          newPreviews.push({
            file: compressedFile,
            url: previewUrl,
            id: Date.now() + Math.random(),
            originalSize: file.size,
            compressedSize: finalResult.compressedSize,
            compressionRatio: finalResult.compressionRatio
          });
          
        } catch (compressionError) {
          console.warn(`Erro na compressão de ${file.name}:`, compressionError);
          
          // Fallback: usar arquivo original se não for muito grande
          if (file.size <= 5 * 1024 * 1024) {
            processedImages.push(file);
            
            const previewUrl = URL.createObjectURL(file);
            newPreviews.push({
              file: file,
              url: previewUrl,
              id: Date.now() + Math.random(),
              originalSize: file.size,
              compressedSize: file.size,
              compressionRatio: 0
            });
          } else {
            alert(`${file.name} é muito grande e não pôde ser processada.`);
          }
        }
      }

      setSelectedImages(prev => [...prev, ...processedImages]);
      setImagePreview(prev => [...prev, ...newPreviews]);
      
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      alert('Erro ao processar imagens. Tente novamente.');
    } finally {
      setCompressingImages(false);
    }
  };

  // Remover imagem selecionada
  const removeImage = (index) => {
    // Limpar URL do preview para evitar memory leak
    if (imagePreview[index]?.url) {
      URL.revokeObjectURL(imagePreview[index].url);
    }
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  // Upload de imagens para Firebase Storage
  const uploadImages = async (images) => {
    const uploadPromises = images.map(async (image, index) => {
      const timestamp = Date.now();
      const imageRef = ref(storage, `community/${currentUser.uid}/${timestamp}_${index}_${image.name}`);
      const snapshot = await uploadBytes(imageRef, image);
      return await getDownloadURL(snapshot.ref);
    });
    return await Promise.all(uploadPromises);
  };

  const handleAddPost = async () => {
    if (newPostContent.trim() === '' && selectedImages.length === 0) {
      alert('Adicione um texto ou pelo menos uma imagem para publicar.');
      return;
    }
    if (!currentUser) {
      alert('Você precisa estar logado para fazer uma postagem.');
      return;
    }

    setUploadingPost(true);
    try {
      let imageUrls = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages(selectedImages);
      }

      await addDoc(collection(db, 'posts'), {
        content: newPostContent,
        author: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        authorPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        reactions: {},
        images: imageUrls,
        type: imageUrls.length > 0 ? 'photo' : 'text'
      });
      
      setNewPostContent('');
      setSelectedImages([]);
      
      // Limpar previews e URLs
      imagePreview.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
      setImagePreview([]);
      
      fetchPosts(); // Recarregar apenas quando adicionar novo post
    } catch (e) {
      console.error('Erro ao adicionar documento: ', e);
      alert('Erro ao publicar post. Tente novamente.');
    }
    setUploadingPost(false);
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

  // Função para formatar tamanho de arquivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <Header />
      <div className="container mx-auto px-4 md:px-6 py-8 pt-20 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">Comunidade Team HIIT</h1>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 mb-8">
          <button
            className={`px-4 md:px-6 py-3 text-sm md:text-lg font-medium ${activeTab === 'feed' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('feed')}
          >
            Feed
          </button>
          <button
            className={`px-4 md:px-6 py-3 text-sm md:text-lg font-medium ${activeTab === 'announcements' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('announcements')}
          >
            Anúncios
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'feed' && (
          <div className="space-y-6">
            {/* Post Creation Form */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex items-start space-x-3 mb-4">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Your Avatar" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows="3"
                    placeholder={currentUser ? "Compartilhe seus resultados, dicas ou motivação..." : "Faça login para postar..."}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    disabled={!currentUser}
                  ></textarea>
                </div>
              </div>

              {/* Image Preview - CORRIGIDO PARA MANTER PROPORÇÕES */}
              {imagePreview.length > 0 && (
                <div className="mb-4">
                  <div className={`grid gap-2 ${imagePreview.length === 1 ? 'grid-cols-1' : imagePreview.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {imagePreview.map((preview, index) => (
                      <div key={preview.id} className="relative group">
                        <img 
                          src={preview.url} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full object-contain rounded-lg bg-gray-900"
                          style={{ maxHeight: '300px', height: 'auto' }}
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {/* Informações de compressão - MELHORADAS */}
                        {preview.compressionRatio > 0 && (
                          <div className="absolute bottom-2 left-2 bg-green-600 bg-opacity-90 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                            <span>📉</span>
                            <span>-{preview.compressionRatio}%</span>
                          </div>
                        )}
                        {/* Tamanho final */}
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {formatFileSize(preview.compressedSize)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Estatísticas de compressão - MELHORADAS */}
                  {imagePreview.some(p => p.compressionRatio > 0) && (
                    <div className="mt-3 p-3 bg-green-900 bg-opacity-30 border border-green-600 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-400 text-sm">
                        <span>✅</span>
                        <span>Imagens otimizadas automaticamente!</span>
                      </div>
                      <div className="text-xs text-green-300 mt-1">
                        Economia total: {Math.round(imagePreview.reduce((acc, p) => acc + (p.originalSize - p.compressedSize), 0) / 1024)} KB
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Loading de compressão - MELHORADO */}
              {compressingImages && (
                <div className="mb-4 flex items-center justify-center p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-3"></div>
                  <div className="text-blue-400">
                    <div className="font-medium">Otimizando imagens...</div>
                    <div className="text-xs text-blue-300">Reduzindo tamanho para melhor performance</div>
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!currentUser || selectedImages.length >= 4 || compressingImages}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      currentUser && selectedImages.length < 4 && !compressingImages
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-600 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">Foto</span>
                  </button>
                  {selectedImages.length > 0 && (
                    <span className="text-xs text-gray-400">{selectedImages.length}/4 imagens</span>
                  )}
                </div>
                <button
                  className={`font-bold py-2 px-6 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
                    currentUser && !uploadingPost && !compressingImages
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-600 cursor-not-allowed text-gray-400'
                  }`}
                  onClick={handleAddPost}
                  disabled={!currentUser || uploadingPost || compressingImages}
                >
                  {uploadingPost ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Publicar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Feed Posts */}
            {loadingPosts ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-gray-700 rounded-full mr-3"></div>
                      <div>
                        <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-40 bg-gray-700 rounded mb-4"></div>
                    <div className="flex space-x-4">
                      <div className="h-8 bg-gray-700 rounded w-16"></div>
                      <div className="h-8 bg-gray-700 rounded w-16"></div>
                      <div className="h-8 bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum post ainda</h3>
                <p className="text-gray-400 mb-6">Seja o primeiro a compartilhar sua jornada fitness!</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!currentUser}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentUser
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {currentUser ? 'Compartilhar Foto' : 'Faça login para postar'}
                </button>
              </div>
            ) : (
              posts.map((post) => {
                const userInteraction = userInteractions[post.id];
                const hasLiked = userInteraction?.liked;
                const userReaction = userInteraction?.reaction;
                
                return (
                  <div key={post.id} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                    {/* Post Header */}
                    <div className="p-4 md:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
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
                        <button className="text-gray-400 hover:text-white">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Post Content */}
                      {post.content && (
                        <p className="text-gray-300 mb-4 leading-relaxed">{post.content}</p>
                      )}
                    </div>

                    {/* Post Images - CORRIGIDO PARA MANTER PROPORÇÕES */}
                    {post.images && post.images.length > 0 && (
                      <div className={`${post.images.length === 1 ? '' : 'p-4 md:p-6 pt-0'}`}>
                        <div className={`grid gap-1 ${
                          post.images.length === 1 ? 'grid-cols-1' : 
                          post.images.length === 2 ? 'grid-cols-2' : 
                          post.images.length === 3 ? 'grid-cols-2' : 
                          'grid-cols-2'
                        }`}>
                          {post.images.map((imageUrl, index) => (
                            <div key={index} className={`relative ${
                              post.images.length === 1 ? 'col-span-1' :
                              post.images.length === 3 && index === 0 ? 'col-span-2' :
                              'col-span-1'
                            }`}>
                              <img 
                                src={imageUrl} 
                                alt={`Post image ${index + 1}`} 
                                className={`w-full object-contain cursor-pointer hover:opacity-95 transition-opacity bg-gray-900 ${
                                  post.images.length === 1 ? '' : 'rounded-lg'
                                }`}
                                style={{ 
                                  maxHeight: post.images.length === 1 ? '500px' : '300px',
                                  height: 'auto'
                                }}
                                onClick={() => {
                                  // Implementar modal de visualização de imagem
                                  window.open(imageUrl, '_blank');
                                }}
                              />
                              {post.images.length > 4 && index === 3 && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                                  <span className="text-white text-xl font-bold">+{post.images.length - 4}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="p-4 md:p-6 pt-0">
                      <div className="flex justify-between items-center text-gray-400 mb-4">
                        <div className="flex space-x-6">
                          <button 
                            className={`flex items-center space-x-2 transition-colors ${
                              currentUser 
                                ? hasLiked 
                                  ? 'text-red-500 hover:text-red-400' 
                                  : 'hover:text-red-500'
                                : 'cursor-not-allowed text-gray-500'
                            }`}
                            onClick={() => handleLikePost(post.id)}
                            disabled={!currentUser}
                          >
                            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} /> 
                            <span className="text-sm font-medium">{post.likes || 0}</span>
                          </button>
                          <button 
                            className={`flex items-center space-x-2 ${currentUser ? 'hover:text-blue-500' : 'cursor-not-allowed text-gray-500'}`}
                            onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                            disabled={!currentUser}
                          >
                            <MessageCircle className="w-5 h-5" /> 
                            <span className="text-sm font-medium">{post.comments || 0}</span>
                          </button>
                          <div className="relative">
                            <button 
                              className={`flex items-center space-x-2 transition-colors ${
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
                                <Smile className="w-5 h-5" />
                              )}
                            </button>
                            {showEmojiPicker === post.id && (
                              <div className="absolute bottom-full left-0 mb-2 bg-gray-700 p-3 rounded-lg shadow-lg z-10">
                                <div className="grid grid-cols-5 gap-2">
                                  {emojis.map(emoji => (
                                    <button
                                      key={emoji}
                                      className={`text-xl hover:scale-110 transition-transform p-1 rounded ${
                                        userReaction === emoji ? 'bg-gray-600' : 'hover:bg-gray-600'
                                      }`}
                                      onClick={() => handleReaction(post.id, emoji)}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button className="hover:text-blue-500 transition-colors">
                            <Share2 className="w-5 h-5" />
                          </button>
                          <button className="hover:text-yellow-500 transition-colors">
                            <Bookmark className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Reactions Display */}
                      {Object.entries(post.reactions || {}).some(([emoji, count]) => count > 0) && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {Object.entries(post.reactions || {}).map(([emoji, count]) => (
                            count > 0 && (
                              <span key={emoji} className="text-sm bg-gray-700 px-3 py-1 rounded-full flex items-center space-x-1">
                                <span>{emoji}</span>
                                <span className="text-gray-300">{count}</span>
                              </span>
                            )
                          ))}
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="flex items-center space-x-3 mb-4">
                        {currentUser?.photoURL ? (
                          <img src={currentUser.photoURL} alt="Your Avatar" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                          </div>
                        )}
                        <input
                          type="text"
                          className={`flex-grow p-3 rounded-full text-sm ${currentUser ? 'bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                          placeholder={currentUser ? "Adicione um comentário..." : "Faça login para comentar..."}
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
                          className={`p-2 rounded-full transition-colors duration-200 ${currentUser ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                          onClick={() => handleCommentPost(post.id)}
                          disabled={!currentUser}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Comments List */}
                      {showComments[post.id] && post.commentsList && post.commentsList.length > 0 && (
                        <div className="space-y-3">
                          {post.commentsList.map(comment => (
                            <div key={comment.id} className="flex items-start space-x-3">
                              {comment.authorPhotoURL ? (
                                <img src={comment.authorPhotoURL} alt="Commenter Avatar" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 bg-gray-700 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold text-white text-sm">{comment.author}</p>
                                  <p className="text-xs text-gray-400">{comment.timestamp ? new Date(comment.timestamp.toDate ? comment.timestamp.toDate() : comment.timestamp).toLocaleString() : 'Carregando...'}</p>
                                </div>
                                <p className="text-gray-300 text-sm">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Anúncios Importantes</h2>
            <p className="text-gray-300 mb-6">Aqui serão exibidos os anúncios da equipe Team HIIT. Fique ligado para novidades, eventos e promoções!</p>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-4">
                <h3 className="text-white font-bold mb-2">🔥 Novo Desafio de 30 Dias!</h3>
                <p className="text-red-100">Começando em 01/07! Prepare-se para transformar seu corpo com treinos intensos.</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4">
                <h3 className="text-white font-bold mb-2">📺 Live Especial</h3>
                <p className="text-blue-100">Live com o Renan Gonçalves na próxima semana. Não perca!</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-4">
                <h3 className="text-white font-bold mb-2">💰 Desconto Exclusivo</h3>
                <p className="text-green-100">Membros premium têm desconto especial em produtos selecionados.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Community;

