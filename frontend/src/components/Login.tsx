import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                await api.post('/register', { username, password });
                setIsRegistering(false);
                setError('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ (Registration successful! Please login)');
            } else {
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                const response = await api.post('/token', formData);
                localStorage.setItem('token', response.data.access_token);
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง (An error occurred)');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background blobs for premium feel */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div className="glass w-full max-w-md p-8 rounded-2xl relative z-10 animate-fade-in">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent drop-shadow-sm">
                        {isRegistering ? 'สร้างบัญชีใหม่' : 'ยินดีต้อนรับ'}
                    </h2>
                    <p className="text-gray-300 font-light text-sm tracking-wide">
                        {isRegistering ? 'เริ่มต้นเก็บความทรงจำของคุณวันนี้' : 'เข้าสู่ระบบเพื่อดูความทรงจำของคุณ'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center justify-center gap-2 backdrop-blur-md animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors duration-300" />
                        <input
                            type="text"
                            placeholder="ชื่อผู้ใช้งาน"
                            className="glass-input w-full pl-12 pr-4 py-3.5 rounded-xl text-base"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors duration-300" />
                        <input
                            type="password"
                            placeholder="รหัสผ่าน"
                            className="glass-input w-full pl-12 pr-4 py-3.5 rounded-xl text-base"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="glass-button w-full py-3.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 mt-8 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <span className="relative z-10">{isRegistering ? 'ลงทะเบียน' : 'เข้าสู่ระบบ'}</span>
                                <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform relative z-10" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                        }}
                        className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
                    >
                        {isRegistering ? 'มีบัญชีอยู่แล้ว? ' : 'ยังไม่มีบัญชี? '}
                        <span className="text-purple-300 font-medium hover:underline decoration-purple-300/50 underline-offset-4">
                            {isRegistering ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกเลย'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
