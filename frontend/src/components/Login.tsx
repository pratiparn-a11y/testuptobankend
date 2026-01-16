import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Heart, User, Lock, Loader2, Sparkles } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const formData = new URLSearchParams();
                formData.append('username', username);
                formData.append('password', password);
                const response = await api.post('/token', formData, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                });
                localStorage.setItem('token', response.data.access_token);
                navigate('/dashboard');
            } else {
                await api.post('/register', { username, password });
                setIsLogin(true);
                setError('');
                alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ 💕');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Floating Hearts Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <Heart
                        key={i}
                        className="absolute text-pink-500/20 animate-float-heart"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            fontSize: `${Math.random() * 30 + 20}px`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${Math.random() * 2 + 3}s`,
                        }}
                        size={Math.random() * 40 + 20}
                    />
                ))}
            </div>

            {/* Main Card */}
            <div className="glass rounded-3xl p-10 w-full max-w-md relative z-10 animate-pulse-glow">
                {/* Logo & Title */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 mb-6 shadow-2xl shadow-pink-500/50">
                        <Heart className="h-10 w-10 text-white heart-glow" fill="currentColor" />
                    </div>
                    <h1 className="text-3xl font-bold romantic-text mb-2">
                        Memory Keeper
                    </h1>
                    <p className="text-pink-200/70 text-sm flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        เก็บความทรงจำแห่งรัก
                        <Sparkles className="h-4 w-4" />
                    </p>
                </div>

                {/* Toggle Buttons */}
                <div className="flex mb-8 bg-white/5 rounded-2xl p-1">
                    <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${isLogin
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                                : 'text-pink-200/60 hover:text-pink-200'
                            }`}
                    >
                        💕 เข้าสู่ระบบ
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${!isLogin
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                                : 'text-pink-200/60 hover:text-pink-200'
                            }`}
                    >
                        💖 สมัครสมาชิก
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-300/50" />
                        <input
                            type="text"
                            placeholder="ชื่อผู้ใช้"
                            className="glass-input w-full pl-12 pr-4 py-4"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-300/50" />
                        <input
                            type="password"
                            placeholder="รหัสผ่าน"
                            className="glass-input w-full pl-12 pr-4 py-4"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="glass-button w-full py-4 rounded-xl text-lg flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-6 w-6" />
                        ) : (
                            <>
                                <Heart className="h-5 w-5" fill="currentColor" />
                                {isLogin ? 'เข้าสู่โลกแห่งความทรงจำ' : 'เริ่มต้นเก็บความทรงจำ'}
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-pink-200/40 text-xs mt-8">
                    Made with 💕 for your precious memories
                </p>
            </div>
        </div>
    );
};

export default Login;
