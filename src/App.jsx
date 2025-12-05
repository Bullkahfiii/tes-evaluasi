import React, { useState, useEffect } from 'react';
import { Clock, LogOut, CheckCircle, BookOpen, User, Settings, Plus, Trash2, AlertCircle, X } from 'lucide-react';

// Konfigurasi Google Apps Script Web App URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz4SMZi4IQwExT7V5dY4cGBrcFizwNUvMe8dtxU45bZAu486h-rTsm02Y-4_UZzX06t/exec';

// Add CSS for animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;

// Custom Alert Component
function CustomAlert({ show, onClose, title, message, type = 'info' }) {
  if (!show) return null;

  const colors = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800'
  };

  const icons = {
    success: <CheckCircle className="w-6 h-6 text-green-600" />,
    error: <AlertCircle className="w-6 h-6 text-red-600" />,
    warning: <AlertCircle className="w-6 h-6 text-yellow-600" />,
    info: <AlertCircle className="w-6 h-6 text-blue-600" />
  };

  return (
    <>
      <style>{styles}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
        <div className={`bg-white rounded-lg shadow-2xl max-w-md w-full border-l-4 ${colors[type]} animate-slideUp`}>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {icons[type]}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-700 whitespace-pre-line">{message}</p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Loading Spinner Component
function LoadingSpinner({ fullScreen = false, message = 'Memuat...' }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent mb-4"></div>
          <p className="text-gray-700 font-semibold">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mb-3"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default function OnlineExamApp() {
  const [page, setPage] = useState('login');
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [exams, setExams] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examResult, setExamResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, title: '', message: '', type: 'info' });

  // Custom alert function
  const showAlert = (title, message, type = 'info') => {
    setAlert({ show: true, title, message, type });
  };

  const closeAlert = () => {
    setAlert({ show: false, title: '', message: '', type: 'info' });
  };

  // Timer untuk ujian
  useEffect(() => {
    if (page === 'exam' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [page, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (phone) => {
    setLoading(true);
    try {
      const response = await fetch(`${SCRIPT_URL}?action=login&phone=${phone}`);
      const data = await response.json();
      
      if (data.success) {
        setUserData(data.user);
        setUserType('student');
        setPage('exam-list');
        await loadExams();
      } else {
        showAlert('Login Gagal', 'Nomor WhatsApp tidak terdaftar!\n\nPastikan nomor yang Anda masukkan sudah terdaftar di sistem.', 'error');
      }
    } catch (error) {
      showAlert('Kesalahan Koneksi', 'Gagal terhubung ke server.\n\nPastikan URL Script sudah diisi dengan benar dan koneksi internet Anda stabil.', 'error');
    }
    setLoading(false);
  };

  const handleAdminLogin = (username) => {
    if (username === 'NEU339') {
      setUserType('admin');
      setPage('admin-dashboard');
      loadExams();
    } else {
      showAlert('Login Gagal', 'Username admin salah!\n\nSilakan coba lagi.', 'error');
    }
  };

  const loadExams = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getExams`);
      const data = await response.json();
      setExams(data.exams || []);
    } catch (error) {
      console.error('Gagal memuat ujian:', error);
    }
    setLoading(false);
  };

  const handleStartExam = async (exam) => {
    // Cek apakah siswa sudah pernah mengerjakan ujian ini
    if (!userData || !userData.whatsapp) {
      showAlert('Error', 'Data user tidak valid', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SCRIPT_URL}?action=checkExamStatus&examName=${encodeURIComponent(exam.name)}&phone=${encodeURIComponent(userData.whatsapp)}`);
      const data = await response.json();
      
      if (data.completed) {
        showAlert(
          'Ujian Sudah Dikerjakan', 
          `Anda sudah mengerjakan tes "${exam.name}"\n\nNilai Anda: ${data.score}\n\nSetiap tes hanya bisa dikerjakan satu kali.`,
          'warning'
        );
        setLoading(false);
        return;
      }
      
      // Jika belum dikerjakan, mulai ujian
      setCurrentExam(exam);
      setAnswers({});
      setTimeLeft(exam.duration * 60);
      setPage('exam');
    } catch (error) {
      console.error('Error checking exam status:', error);
      showAlert('Kesalahan', 'Gagal memeriksa status ujian.\n\nSilakan coba lagi.', 'error');
    }
    setLoading(false);
  };

  const handleSubmitExam = async () => {
    setLoading(true); // Tampilkan loading saat submit
    
    const score = calculateScore();
    
    // Kirim hasil ke spreadsheet
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveResult',
          examName: currentExam.name,
          studentData: userData,
          score: score,
          total: currentExam.questionCount
        })
      });
      
      // Simulasi delay untuk menunjukkan proses
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setExamResult({ score, total: currentExam.questionCount });
      setLoading(false);
      setPage('result');
    } catch (error) {
      console.error('Gagal menyimpan hasil:', error);
      setLoading(false);
      showAlert('Kesalahan', 'Gagal menyimpan hasil ujian.\n\nNamun Anda tetap bisa melihat nilai Anda.', 'warning');
      setExamResult({ score, total: currentExam.questionCount });
      setPage('result');
    }
  };

  const calculateScore = () => {
    let correct = 0;
    for (let i = 1; i <= currentExam.questionCount; i++) {
      if (answers[i] === currentExam.answerKey[i]) {
        correct++;
      }
    }
    return correct;
  };

  const handleSaveExam = async (examData) => {
    setLoading(true);
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveExam',
          examData: examData
        })
      });
      await loadExams();
      showAlert('Berhasil', 'Tes berhasil disimpan!', 'success');
    } catch (error) {
      showAlert('Gagal', 'Gagal menyimpan tes.\n\nSilakan coba lagi.', 'error');
    }
    setLoading(false);
  };

  const handleDeleteExam = async (examName) => {
    showAlert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus tes "${examName}"?\n\nData hasil ujian juga akan terhapus.`,
      'warning'
    );
    
    // Simulated confirm - in real app, you'd need a proper confirm dialog
    setLoading(true);
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteExam',
          examName: examName
        })
      });
      await loadExams();
      showAlert('Berhasil', 'Ujian berhasil dihapus!', 'success');
    } catch (error) {
      showAlert('Gagal', 'Gagal menghapus ujian.', 'error');
    }
    setLoading(false);
  };

  // Login Page
  if (page === 'login') {
    return (
      <>
        <CustomAlert 
          show={alert.show}
          onClose={closeAlert}
          title={alert.title}
          message={alert.message}
          type={alert.type}
        />
        {loading && <LoadingSpinner fullScreen message="Memproses login..." />}
        <LoginPage 
          onStudentLogin={handleLogin}
          onAdminLogin={handleAdminLogin}
          loading={loading}
        />
      </>
    );
  }

  // Admin Dashboard
  if (page === 'admin-dashboard') {
    return (
      <>
        <CustomAlert 
          show={alert.show}
          onClose={closeAlert}
          title={alert.title}
          message={alert.message}
          type={alert.type}
        />
        {loading && <LoadingSpinner fullScreen message="Memproses..." />}
        <AdminDashboard 
          exams={exams}
          onSaveExam={handleSaveExam}
          onDeleteExam={handleDeleteExam}
          onLogout={() => setPage('login')}
          loading={loading}
        />
      </>
    );
  }

  // Exam List (Student)
  if (page === 'exam-list') {
    return (
      <>
        <CustomAlert 
          show={alert.show}
          onClose={closeAlert}
          title={alert.title}
          message={alert.message}
          type={alert.type}
        />
        {loading && <LoadingSpinner fullScreen message="Memeriksa status ujian..." />}
        <ExamList 
          userData={userData}
          exams={exams}
          onStartExam={handleStartExam}
          onLogout={() => setPage('login')}
        />
      </>
    );
  }

  // Exam Page
  if (page === 'exam') {
    return (
      <>
        <CustomAlert 
          show={alert.show}
          onClose={closeAlert}
          title={alert.title}
          message={alert.message}
          type={alert.type}
        />
        {loading && <LoadingSpinner fullScreen message="Menyimpan hasil tes..." />}
        <ExamPage 
          exam={currentExam}
          answers={answers}
          setAnswers={setAnswers}
          timeLeft={timeLeft}
          onSubmit={handleSubmitExam}
        />
      </>
    );
  }

  // Result Page
  if (page === 'result') {
    return (
      <>
        <CustomAlert 
          show={alert.show}
          onClose={closeAlert}
          title={alert.title}
          message={alert.message}
          type={alert.type}
        />
        <ResultPage 
          result={examResult}
          examName={currentExam.name}
          onBackToList={() => {
            setPage('exam-list');
            setExamResult(null);
          }}
        />
      </>
    );
  }
}

// Login Component
function LoginPage({ onStudentLogin, onAdminLogin, loading }) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input) return;
    
    // Cek apakah input adalah username admin
    if (input.trim() === 'NEU339') {
      onAdminLogin(input.trim());
    } else {
      // Jika bukan admin, anggap sebagai nomor WhatsApp siswa
      onStudentLogin(input.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <img 
              src="https://res.cloudinary.com/dhsitw8hl/image/upload/v1764392489/NB_merah_cjt2eq.png"
              alt="Logo"
              className="h-12 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Tes Evaluasi</h1>
          <p className="text-gray-600"><i>Jangan takut salah, takutlah kalau kamu tidak mencoba sama sekali.</i></p>
        </div>

        <div>
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Login
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Masukkan nomor WhatsApp : 8912345678"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              Nomor WhatsApp tanpa angka nol
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !input}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Admin Dashboard Component
function AdminDashboard({ exams, onSaveExam, onDeleteExam, onLogout, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    questionCount: 10,
    optionCount: 4,
    duration: 60,
    answerKey: {},
    kelompokKelas: 'Semua' // Tambahan untuk filter kelas
  });

  const handleEdit = (exam) => {
    setFormData(exam);
    setEditMode(true);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (formData.name && formData.questionCount > 0) {
      onSaveExam(formData);
      setShowForm(false);
      setEditMode(false);
      setFormData({
        name: '',
        questionCount: 10,
        optionCount: 4,
        duration: 60,
        answerKey: {}
      });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditMode(false);
    setFormData({
      name: '',
      questionCount: 10,
      optionCount: 4,
      duration: 60,
      answerKey: {},
      kelompokKelas: 'Semua'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Bubat Hebat</h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Buat Tes Baru
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              {editMode ? 'Edit Ujian' : 'Form Ujian Baru'}
            </h2>
            <div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Nama Tes
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    disabled={editMode}
                  />
                  {editMode && (
                    <p className="text-xs text-gray-500 mt-1">Nama tes tidak bisa diubah saat edit</p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Kelompok Kelas
                  </label>
                  <select
                    value={formData.kelompokKelas}
                    onChange={(e) => setFormData({...formData, kelompokKelas: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                  >
                    <option value="Semua">Semua Kelas</option>
                    <option value="1 SMA">1 SMA</option>
                    <option value="2 SMA">2 SMA</option>
                    <option value="3 SMA">3 SMA</option>
                    <option value="1 SMP">1 SMP</option>
                    <option value="2 SMP">2 SMP</option>
                    <option value="3 SMP">3 SMP</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Pilih tingkat kelas yang bisa mengerjakan tes ini</p>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Jumlah Soal
                  </label>
                  <input
                    type="number"
                    value={formData.questionCount}
                    onChange={(e) => setFormData({...formData, questionCount: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Jumlah Pilihan (A, B, C, ...)
                  </label>
                  <input
                    type="number"
                    value={formData.optionCount}
                    onChange={(e) => setFormData({...formData, optionCount: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    min="2"
                    max="5"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Durasi (menit)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:outline-none"
                    min="1"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Kunci Jawaban
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Pilih jawaban yang benar untuk setiap nomor soal. Biarkan kosong (-) jika belum tahu.
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({length: formData.questionCount}, (_, i) => i + 1).map(num => {
                    const isFilled = formData.answerKey[num] && formData.answerKey[num] !== '';
                    return (
                      <div key={num} className="flex items-center gap-2">
                        <span className={`text-sm font-semibold w-8 ${isFilled ? 'text-green-600' : 'text-gray-400'}`}>
                          {isFilled ? '✓' : '•'} {num}.
                        </span>
                        <select
                          value={formData.answerKey[num] || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            answerKey: {...formData.answerKey, [num]: e.target.value}
                          })}
                          className={`flex-1 px-2 py-1 border-2 rounded focus:outline-none ${
                            isFilled 
                              ? 'border-green-300 bg-green-50 focus:border-green-600' 
                              : 'border-gray-300 focus:border-red-600'
                          }`}
                        >
                          <option value="">-</option>
                          {Array.from({length: formData.optionCount}, (_, i) => 
                            String.fromCharCode(65 + i)
                          ).map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <p className="text-gray-500">
                    💡 Tips: Pastikan semua soal sudah terisi kunci jawabannya
                  </p>
                  <p className={`font-semibold ${
                    Object.keys(formData.answerKey).filter(k => formData.answerKey[k]).length === formData.questionCount
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }`}>
                    {Object.keys(formData.answerKey).filter(k => formData.answerKey[k]).length}/{formData.questionCount} terisi
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {editMode ? 'Update Ujian' : 'Simpan Ujian'}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Daftar Tes</h2>
          {exams.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada tes yang dibuat</p>
          ) : (
            <div className="space-y-3">
              {exams.map((exam, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-red-300 transition">
                  <div>
                    <h3 className="font-bold text-gray-800">{exam.name}</h3>
                    <p className="text-sm text-gray-600">
                      {exam.questionCount} soal • {exam.duration} menit
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      📚 Untuk: {exam.kelompokKelas || 'Semua Kelas'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(exam)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                      title="Edit Tes"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDeleteExam(exam.name)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                      title="Hapus Tes"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Exam List Component (Student)
function ExamList({ userData, exams, onStartExam, onLogout }) {
  const [completedExams, setCompletedExams] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData && userData.whatsapp && exams.length > 0) {
      checkCompletedExams();
    } else {
      setLoading(false);
    }
  }, [exams]);

  const checkCompletedExams = async () => {
    setLoading(true);
    const completed = {};
    
    for (const exam of exams) {
      try {
        const response = await fetch(`${SCRIPT_URL}?action=checkExamStatus&examName=${encodeURIComponent(exam.name)}&phone=${encodeURIComponent(userData.whatsapp)}`);
        const data = await response.json();
        
        console.log(`Check exam ${exam.name}:`, data); // Debug log
        
        if (data.completed) {
          completed[exam.name] = data.score;
        }
      } catch (error) {
        console.error(`Error checking exam ${exam.name}:`, error);
      }
    }
    
    console.log('Completed exams:', completed); // Debug log
    setCompletedExams(completed);
    setLoading(false);
  };

  // Filter ujian berdasarkan kelompok kelas siswa
  const filteredExams = exams.filter(exam => {
    // Jika kelompokKelas tidak ada atau "Semua", tampilkan untuk semua siswa
    if (!exam.kelompokKelas || exam.kelompokKelas === 'Semua') {
      return true;
    }
    // Jika kelompokKelas ada, cek apakah sesuai dengan kelompok siswa
    return exam.kelompokKelas === userData.kelompokKelas;
  });

  console.log('User kelompok:', userData.kelompokKelas); // Debug log
  console.log('Filtered exams:', filteredExams); // Debug log

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Selamat Datang</h1>
            <p className="text-red-100">{userData.nama} - {userData.kelas}</p>
            <p className="text-xs text-red-200 mt-1">WA: {userData.whatsapp} • Kelompok: {userData.kelompokKelas}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Pilih Ujian</h2>
          {loading ? (
            <LoadingSpinner message="Memuat data ujian..." />
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">Belum ada tes yang tersedia untuk kelompok kelas Kamu</p>
              <p className="text-sm text-gray-400">Kelompok: {userData.kelompokKelas}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExams.map((exam, idx) => {
                const isCompleted = completedExams[exam.name];
                return (
                  <div key={idx} className={`flex items-center justify-between p-4 border-2 rounded-lg transition ${
                    isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-red-300'
                  }`}>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{exam.name}</h3>
                      <p className="text-sm text-gray-600">
                        {exam.questionCount} soal • {exam.duration} menit
                      </p>
                      {isCompleted && (
                        <div className="flex items-center gap-2 mt-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-600">
                            Sudah dikerjakan • Nilai: {isCompleted}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onStartExam(exam)}
                      disabled={isCompleted}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        isCompleted 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isCompleted ? 'Selesai' : 'Mulai'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Exam Page Component
function ExamPage({ exam, answers, setAnswers, timeLeft, onSubmit }) {
  const options = Array.from({length: exam.optionCount}, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">{exam.name}</h1>
          <div className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-lg font-bold">
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-6">
            {Array.from({length: exam.questionCount}, (_, i) => i + 1).map(num => (
              <div key={num} className="pb-4 border-b border-gray-200 last:border-b-0">
                <h3 className="font-bold text-gray-800 mb-3">Soal {num}</h3>
                <div className="flex flex-wrap gap-2">
                  {options.map(option => (
                    <button
                      key={option}
                      onClick={() => setAnswers({...answers, [num]: option})}
                      className={`px-6 py-3 rounded-lg font-semibold transition ${
                        answers[num] === option
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onSubmit}
            className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Selesai & Submit
          </button>
        </div>
      </div>
    </div>
  );

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Result Page Component
function ResultPage({ result, examName, onBackToList }) {
  const percentage = (result.score / result.total * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Tes Selesai!</h1>
        <p className="text-gray-600 mb-6">{examName}</p>
        
        <div className="bg-red-50 rounded-lg p-6 mb-6">
          <div className="text-5xl font-bold text-red-600 mb-2">
            {result.score}/{result.total}
          </div>
          <div className="text-2xl font-semibold text-gray-700">
            {percentage}%
          </div>
        </div>

        <button
          onClick={onBackToList}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Kembali ke Daftar Tes
        </button>
      </div>
    </div>
  );
}
