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
    User,
    Lock as LockIcon,
    Eye,
    EyeOff,
    Search,
    Bell,
    StickyNote
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

// Helper component for highlighting search query matches
const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    // Split on highlight term and include term in result array
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span className="inline">
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-pink-500 text-white rounded-[4px] px-1 py-[2px] shadow-[0_0_8px_rgba(236,72,153,0.6)]">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

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
    const [avatarUrl, setAvatarUrl] = useState('');
    const [partnerName, setPartnerName] = useState('');
    const [anniversary, setAnniversary] = useState('');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [pendingNotification, setPendingNotification] = useState('');
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
            const data = response.data;
            setUsername(data.username);
            setAvatarUrl(data.avatar_url || '');
            setPartnerName(data.partner_name || '');
            setAnniversary(data.anniversary || '');
            if (data.notification_message) {
                setNotificationMessage(data.notification_message);
                setIsNotificationPopupOpen(true);
            }
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

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsSubmittingProfile(true);
            const formData = new FormData();
            formData.append('images', file);

            // Re-using the memory image upload logic for now (Cloudinary)
            const uploadResponse = await api.post('memories/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (uploadResponse.data.urls && uploadResponse.data.urls.length > 0) {
                setAvatarUrl(uploadResponse.data.urls[0]);
            }
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            const errorMsg = error.response?.data?.detail || 'อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่ครับ';
            alert(`เกิดข้อผิดพลาด: ${errorMsg}`);
        } finally {
            setIsSubmittingProfile(false);
        }
    };

    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Password change security check is now handled via prompt on edit button click
        if (newPassword && newPassword !== confirmPassword) {
            alert("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกันครับ");
            return;
        }

        setIsSubmittingProfile(true);
        try {
            const updateData: any = {
                avatar_url: avatarUrl,
                partner_name: partnerName,
                anniversary: anniversary,
            };

            if (newPassword) {
                updateData.password = newPassword;
            }

            await api.put('me', updateData);
            alert('อัปเดตโปรไฟล์เรียบร้อยแล้วครับ 💕');
            setIsProfileModalOpen(false);
            setIsEditingPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setNewPassword('');
            setConfirmPassword('');
            fetchUserProfile();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const errorMsg = error.response?.data?.detail || 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์';
            alert(errorMsg);
        } finally {
            setIsSubmittingProfile(false);
        }
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

    const handleUpdateNotification = () => {
        setPendingNotification(notificationMessage);
        setIsNotificationModalOpen(true);
    };

    const handleSaveNotification = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await api.put('/me', { notification_message: pendingNotification });
            setNotificationMessage(pendingNotification);
            setIsNotificationPopupOpen(!!pendingNotification);
            setIsNotificationModalOpen(false);
        } catch (error) {
            console.error('Error updating notification:', error);
            alert('ไม่สามารถอัปเดตข้อความประกาศได้');
        } finally {
            setSubmitting(false);
        }
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

    const filteredMemories = memories.filter(memory =>
        (memory.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (memory.note || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

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
                                        <span className="font-medium whitespace-nowrap">หมดอายุ: {expiryTime.split(' ').slice(0, 3).join(' ')}</span>
                                    </div>
                                </div>

                                {/* Vertical Divider (Mobile only, Desktop has its own above) */}
                                <div className="md:hidden h-8 w-[1px] bg-pink-300/10 mx-1" />
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsProfileModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-pink-300/10 transition-all active:scale-95 group"
                            >
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-pink-400/50 flex items-center justify-center bg-pink-500/10">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs">🐖</span>
                                    )}
                                </div>
                                <span className="text-[11px] sm:text-sm font-bold text-pink-100">{username}</span>
                            </button>

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

                {/* Full-Screen Announcement Popup */}
                {isNotificationPopupOpen && notificationMessage && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-fade-in">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                        <div className="relative w-full max-w-2xl animate-scale-up">
                            {/* Decorative Elements */}
                            <div className="absolute -top-12 -left-12 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
                            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
                            
                            <div className="glass rounded-[2rem] border-2 border-pink-400/30 overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.3)]">
                                <div className="p-8 md:p-12 flex flex-col items-center text-center space-y-8">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/50 animate-bounce-subtle">
                                        <Bell className="h-10 w-10 text-white" />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h2 className="text-pink-300 text-sm font-bold uppercase tracking-[0.2em]">ประกาศศ ศสาลา 10 ตัว ❤️</h2>
                                        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                                            <p className="text-2xl md:text-4xl font-bold text-white romantic-text leading-relaxed whitespace-pre-line">
                                                <HighlightText text={notificationMessage} highlight={searchQuery} />
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsNotificationPopupOpen(false)}
                                        className="glass-button w-full sm:w-auto px-12 py-5 rounded-2xl text-xl font-bold transition-all active:scale-95 group relative overflow-hidden bg-gradient-to-r from-pink-500 to-rose-600 text-white border-none"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            รับทราบ 💕
                                            <Heart className="h-6 w-6 fill-white group-hover:scale-125 transition-transform" />
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Section */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-4xl font-bold romantic-text mb-3 flex items-center gap-3">
                            <Sparkles className="h-8 w-8 text-pink-400" />
                            ความทรงจำของเรา
                        </h2>
                        <p className="text-pink-200/60">รวบรวมช่วงเวลาแห่งความรัก ({memories.length} ความทรงจำ) 💕</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleUpdateNotification}
                            className="glass-button p-4 rounded-2xl font-medium flex items-center justify-center gap-2 group border-dashed hover:border-solid border-pink-300/30"
                            title={notificationMessage ? "แก้ไขประกาศ" : "ตั้งข้อความประกาศ"}
                        >
                            <Bell className={`h-5 w-5 ${notificationMessage ? 'text-pink-400' : 'text-pink-400/70'} group-hover:text-pink-300 transition-colors`} />
                            <span className="hidden lg:inline text-pink-200/70 group-hover:text-pink-200 transition-colors">
                                {notificationMessage ? "แก้ไขประกาศ" : "ตั้งประกาศ"}
                            </span>
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="glass-button px-6 py-4 rounded-2xl font-medium flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="hidden sm:inline">เพิ่มความทรงจำ</span>
                            <Heart className="h-4 w-4" fill="currentColor" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                {memories.length > 0 && (
                    <div className="mb-8 relative max-w-2xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-300/50 w-5 h-5 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="ค้นหาความทรงจำ หรือความรู้สึกที่บันทึกไว้..."
                            className="glass-input w-full pl-14 pr-4 py-4 rounded-2xl text-pink-100 placeholder:text-pink-200/40 text-lg shadow-inner focus:shadow-pink-400/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}

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
                ) : filteredMemories.length === 0 ? (
                    <div className="glass rounded-3xl p-16 text-center animate-fade-in">
                        <Search className="h-20 w-20 text-pink-400/30 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-pink-200/80 mb-3">ไม่พบความทรงจำ</h3>
                        <p className="text-pink-200/50">ลองค้นหาด้วยคำอื่นดูนะครับ</p>
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {filteredMemories.map((memory) => (
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
                                        <HighlightText text={memory.title} highlight={searchQuery} />
                                    </h3>
                                    {memory.note && (
                                        <p className="text-pink-200/60 text-sm leading-relaxed mb-4">
                                            <HighlightText text={memory.note} highlight={searchQuery} />
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
                                <h3 className="text-2xl font-bold text-pink-100 romantic-text">
                                    <HighlightText text={viewAllMemory.title} highlight={searchQuery} />
                                </h3>
                                <p className="text-pink-200/50 text-sm">รูปความทรงจำทั้งหมด ({viewAllMemory.images.length}) ✨</p>
                            </div>
                        </div>

                        {viewAllMemory.note && (
                            <p className="text-pink-200/70 text-sm mb-6 bg-white/5 p-4 rounded-2xl border border-pink-300/5 italic">
                                "<HighlightText text={viewAllMemory.note} highlight={searchQuery} />"
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
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 animate-fade-in group/lightbox">
                    <div
                        className="absolute inset-0 bg-black/95 backdrop-blur-2xl cursor-zoom-out"
                        onClick={() => setLightboxData(null)}
                    />

                    {/* Controls */}
                    <div className="absolute top-6 right-6 flex items-center gap-4 z-[130]">
                        {lightboxData.images[lightboxData.index].id >= 0 && (
                            <button
                                onClick={(e) => handleDeleteImage(e, lightboxData.images[lightboxData.index].id)}
                                disabled={isDeletingImage === lightboxData.images[lightboxData.index].id}
                                className="bg-white/10 hover:bg-red-500/80 text-white p-3 rounded-full backdrop-blur-md transition-all flex items-center gap-2"
                                title="ลบรูปภาพนี้"
                            >
                                {isDeletingImage === lightboxData.images[lightboxData.index].id ? <Loader2 className="h-6 w-6 animate-spin" /> : <Trash2 className="h-6 w-6" />}
                            </button>
                        )}
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

            {/* Profile Edit Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass rounded-3xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-pink-500/20 to-rose-500/20">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <User className="h-5 w-5 text-pink-400" />
                                แก้ไขโปรไฟล์
                            </h3>
                            <button
                                onClick={() => {
                                    setIsProfileModalOpen(false);
                                    setIsEditingPassword(false);
                                    setShowNewPassword(false);
                                    setShowConfirmPassword(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            {/* Avatar Upload */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <div
                                        className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500/30 shadow-2xl bg-pink-500/10 flex items-center justify-center cursor-zoom-in"
                                        onClick={() => {
                                            if (avatarUrl) {
                                                setLightboxData({ images: [{ id: -1, url: avatarUrl }], index: 0 });
                                            }
                                        }}
                                    >
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={40} className="text-pink-300/50" />
                                        )}
                                        {isSubmittingProfile && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 p-2 bg-pink-500 hover:bg-pink-600 rounded-full text-white cursor-pointer shadow-lg transition-all transform hover:scale-110">
                                        <Camera size={16} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isSubmittingProfile} />
                                    </label>
                                </div>
                                <p className="text-xs text-pink-200/50">คลิกเพื่ออัปโหลดรูปโปรไฟล์</p>
                            </div>

                            {/* Partner Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-pink-200/80 flex items-center gap-2 ml-1">
                                    <Heart size={14} className="text-pink-400" />
                                    ชื่อคนพิเศษ (Partner)
                                </label>
                                <input
                                    type="text"
                                    placeholder="ระบุชื่อคนพิเศษของคุณ"
                                    className="glass-input w-full px-4 py-3"
                                    value={partnerName}
                                    onChange={(e) => setPartnerName(e.target.value)}
                                />
                            </div>

                            {/* Anniversary Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-pink-200/80 flex items-center gap-2 ml-1">
                                    <Calendar size={14} className="text-pink-400" />
                                    วันครบรอบของเรา
                                </label>
                                <input
                                    type="date"
                                    className="glass-input w-full px-4 py-3"
                                    value={anniversary}
                                    onChange={(e) => setAnniversary(e.target.value)}
                                />
                            </div>

                            {/* Change Password */}
                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between pb-2">
                                    <label className="text-sm font-medium text-pink-200/80 flex items-center gap-2 ml-1">
                                        <LockIcon size={14} className="text-pink-400" />
                                        เปลี่ยนรหัสผ่าน
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!isEditingPassword) {
                                                const code = window.prompt("กรุณาติดต่อผู้พัฒนาระบบเพื่อขอรหัสโค๊ดเปลี่ยนรหัสผ่าน");
                                                if (code !== username) {
                                                    if (code !== null) alert("รหัสโค๊ดยืนยันไม่ถูกต้อง");
                                                    return;
                                                }
                                            }
                                            setIsEditingPassword(!isEditingPassword);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-bold rounded-xl transition-colors"
                                    >
                                        <LockIcon size={12} />
                                        {isEditingPassword ? 'ยกเลิก' : 'แก้ไข'}
                                    </button>
                                </div>

                                {isEditingPassword && (
                                    <div className="space-y-4 mt-2 p-4 bg-black/20 rounded-2xl border border-pink-500/10 animate-fade-in relative">
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                placeholder="รหัสผ่านใหม่"
                                                className="glass-input w-full px-4 py-3 pr-12"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-300/50 hover:text-pink-300 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="ยืนยันรหัสผ่านใหม่"
                                                className="glass-input w-full px-4 py-3 pr-12"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-300/50 hover:text-pink-300 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmittingProfile}
                                className="glass-button w-full py-4 rounded-2xl font-bold text-lg shadow-xl shadow-pink-500/20 disabled:opacity-50"
                            >
                                {isSubmittingProfile ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>กำลังบันทึก...</span>
                                    </div>
                                ) : (
                                    "บันทึกการเปลี่ยนแปลง 💕"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Action Button (FAB) for adding memory */}
            {!isModalOpen && !lightboxData && !viewAllMemory && (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="fixed bottom-8 right-8 z-[50] flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 shadow-2xl shadow-pink-500/50 hover:scale-110 active:scale-95 transition-all duration-300 group ring-4 ring-white/10"
                    title="เพิ่มความทรงจำใหม่"
                >
                    <div className="relative">
                        <Plus className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-500" />
                        <Heart className="absolute -top-1 -right-1 h-3 w-3 text-white animate-pulse" fill="currentColor" />
                    </div>
                    <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-3 text-white font-bold transition-all duration-500 text-sm">
                        เพิ่มความทรงจำ
                    </span>
                </button>
            )}

            {/* Notification Notepad Modal */}
            {isNotificationModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 animate-fade-in">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        onClick={() => !submitting && setIsNotificationModalOpen(false)} 
                    />
                    <div className="glass w-full max-w-lg rounded-3xl overflow-hidden relative z-10 border border-pink-300/20 shadow-2xl animate-scale-up">
                        <div className="p-6 border-b border-pink-300/10 flex justify-between items-center bg-pink-500/5">
                            <h3 className="text-xl font-bold text-pink-100 flex items-center gap-2">
                                <StickyNote className="h-5 w-5 text-pink-400" />
                                สมุดโน้ตประกาศจดบันทึก 📔
                            </h3>
                            <button 
                                onClick={() => setIsNotificationModalOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all"
                                disabled={submitting}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="relative">
                                {/* Notepad background effect */}
                                <div className="absolute inset-0 bg-yellow-50/[0.02] rounded-2xl pointer-events-none border border-white/5"></div>
                                <textarea
                                    placeholder="เขียนข้อความรัก หรือประกาศที่อยากให้แสดง..."
                                    className="w-full h-64 p-6 glass-input rounded-2xl bg-white/5 border-pink-300/10 text-pink-100 placeholder:text-pink-200/30 resize-none focus:ring-2 focus:ring-pink-500/30 transition-all leading-relaxed custom-scrollbar"
                                    value={pendingNotification}
                                    onChange={(e) => setPendingNotification(e.target.value)}
                                    autoFocus
                                    disabled={submitting}
                                />
                                <div className="absolute bottom-4 right-4 text-[10px] text-pink-200/30 uppercase tracking-widest font-bold">
                                     บันทึกกันลืม ตอนหมู 🐷
                                </div>
                            </div>

                            <button
                                onClick={handleSaveNotification}
                                disabled={submitting}
                                className="glass-button w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group relative overflow-hidden active:scale-95 transition-all bg-gradient-to-r from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30 shadow-lg shadow-pink-500/10"
                            >
                                {submitting ? (
                                    <Loader2 className="animate-spin h-6 w-6" />
                                ) : (
                                    <>
                                        <Heart className={`h-5 w-5 ${pendingNotification ? 'fill-pink-500 text-pink-500' : ''}`} />
                                        บันทึกกันลืม
                                        <Heart className="h-4 w-4" fill="currentColor" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
