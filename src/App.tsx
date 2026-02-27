import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc, 
  orderBy 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  LogOut, 
  LogIn, 
  ListTodo, 
  Search,
  AlertCircle,
  Clock,
  Settings
} from 'lucide-react';
import { getDb, getFirebaseAuth, googleProvider, isFirebaseConfigured } from './lib/firebase';
import { Todo } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [priority, setPriority] = useState<Todo['priority']>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      setTodos([]);
      return;
    }

    const db = getDb();
    const q = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todoData: Todo[] = [];
      snapshot.forEach((doc) => {
        todoData.push({ id: doc.id, ...doc.data() } as Todo);
      });
      setTodos(todoData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    if (!isFirebaseConfigured) return;
    try {
      await signInWithPopup(getFirebaseAuth(), googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    if (!isFirebaseConfigured) return;
    try {
      await signOut(getFirebaseAuth());
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || !isFirebaseConfigured) return;

    try {
      await addDoc(collection(getDb(), 'todos'), {
        text: inputValue,
        completed: false,
        createdAt: Date.now(),
        userId: user.uid,
        priority: priority
      });
      setInputValue('');
    } catch (error) {
      console.error("Error adding todo:", error);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    if (!isFirebaseConfigured) return;
    try {
      const todoRef = doc(getDb(), 'todos', id);
      await updateDoc(todoRef, { completed: !completed });
    } catch (error) {
      console.error("Error toggling todo:", error);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!isFirebaseConfigured) return;
    try {
      await deleteDoc(doc(getDb(), 'todos', id));
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const filteredTodos = todos.filter(t => 
    t.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full glass-card p-8 rounded-[32px] text-center">
          <div className="inline-flex p-4 bg-amber-50 rounded-2xl mb-6">
            <Settings className="w-10 h-10 text-amber-600 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">Cấu hình Firebase trống</h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            Ứng dụng cần thông tin cấu hình Firebase để hoạt động. Vui lòng thêm các biến môi trường (API Key, Project ID,...) vào bảng điều khiển <strong>Secrets</strong> của AI Studio.
          </p>
          <div className="bg-zinc-100 p-4 rounded-xl text-left text-xs font-mono text-zinc-600 space-y-1">
            <p>VITE_FIREBASE_API_KEY</p>
            <p>VITE_FIREBASE_AUTH_DOMAIN</p>
            <p>VITE_FIREBASE_PROJECT_ID</p>
            <p>...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <ListTodo className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-zinc-900">FireTodo</h1>
              <p className="text-sm text-zinc-500 font-medium">Quản lý tác vụ thông minh</p>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-zinc-900">{user.displayName}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
              <img 
                src={user.photoURL || ''} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
              <button 
                onClick={handleLogout}
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-full font-semibold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 active:scale-95"
            >
              <LogIn className="w-5 h-5" />
              <span>Đăng nhập Google</span>
            </button>
          )}
        </header>

        {user ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Input Form */}
            <form onSubmit={addTodo} className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Hôm nay bạn cần làm gì?"
                  className="flex-1 bg-zinc-100 border-none rounded-2xl px-5 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="bg-indigo-600 text-white p-3.5 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Độ ưu tiên:</span>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border",
                        priority === p 
                          ? p === 'high' ? "bg-red-50 border-red-200 text-red-600" :
                            p === 'medium' ? "bg-amber-50 border-amber-200 text-amber-600" :
                            "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : "bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300"
                      )}
                    >
                      {p === 'low' ? 'Thấp' : p === 'medium' ? 'Vừa' : 'Cao'}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Search & Stats */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công việc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex gap-6 text-sm font-medium text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {todos.length} tổng cộng
                </span>
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <CheckCircle2 className="w-4 h-4" /> {todos.filter(t => t.completed).length} hoàn thành
                </span>
              </div>
            </div>

            {/* Todo List */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredTodos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group glass-card p-4 rounded-2xl flex items-center gap-4 transition-all hover:shadow-md",
                      todo.completed && "opacity-60"
                    )}
                  >
                    <button 
                      onClick={() => toggleTodo(todo.id, todo.completed)}
                      className={cn(
                        "transition-colors",
                        todo.completed ? "text-indigo-600" : "text-zinc-300 hover:text-zinc-400"
                      )}
                    >
                      {todo.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-zinc-900 font-medium transition-all truncate",
                        todo.completed && "line-through text-zinc-400"
                      )}>
                        {todo.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          todo.priority === 'high' ? "bg-red-500" :
                          todo.priority === 'medium' ? "bg-amber-500" :
                          "bg-emerald-500"
                        )} />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                          {todo.priority === 'low' ? 'Ưu tiên thấp' : todo.priority === 'medium' ? 'Ưu tiên vừa' : 'Ưu tiên cao'}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredTodos.length === 0 && (
                <div className="text-center py-20">
                  <div className="inline-flex p-4 bg-zinc-100 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-zinc-500 font-medium">Không tìm thấy công việc nào.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20 glass-card rounded-[40px] p-12">
            <div className="inline-flex p-6 bg-indigo-50 rounded-[32px] mb-8">
              <ListTodo className="w-16 h-16 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold font-display text-zinc-900 mb-4">Chào mừng bạn!</h2>
            <p className="text-zinc-500 max-w-sm mx-auto mb-10 leading-relaxed">
              Đăng nhập để bắt đầu quản lý công việc của bạn một cách khoa học và hiệu quả hơn.
            </p>
            <button 
              onClick={handleLogin}
              className="flex items-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 active:scale-95 mx-auto"
            >
              <LogIn className="w-6 h-6" />
              <span>Bắt đầu ngay với Google</span>
            </button>
          </div>
        )}

        <footer className="mt-20 text-center">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Powered by Firebase & React
          </p>
        </footer>
      </div>
    </div>
  );
}
