import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                const response = await api.post('/token', formData);
                localStorage.setItem('token', response.data.access_token);
                navigate('/dashboard');
            } else {
                await api.post('/register', { username, password });
                setIsLogin(true);
                alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
            }
        } catch (err) {
            setError('การยืนยันตัวตนล้มเหลว กรุณาตรวจสอบข้อมูลของคุณ');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-blue-100 select-none">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50">
                <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6 drop-shadow-sm">
                    {isLogin ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}
                </h2>
                {error && <p className="text-red-500 text-center mb-4 text-sm font-medium bg-red-50 p-2 rounded">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-600 font-semibold mb-2 ml-1">ชื่อผู้ใช้</label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all outline-none shadow-sm"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-600 font-semibold mb-2 ml-1">รหัสผ่าน</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all outline-none shadow-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-3 rounded-lg hover:from-pink-600 hover:to-rose-600 transform hover:scale-[1.02] transition-all shadow-lg hover:shadow-pink-500/30 font-sans"
                    >
                        {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                    </button>
                </form>
                <p className="mt-6 text-center text-gray-500">
                    {isLogin ? "ยังไม่มีบัญชีใช่ไหม? " : "มีบัญชีอยู่แล้ว? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-pink-600 hover:text-pink-700 font-bold hover:underline transition-colors"
                    >
                        {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;
