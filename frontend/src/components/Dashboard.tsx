import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    Heart,
    Plus,
    Trash2,
    LogOut,
    Image as ImageIcon,
    X,
    Sparkles,
    Camera,
    ChevronLeft,
    ChevronRight,
    Download,
    Clock,
    Calendar,
    Loader2,
    Pencil,
    Lock as LockIcon
} from 'lucide-react';

interface MemoryImage {
    id: number;
    url: string;
}

interface Memory {
    id: number;
    title: string;
    note: string;
    images: MemoryImage[];
    created_at: string;
}

const Dashboard = () => {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newNote, setNewNote] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [username, setUsername] = useState('');
    const [sessionDuration, setSessionDuration] = useState('');
    const [expiryTime, setExpiryTime] = useState('');
    const [lightboxData, setLightboxData] = useState<{ images: MemoryImage[], index: number } | null>(null);
    const [viewAllMemory, setViewAllMemory] = useState<Memory | null>(null);
    const [isDeletingImage, setIsDeletingImage] = useState<number | null>(null);
    const [editMemory, setEditMemory] = useState<Memory | null>(null);
    const [isDetailsUnlocked, setIsDetailsUnlocked] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Scroll to initial index when lightbox opens
    useEffect(() => {
        if (lightboxData && scrollRef.current) {
            const container = scrollRef.current;
            // Use requestAnimationFrame to ensure the container has rendered and has width
            requestAnimationFrame(() => {
                const targetX = lightboxData.index * container.clientWidth;
                container.scrollTo({ left: targetX, behavior: 'auto' });
            });
        }
    }, [lightboxData?.images.length]); // Re-run if images change or lightbox opens

    useEffect(() => {
        fetchUserProfile();
        fetchMemories();

        // Session Tracking Logic
        const loginAtStr = localStorage.getItem('login_at');
        if (loginAtStr) {
            const loginAt = new Date(loginAtStr);
            const expiry = new Date(loginAt.getTime() + 7 * 24 * 60 * 60 * 1000);
            setExpiryTime(expiry.toLocaleString('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }));

            const timer = setInterval(() => {
                const now = new Date();
                const diff = now.getTime() - loginAt.getTime();

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setSessionDuration(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }, 1000);

            return () => clearInterval(timer);
        }

        // Check session when user returns to the tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchUserProfile();
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/me');
            setUsername(response.data.username);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length > 0) {
            setImageFiles(prev => [...prev, ...files]);

            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
        // Reset input to allow re-selecting same photo if needed or triggered again
        e.target.value = '';
    };

    const handleRemoveSelectedImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddMemory = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', newTitle);
            formData.append('note', newNote || '');

            imageFiles.forEach(file => {
                formData.append('images', file);
            });

            if (imageUrl) {
                formData.append('image_urls', imageUrl);
            }

            if (editMemory) {
                await api.put(`/memories/${editMemory.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await api.post('/memories/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            setNewTitle('');
            setNewNote('');
            setImageUrl('');
            setImageFiles([]);
            setImagePreviews([]);
            setIsModalOpen(false);
            setEditMemory(null);
            fetchMemories();
        } catch (error: any) {
            console.error('Error saving memory:', error);
            if (error.response?.status === 401) {
                alert('เซสชันหมดอายุ กรุณาล็อกอินใหม่อีกครั้งเพื่อความปลอดภัยครับ 🔒');
            } else {
                alert('บันทึกความทรงจำไม่สำเร็จ กรุณาลองใหม่อีกครั้งครับ 💔');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (e: React.MouseEvent, memory: Memory) => {
        e.stopPropagation();
        setEditMemory(memory);
        setNewTitle(memory.title);
        setNewNote(memory.note || '');
        setIsDetailsUnlocked(false);
        setIsModalOpen(true);
    };

    const handleUnlockDetails = () => {
        const pin = window.prompt('กรุณาใส่รหัสยืนยันเพื่อแก้ไขข้อมูล (หากไม่ทราบกรุณาติดต่อผู้พัฒนา) 🤫');
        if (pin === '0411') {
            setIsDetailsUnlocked(true);
        } else if (pin !== null) {
            alert('รหัส PIN ไม่ถูกต้อง! ไม่สามารถแก้ไขข้อมูลได้ ❌');
        }
    };

    const handleDelete = async (id: number) => {
        const pin = window.prompt('กรุณาใส่รหัสยืนยันเพื่อลบความทรงจำนี้ (หากไม่ทราบกรุณาติดต่อผู้พัฒนา) 🤫');
        if (pin === null) return;
        if (pin !== '1104') {
            alert('รหัส PIN ไม่ถูกต้อง! ไม่สามารถลบได้ ❌');
            return;
        }

        if (!window.confirm('คุณต้องการลบความทรงจำนี้ใช่หรือไม่? 🥺')) return;
        try {
            await api.delete(`/memories/${id}`);
            fetchMemories();
        } catch (error) {
            console.error('Error deleting memory:', error);
        }
    };

    const handleDeleteImage = async (e: React.MouseEvent, imageId: number) => {
        e.stopPropagation(); // Don't trigger lightbox/overview
        const pin = window.prompt('กรุณาใส่รหัสยืนยันเพื่อลบรูปภาพนี้ (หากไม่ทราบกรุณาติดต่อผู้พัฒนา) 🤫');
        if (pin === null) return;
        if (pin !== '1104') {
            alert('รหัส PIN ไม่ถูกต้อง! ไม่สามารถลบได้ ❌');
            return;
        }

        if (!window.confirm('คุณต้องการลบรูปภาพนี้ใช่หรือไม่? 🖼️')) return;
        setIsDeletingImage(imageId);
        try {
            await api.delete(`/memories/images/${imageId}`);

            // UI Update Logic
            if (lightboxData) {
                const updatedImages = lightboxData.images.filter(img => img.id !== imageId);
                if (updatedImages.length === 0) {
                    setLightboxData(null);
                } else {
                    // Stay on current index or move back if it was the last one
                    const newIndex = Math.min(lightboxData.index, updatedImages.length - 1);
                    setLightboxData({ images: updatedImages, index: newIndex });
                }
            }

            if (viewAllMemory) {
                const updatedImages = viewAllMemory.images.filter(img => img.id !== imageId);
                setViewAllMemory({ ...viewAllMemory, images: updatedImages });
            }

            fetchMemories();
        } catch (error) {
            console.error('Error deleting image:', error);
        } finally {
            setIsDeletingImage(null);
        }
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        container.scrollBy({ left: container.clientWidth, behavior: 'smooth' });
    };

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        container.scrollBy({ left: -container.clientWidth, behavior: 'smooth' });
    };

    const handleScroll = () => {
        if (!scrollRef.current || !lightboxData) return;
        const container = scrollRef.current;
        const index = Math.round(container.scrollLeft / container.clientWidth);
        if (index !== lightboxData.index && index >= 0 && index < lightboxData.images.length) {
            setLightboxData({ ...lightboxData, index });
        }
    };

    const handleDownloadImage = async (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `memory-photo-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Error downloading image:', error);
            // Fallback: Open in new tab
            window.open(url, '_blank');
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
            <nav className="glass sticky top-0 z-50 border-b border-pink-300/10 px-3 py-2 sm:px-6 sm:py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 animate-pulse-glow flex-shrink-0">
                            <Heart className="text-white h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" />
                        </div>
                        <div className="flex flex-col hidden sm:block">
                            <h1 className="text-lg sm:text-2xl font-bold romantic-text leading-tight">Memory Keeper</h1>
                            <p className="text-[10px] sm:text-xs text-pink-200/50 hidden xs:block">
                                {username ? `ของ ${username} 💕` : 'เก็บความทรงจำแห่งรัก'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Session Info Section */}
                        {sessionDuration && (
                            <div className="flex items-center gap-2 sm:gap-4">
                                {/* Desktop: Detailed view */}
                                <div className="hidden md:flex flex-col items-end text-xs text-pink-200/60 leading-tight pr-4 border-r border-pink-300/10">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>ออนไลน์มาแล้ว: {sessionDuration}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        <span>หมดอายุล็อคอิน: {expiryTime}</span>
                                    </div>
                                </div>

                                {/* Mobile: Match user's screenshot */}
                                <div className="md:hidden flex flex-col items-end text-[9px] text-pink-200/60 leading-tight">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={11} className="text-pink-300/60" />
                                        <span className="font-medium whitespace-nowrap">ออนไลน์มาแล้ว: {sessionDuration}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Calendar size={11} className="text-pink-300/60" />
                                        <span className="font-medium whitespace-nowrap">หมดอายุล็อคอิน: {expiryTime.split(' ').slice(0, 3).join(' ')}</span>
                                    </div>
                                </div>

                                {/* Vertical Divider (Mobile only, Desktop has its own above) */}
                                <div className="md:hidden h-8 w-[1px] bg-pink-300/10 mx-1" />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {/* Username Pill */}
                            <div className="flex items-center gap-1 text-pink-100 bg-white/5 px-3 py-1.5 rounded-xl border border-pink-300/10 shadow-inner">
                                <span className="text-[11px] sm:text-sm font-bold">🐖 {username}</span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center w-9 h-9 sm:w-auto sm:px-4 sm:py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 sm:text-pink-200/60 sm:hover:text-red-400 transition-all duration-300 border border-red-500/10 sm:border-transparent group"
                                title="ออกจากระบบ"
                            >
                                <LogOut size={18} className="sm:mr-2" />
                                <span className="hidden sm:inline text-sm font-medium">ออกจากระบบ</span>
                            </button>
                        </div>
                    </div>
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
                                {memory.images && memory.images.length > 0 && (
                                    <div className="relative overflow-hidden group/images">
                                        {/* Simple Image Grid for multiple photos */}
                                        <div className={`grid gap-1 ${memory.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                            {memory.images.slice(0, 4).map((img, idx) => (
                                                <div
                                                    key={img.id}
                                                    className={`relative overflow-hidden cursor-zoom-in group/img ${memory.images.length === 3 && idx === 0 ? 'row-span-2' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (memory.images.length > 4 && idx === 3) {
                                                            setViewAllMemory(memory);
                                                        } else {
                                                            setLightboxData({ images: memory.images, index: idx });
                                                        }
                                                    }}
                                                >
                                                    <img
                                                        src={img.url}
                                                        alt={`${memory.title} ${idx}`}
                                                        className="w-full h-full object-cover aspect-square transition-transform duration-700 group-hover/img:scale-110"
                                                    />

                                                    {/* +N Overlay - Explicit JSX for reliability */}
                                                    {memory.images.length > 4 && idx === 3 && (
                                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-[2px] hover:bg-black/40 transition-colors z-10">
                                                            <span className="text-2xl font-black">+{memory.images.length - 4}</span>
                                                            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider opacity-80">รูปภาพ</span>
                                                        </div>
                                                    )}

                                                    {/* Delete single image button - Always visible on mobile, hover on desktop */}
                                                    <button
                                                        onClick={(e) => handleDeleteImage(e, img.id)}
                                                        disabled={isDeletingImage === img.id}
                                                        className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:text-red-400 hover:bg-black/80 backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover/img:opacity-100 transition-all z-20 shadow-lg"
                                                    >
                                                        {isDeletingImage === img.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/images:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover/images:opacity-100 transition duration-300 z-20">
                                            <button
                                                onClick={(e) => handleEditClick(e, memory)}
                                                className="text-white hover:text-pink-400 bg-black/60 p-3.5 rounded-full backdrop-blur-md transition hover:bg-pink-500/20 shadow-xl border border-white/10"
                                                title="แก้ไขความทรงจำ"
                                            >
                                                <Pencil className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(memory.id)}
                                                className="text-white hover:text-red-400 bg-black/60 p-3.5 rounded-full backdrop-blur-md transition hover:bg-red-500/20 shadow-xl border border-white/10"
                                                title="ลบความทรงจำ"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <div className="absolute top-4 left-4 opacity-0 group-hover/images:opacity-100 transition-opacity z-10">
                                            <Heart className="h-6 w-6 text-pink-400 drop-shadow-lg" fill="currentColor" />
                                        </div>
                                    </div>
                                )}
                                <div className="p-6 cursor-pointer" onClick={() => setViewAllMemory(memory)}>
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
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(e, memory); }}
                                                className="text-pink-300/40 hover:text-pink-400 p-2 rounded-full transition hover:bg-white/5"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(memory.id); }}
                                                className="text-pink-300/40 hover:text-red-400 p-2 rounded-full transition hover:bg-white/5"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
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
                    <div className="glass w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-8 relative z-10 border border-pink-300/20 no-scrollbar">
                        <button
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditMemory(null);
                                setNewTitle('');
                                setNewNote('');
                                setImageFiles([]);
                                setImagePreviews([]);
                                setIsDetailsUnlocked(false);
                            }}
                            className="absolute top-4 right-4 text-pink-200/40 hover:text-white transition-colors p-2"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 romantic-text">
                            {editMemory ? <Pencil className="h-6 w-6 text-pink-400" /> : <Heart className="h-6 w-6 text-pink-400" fill="currentColor" />}
                            {editMemory ? 'แก้ไขความทรงจำ' : 'เพิ่มความทรงจำใหม่'}
                        </h3>

                        <form onSubmit={handleAddMemory} className="space-y-6">
                            <div className="space-y-2 relative group">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-medium text-pink-200/80">💕 ชื่อความทรงจำ</label>
                                    {editMemory && !isDetailsUnlocked && (
                                        <button
                                            type="button"
                                            onClick={handleUnlockDetails}
                                            className="text-[10px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 bg-pink-500/10 px-2 py-1 rounded-full transition-colors"
                                        >
                                            <LockIcon className="h-2.5 w-2.5" />
                                            แก้ไข
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="ตั้งชื่อให้ช่วงเวลานี้..."
                                        className={`glass-input w-full px-4 py-4 transition-all ${editMemory && !isDetailsUnlocked ? 'opacity-40 cursor-pointer hover:bg-white/5' : ''}`}
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        onClick={() => { if (editMemory && !isDetailsUnlocked) handleUnlockDetails(); }}
                                        readOnly={editMemory !== null && !isDetailsUnlocked}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 relative group">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-medium text-pink-200/80">💭 บันทึกความรู้สึก</label>
                                    {editMemory && !isDetailsUnlocked && (
                                        <button
                                            type="button"
                                            onClick={handleUnlockDetails}
                                            className="text-[10px] font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 bg-pink-500/10 px-2 py-1 rounded-full transition-colors"
                                        >
                                            <LockIcon className="h-2.5 w-2.5" />
                                            แก้ไข
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    placeholder="เขียนบรรยายความรู้สึกดีๆ..."
                                    className={`glass-input w-full px-4 py-4 min-h-[120px] resize-none transition-all ${editMemory && !isDetailsUnlocked ? 'opacity-40 cursor-pointer hover:bg-white/5' : ''}`}
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onClick={() => { if (editMemory && !isDetailsUnlocked) handleUnlockDetails(); }}
                                    readOnly={editMemory !== null && !isDetailsUnlocked}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-pink-200/80 ml-1 flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4" />
                                            เลือกรูปภาพ
                                        </label>
                                        <div className="relative border-2 border-dashed border-pink-300/20 rounded-2xl p-4 transition-colors hover:border-pink-500/50 hover:bg-white/5 text-center cursor-pointer group flex items-center justify-center overflow-hidden h-24">
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                multiple
                                            />
                                            <div className="flex flex-col items-center gap-1 text-pink-200/40 group-hover:text-pink-300 transition-colors">
                                                <ImageIcon className="h-5 w-5" />
                                                <span className="text-[10px] font-medium">คลังภาพ/ไฟล์</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-pink-200/80 ml-1 flex items-center gap-2">
                                            <Camera className="h-4 w-4" />
                                            ถ่ายรูปใหม่
                                        </label>
                                        <div className="relative border-2 border-dashed border-pink-300/20 rounded-2xl p-4 transition-colors hover:border-pink-500/50 hover:bg-white/5 text-center cursor-pointer group flex items-center justify-center overflow-hidden h-24">
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                capture="environment"
                                            />
                                            <div className="flex flex-col items-center gap-1 text-pink-200/40 group-hover:text-pink-300 transition-colors">
                                                <Camera className="h-5 w-5" />
                                                <span className="text-[10px] font-medium">เปิดกล้อง</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {imagePreviews.length > 0 && (
                                    <div className="w-full flex flex-col items-center bg-white/5 p-4 rounded-2xl border border-pink-300/10 mb-4">
                                        <div className="grid grid-cols-3 gap-2 w-full max-h-48 overflow-y-auto p-1">
                                            {imagePreviews.map((prev, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative aspect-square group/preview cursor-zoom-in"
                                                    onClick={() => setLightboxData({
                                                        images: imagePreviews.map((url, i) => ({ id: i, url })),
                                                        index: idx
                                                    })}
                                                >
                                                    <img
                                                        src={prev}
                                                        alt={`Preview ${idx} `}
                                                        className="w-full h-full object-cover rounded-lg border border-pink-300/20"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleRemoveSelectedImage(idx);
                                                        }}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-100 sm:opacity-0 sm:group-hover/preview:opacity-100 transition-opacity z-30"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-2 text-pink-200 font-medium text-xs">
                                            เลือกแล้ว {imageFiles.length} รูป
                                        </div>
                                    </div>
                                )}
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
                                        {editMemory ? <Sparkles className="h-5 w-5" /> : <Heart className="h-5 w-5" fill="currentColor" />}
                                        {editMemory ? 'อัปเดตความทรงจำ' : 'บันทึกความทรงจำ'}
                                        <Heart className="h-4 w-4" fill="currentColor" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Overview / View All Modal */}
            {viewAllMemory && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 animate-fade-in">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setViewAllMemory(null)}
                    />
                    <div className="glass w-full max-w-4xl max-h-[85vh] rounded-3xl p-6 md:p-8 relative z-10 border border-pink-300/20 flex flex-col animate-scale-up">
                        <button
                            onClick={() => setViewAllMemory(null)}
                            className="absolute top-4 right-4 text-pink-200/40 hover:text-white transition-colors p-2 z-20"
                        >
                            <X className="h-8 w-8" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                                <ImageIcon className="text-white h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-pink-100 romantic-text">{viewAllMemory.title}</h3>
                                <p className="text-pink-200/50 text-sm">รูปความทรงจำทั้งหมด ({viewAllMemory.images.length}) ✨</p>
                            </div>
                        </div>

                        {viewAllMemory.note && (
                            <p className="text-pink-200/70 text-sm mb-6 bg-white/5 p-4 rounded-2xl border border-pink-300/5 italic">
                                "{viewAllMemory.note}"
                            </p>
                        )}

                        <div className="flex-1 overflow-y-auto pr-2 flex flex-wrap justify-center gap-y-2 gap-x-0 pb-16 no-scrollbar min-h-0 pt-8 px-4">
                            {viewAllMemory.images.map((img, idx) => (
                                <div
                                    key={img.id}
                                    className="relative cursor-zoom-in rounded-xl overflow-hidden aspect-[4/5] w-32 sm:w-40 md:w-48 border-4 border-white shadow-2xl bg-black/20 transition-all hover:z-50 hover:scale-110 active:scale-95 group/photo"
                                    style={{
                                        transform: `rotate(${((idx % 5) - 2) * 5}deg) translateY(${idx % 2 === 0 ? '-10px' : '10px'})`,
                                        marginLeft: idx > 0 ? (window.innerWidth < 640 ? '-40px' : '-60px') : '0',
                                        zIndex: idx,
                                    }}
                                    onClick={() => setLightboxData({ images: viewAllMemory.images, index: idx })}
                                >
                                    <div className="absolute inset-0 bg-black/5 group-hover/photo:opacity-0 transition-opacity" />
                                    <img
                                        src={img.url}
                                        alt={`Overview ${idx} `}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-center text-xs text-pink-200/30">
                            คลิกที่รูปเพื่อดูขนาดเต็ม • ปัดเลื่อนในโหมดเต็มหน้าจอได้
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox / Full Screen View with Slider */}
            {lightboxData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in group/lightbox">
                    <div
                        className="absolute inset-0 bg-black/95 backdrop-blur-2xl cursor-zoom-out"
                        onClick={() => setLightboxData(null)}
                    />

                    {/* Controls */}
                    <div className="absolute top-6 right-6 flex items-center gap-4 z-[110]">
                        <button
                            onClick={(e) => handleDeleteImage(e, lightboxData.images[lightboxData.index].id)}
                            disabled={isDeletingImage === lightboxData.images[lightboxData.index].id}
                            className="bg-white/10 hover:bg-red-500/80 text-white p-3 rounded-full backdrop-blur-md transition-all flex items-center gap-2"
                            title="ลบรูปภาพนี้"
                        >
                            {isDeletingImage === lightboxData.images[lightboxData.index].id ? <Loader2 className="h-6 w-6 animate-spin" /> : <Trash2 className="h-6 w-6" />}
                        </button>
                        <button
                            onClick={(e) => handleDownloadImage(e, lightboxData.images[lightboxData.index].url)}
                            className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all flex items-center gap-2"
                            title="ดาวน์โหลดรูปภาพ"
                        >
                            <Download className="h-6 w-6" />
                            <span className="hidden sm:inline text-sm font-medium">ดาวน์โหลด</span>
                        </button>
                        <button
                            onClick={() => setLightboxData(null)}
                            className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation Arrows - Desktop Only and Hidden if overlapping */}
                    {lightboxData.images.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevImage}
                                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-md transition-all z-[110] hidden md:flex items-center justify-center group-hover/lightbox:translate-x-0 -translate-x-12 opacity-0 group-hover/lightbox:opacity-100"
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </button>
                            <button
                                onClick={handleNextImage}
                                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-md transition-all z-[110] hidden md:flex items-center justify-center group-hover/lightbox:translate-x-0 translate-x-12 opacity-0 group-hover/lightbox:opacity-100"
                            >
                                <ChevronRight className="h-8 w-8" />
                            </button>
                        </>
                    )}

                    {/* Main Image Container with Swiping (Scroll Snap) */}
                    <div className="relative w-full h-full flex flex-col items-center justify-center z-10 select-none overflow-hidden mt-10 md:mt-0">
                        <div
                            ref={scrollRef}
                            onScroll={handleScroll}
                            className="w-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
                        >
                            {lightboxData.images.map((img, i) => (
                                <div key={i} className="flex-none w-full h-full flex items-center justify-center snap-center p-4">
                                    <img
                                        src={img.url}
                                        alt={`Memories View ${i} `}
                                        className="max-w-full max-h-[70vh] md:max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Image Counter & Indicator */}
                        <div className="flex flex-col items-center gap-2 mt-4">
                            <span className="text-white/60 text-sm font-medium">
                                รูปที่ {lightboxData.index + 1} จาก {lightboxData.images.length}
                            </span>
                            {lightboxData.images.length > 1 && (
                                <div className="flex gap-1.5">
                                    {lightboxData.images.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${i === lightboxData.index ? 'bg-pink-500 w-6' : 'bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
