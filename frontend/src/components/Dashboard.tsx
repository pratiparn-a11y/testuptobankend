import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Memory {
    id: number;
    title: string;
    note: string;
    image_url: string;
    created_at: string;
}

const Dashboard: React.FC = () => {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMemories();
    }, []);

    const fetchMemories = async () => {
        try {
            const response = await api.get('/memories/');
            setMemories(response.data);
        } catch (err) {
            console.error(err);
            navigate('/');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleAddMemory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/memories/', { title, note, image_url: imageUrl });
            setShowModal(false);
            setTitle('');
            setNote('');
            setImageUrl('');
            fetchMemories();
        } catch (err) {
            console.error(err);
            alert('ไม่สามารถเพิ่มความทรงจำได้');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500">สมุดบันทึกความทรงจำ</h1>
                        <button
                            onClick={handleLogout}
                            className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
                        >
                            ออกจากระบบ
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">ช่วงเวลาของเรา</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-full font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                    >
                        + เพิ่มความทรงจำ
                    </button>
                </div>

                {memories.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-gray-400 text-lg">ยังไม่มีความทรงจำ เริ่มบันทึกช่วงเวลาดีๆ ของเรากันเถอะ!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {memories.map((memory) => (
                            <div key={memory.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 group">
                                {memory.image_url && (
                                    <div className="h-48 overflow-hidden">
                                        <img src={memory.image_url} alt={memory.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}
                                <div className="p-6">
                                    <h3 className="font-bold text-xl text-gray-800 mb-2">{memory.title}</h3>
                                    <p className="text-gray-600 leading-relaxed text-sm mb-4">{memory.note}</p>
                                    <p className="text-xs text-gray-400 font-medium">{new Date(memory.created_at).toLocaleDateString('th-TH')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all scale-100">
                        <h3 className="text-2xl font-bold mb-6 text-gray-800">เพิ่มความทรงจำใหม่</h3>
                        <form onSubmit={handleAddMemory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">หัวข้อ</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="เช่น วันครบรอบของเรา"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">บันทึกข้อความ</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="เขียนอะไรหวานๆ หน่อยสิ..."
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">ลิ้งค์รูปภาพ</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/30"
                                >
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
