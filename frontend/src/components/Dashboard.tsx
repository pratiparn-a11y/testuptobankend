import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Plus, Image as ImageIcon, Trash2, X, Loader2, Calendar } from 'lucide-react';

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
            await api.post('/memories/', {
                title: newTitle,
                note: newNote || null,
                image_url: imageUrl || null,
            });

            // Reset form
            setNewTitle('');
            setNewNote('');
            setImageUrl('');
            setIsModalOpen(false);

            // Refresh
            fetchMemories();
        } catch (error) {
            console.error('Error adding memory:', error);
            alert('เพิ่มความทรงจำไม่สำเร็จ (Failed to add memory)');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('คุณต้องการลบความทรงจำนี้ใช่ไหม? (Delete this memory?)')) return;
        try {
            await api.delete(`/memories/${id}`);
            setMemories(memories.filter((m) => m.id !== id));
        } catch (error) {
            console.error('Error deleting memory:', error);
        }
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Navbar */}
            <nav className="glass sticky top-0 z-50 border-b border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <ImageIcon className="text-white h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 hidden sm:block">
                            Memory Keeper
                        </h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors px-4 py-2 hover:bg-white/5 rounded-lg text-sm font-medium"
                    >
                        <span>ออกจากระบบ</span>
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header Section */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-2">My Gallery</h2>
                        <p className="text-gray-400">เก็บรวบรวมช่วงเวลาดีๆ ของคุณ ({memories.length} รายการ)</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="glass-button px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-xl shadow-purple-500/20"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="hidden sm:inline">เพิ่มความทรงจำ</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {memories.map((memory) => (
                            <div key={memory.id} className="glass rounded-2xl overflow-hidden break-inside-avoid hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group">
                                {memory.image_url && (
                                    <div className="relative aspect-auto max-h-[500px] overflow-hidden">
                                        <img
                                            src={memory.image_url}
                                            alt={memory.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                                            <button
                                                onClick={() => handleDelete(memory.id)}
                                                className="text-white hover:text-red-400 bg-black/40 p-2 rounded-full backdrop-blur-sm transition"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold mb-2 text-white/90 leading-tight">
                                        {memory.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-4 font-light">
                                        {memory.note}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-purple-300/70 border-t border-white/5 pt-4">
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
                                            className="absolute top-4 right-4 text-gray-500 hover:text-red-400 bg-white/5 p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
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
                        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                        onClick={() => setIsModalOpen(false)}
                    ></div>
                    <div className="glass w-full max-w-lg rounded-2xl p-8 relative z-10 animate-fade-in-up">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Plus className="h-6 w-6 text-purple-400" />
                            เพิ่มความทรงจำใหม่
                        </h3>

                        <form onSubmit={handleAddMemory} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">หัวข้อ</label>
                                <input
                                    type="text"
                                    placeholder="ตั้งชื่อความทรงจำ..."
                                    className="glass-input w-full px-4 py-3 rounded-xl"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">บันทึกช่วยจำ</label>
                                <textarea
                                    placeholder="เขียนบรรยายความรู้สึก..."
                                    className="glass-input w-full px-4 py-3 rounded-xl min-h-[120px] resize-none"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">ลิงก์รูปภาพ (ถ้ามี)</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    className="glass-input w-full px-4 py-3 rounded-xl"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 ml-1">วาง URL รูปภาพจาก Imgur, Google Photos หรือเว็บอื่นๆ</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="glass-button w-full py-4 rounded-xl font-bold text-lg mt-4 disabled:opacity-70 flex justify-center items-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : 'บันทึกความทรงจำ'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
