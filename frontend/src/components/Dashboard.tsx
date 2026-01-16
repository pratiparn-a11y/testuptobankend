import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Plus, Heart, Trash2, X, Loader2, Calendar, Sparkles, Image as ImageIcon } from 'lucide-react';

interface Memory {
    id: number;
    title: string;
    note: string;
    image_url: string;
    created_at: string;
}

const Dashboard = () => {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newNote, setNewNote] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMemories();
    }, []);

    const fetchMemories = async () => {
        try {
            const response = await api.get('/memories/');
            setMemories(response.data);
        } catch (error) {
            console.error('Error fetching memories:', error);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleAddMemory = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', newTitle);
            formData.append('note', newNote || '');
            if (imageFile) {
                formData.append('image', imageFile);
            }
            if (imageUrl) {
                formData.append('image_url', imageUrl);
            }

            await api.post('/memories/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setNewTitle('');
            setNewNote('');
            setImageUrl('');
            setImageFile(null);
            setIsModalOpen(false);
            fetchMemories();
        } catch (error) {
            console.error('Error adding memory:', error);
            alert('เพิ่มความทรงจำไม่สำเร็จ 💔');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('คุณต้องการลบความทรงจำนี้ใช่ไหม? 💔')) return;
        try {
            await api.delete(`/memories/${id}`);
            setMemories(memories.filter((m) => m.id !== id));
        } catch (error) {
            console.error('Error deleting memory:', error);
        }
    };

    return (
        <div className="min-h-screen pb-20 relative">
            {/* Floating Hearts Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                {[...Array(8)].map((_, i) => (
                    <Heart
                        key={i}
                        className="absolute text-pink-500/10 animate-float-heart"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${Math.random() * 3 + 4}s`,
                        }}
                        size={Math.random() * 60 + 30}
                    />
                ))}
            </div>

            {/* Navbar */}
            <nav className="glass sticky top-0 z-50 border-b border-pink-300/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 animate-pulse-glow">
                            <Heart className="text-white h-6 w-6" fill="currentColor" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-2xl font-bold romantic-text">Memory Keeper</h1>
                            <p className="text-xs text-pink-200/50">เก็บความทรงจำแห่งรัก</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-pink-200/60 hover:text-red-400 transition-colors px-4 py-2 hover:bg-white/5 rounded-xl text-sm font-medium"
                    >
                        <span>ออกจากระบบ</span>
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-4xl font-bold romantic-text mb-3 flex items-center gap-3">
                            <Sparkles className="h-8 w-8 text-pink-400" />
                            ความทรงจำของเรา
                        </h2>
                        <p className="text-pink-200/60">รวบรวมช่วงเวลาแห่งความรัก ({memories.length} ความทรงจำ) 💕</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="glass-button px-6 py-4 rounded-2xl font-medium flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="hidden sm:inline">เพิ่มความทรงจำ</span>
                        <Heart className="h-4 w-4" fill="currentColor" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <Heart className="h-16 w-16 text-pink-400 animate-pulse" fill="currentColor" />
                        <p className="text-pink-200/60">กำลังโหลดความทรงจำ...</p>
                    </div>
                ) : memories.length === 0 ? (
                    <div className="glass rounded-3xl p-16 text-center">
                        <Heart className="h-24 w-24 text-pink-400/30 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-pink-200/80 mb-3">ยังไม่มีความทรงจำ</h3>
                        <p className="text-pink-200/50 mb-6">เริ่มเก็บช่วงเวลาดีๆ ของคุณกันเถอะ!</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="glass-button px-8 py-4 rounded-2xl inline-flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            เพิ่มความทรงจำแรก
                            <Heart className="h-4 w-4" fill="currentColor" />
                        </button>
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {memories.map((memory) => (
                            <div
                                key={memory.id}
                                className="glass rounded-3xl overflow-hidden break-inside-avoid hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 group hover:-translate-y-1"
                            >
                                {memory.image_url && (
                                    <div className="relative aspect-auto max-h-[400px] overflow-hidden">
                                        <img
                                            src={memory.image_url}
                                            alt={memory.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <button
                                            onClick={() => handleDelete(memory.id)}
                                            className="absolute bottom-4 right-4 text-white hover:text-red-400 bg-black/40 p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100 hover:bg-red-500/20"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Heart className="h-6 w-6 text-pink-400 drop-shadow-lg" fill="currentColor" />
                                        </div>
                                    </div>
                                )}
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold mb-2 text-pink-100 leading-tight flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-pink-400 flex-shrink-0" fill="currentColor" />
                                        {memory.title}
                                    </h3>
                                    {memory.note && (
                                        <p className="text-pink-200/60 text-sm leading-relaxed mb-4">
                                            {memory.note}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-pink-300/50 border-t border-pink-300/10 pt-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {new Date(memory.created_at).toLocaleDateString('th-TH', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        {!memory.image_url && (
                                            <button
                                                onClick={() => handleDelete(memory.id)}
                                                className="text-pink-300/40 hover:text-red-400 p-2 rounded-full transition hover:bg-white/5"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setIsModalOpen(false)}
                    />
                    <div className="glass w-full max-w-lg rounded-3xl p-8 relative z-10 border border-pink-300/20">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-pink-200/40 hover:text-white transition-colors p-2"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 romantic-text">
                            <Heart className="h-6 w-6 text-pink-400" fill="currentColor" />
                            เพิ่มความทรงจำใหม่
                        </h3>

                        <form onSubmit={handleAddMemory} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-pink-200/80 ml-1">💕 ชื่อความทรงจำ</label>
                                <input
                                    type="text"
                                    placeholder="ตั้งชื่อให้ช่วงเวลานี้..."
                                    className="glass-input w-full px-4 py-4"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-pink-200/80 ml-1">💭 บันทึกความรู้สึก</label>
                                <textarea
                                    placeholder="เขียนบรรยายความรู้สึกดีๆ..."
                                    className="glass-input w-full px-4 py-4 min-h-[120px] resize-none"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-pink-200/80 ml-1 flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        รูปภาพจากเครื่อง
                                    </label>
                                    <div className="relative border-2 border-dashed border-pink-300/20 rounded-2xl p-6 transition-colors hover:border-pink-500/50 hover:bg-white/5 text-center cursor-pointer group">
                                        <input
                                            type="file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                                            accept="image/*"
                                        />
                                        <div className="flex flex-col items-center gap-2 text-pink-200/40 group-hover:text-pink-300 transition-colors">
                                            {imageFile ? (
                                                <>
                                                    <Heart className="h-8 w-8 text-pink-500 animate-pulse" fill="currentColor" />
                                                    <span className="text-pink-200 font-medium truncate max-w-[200px]">{imageFile.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon className="h-8 w-8" />
                                                    <span>เลือกรูปภาพจากเครื่องของคุณ</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-pink-300/10"></div>
                                    <span className="flex-shrink mx-4 text-xs text-pink-200/20">หรือ</span>
                                    <div className="flex-grow border-t border-pink-300/10"></div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-pink-200/80 ml-1 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        วางลิงก์รูปภาพ
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://example.com/your-photo.jpg"
                                        className="glass-input w-full px-4 py-4"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="glass-button w-full py-4 rounded-2xl font-bold text-lg mt-6 disabled:opacity-60 flex justify-center items-center gap-3"
                            >
                                {submitting ? (
                                    <Loader2 className="animate-spin h-6 w-6" />
                                ) : (
                                    <>
                                        <Heart className="h-5 w-5" fill="currentColor" />
                                        บันทึกความทรงจำ
                                        <Sparkles className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
