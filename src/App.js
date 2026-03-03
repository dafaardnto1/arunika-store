import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Settings, Trash2, Edit3, Phone, Store,
  X, Filter, ShoppingCart, Package, LayoutDashboard,
  Star, Menu, MessageSquare, Home, LogIn, LogOut, PlusCircle, CheckCircle2,
  ChevronRight, ArrowRight, MapPin, ShoppingBag, Save, AlertCircle, Info, Tag, Globe, Upload, Loader2
} from 'lucide-react';

// --- KONFIGURASI DATABASE ---
const SUPABASE_URL = 'https://mqenyookxpcqpbhezvlt.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_d1ujW-SiX5aiLJDbVL5Yfw_kWoH7m6S'; 

const App = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState('shop'); 
  const [adminSection, setAdminSection] = useState('products');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState([]);
  const [supabase, setSupabase] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Custom Modal State
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null });

  // State Penyimpanan Data (Default jika DB kosong)
  const [profile, setProfile] = useState({ 
    shopName: 'Arunika Craft & Co', 
    phoneNumber: '6281234567890', 
    description: 'Menghadirkan kehangatan karya tangan pengrajin lokal ke dalam rumah Anda.', 
    address: 'Yogyakarta, Indonesia',
    websiteTitle: 'Arunika Craft - Toko Kerajinan Lokal Terbaik',
    faviconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869636.png'
  });
  
  const [categories, setCategories] = useState(['Semua', 'Fashion', 'Home Living', 'Kuliner', 'Homemade']);
  const [advantages] = useState([
    { id: 1, title: 'Kualitas Premium', desc: 'Material pilihan terbaik dari pengrajin lokal.' },
    { id: 2, title: 'Ramah Lingkungan', desc: 'Produksi berkelanjutan dan minim limbah.' }
  ]);
  const [testimonials, setTestimonials] = useState([]);
  const [products, setProducts] = useState([]);
  const [editObj, setEditObj] = useState(null);
  const [loginData, setLoginData] = useState({ user: '', pass: '' });

  // --- SINKRONISASI METADATA WEBSITE (FAVICON & TITLE) ---
  useEffect(() => {
    document.title = profile.websiteTitle || profile.shopName;
    const link = document.querySelector("link[rel~='icon']");
    if (link && profile.faviconUrl) {
      link.href = profile.faviconUrl;
    } else if (profile.faviconUrl) {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = profile.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(newLink);
    }
  }, [profile.websiteTitle, profile.faviconUrl, profile.shopName]);

  // --- POPUP HANDLER (CUSTOM MODAL) ---
  const showAlert = (title, message, type = 'info') => {
    setModal({ show: true, title, message, type, onConfirm: null });
  };

  const showConfirm = (title, message, onConfirm) => {
    setModal({ show: true, title, message, type: 'confirm', onConfirm });
  };

  // --- MEMUAT SUPABASE CLIENT ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => {
      if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabase(client);
      }
    };
    document.head.appendChild(script);
  }, []);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const { data: p } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (p) setProducts(p);

      const { data: t } = await supabase.from('testimonials').select('*').order('id', { ascending: false });
      if (t) setTestimonials(t);

      const { data: pr } = await supabase.from('profile').select('*').eq('id', 1).single();
      if (pr) setProfile({
        shopName: pr.shop_name,
        phoneNumber: pr.phone_number,
        description: pr.description,
        address: pr.address,
        websiteTitle: pr.website_title || profile.websiteTitle,
        faviconUrl: pr.favicon_url || profile.faviconUrl
      });
    } catch (err) { console.error("Error fetching data:", err); }
  };

  useEffect(() => { if (supabase) fetchData(); }, [supabase]);

  // --- LOGIKA UPLOAD GAMBAR KE SUPABASE STORAGE (BUCKET: product-images) ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !supabase) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setEditObj({ ...editObj, image: publicUrl });
      showAlert('Berhasil', 'Gambar telah terunggah ke penyimpanan.', 'success');
    } catch (err) {
      console.error('Upload error:', err);
      showAlert('Gagal Upload', 'Periksa apakah bucket "product-images" sudah ada dan diatur ke Public di Supabase.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // --- FUNGSI ADMIN ---
  const saveProduct = async (obj) => {
    if (!supabase) return;
    if (!obj.image) {
      showAlert('Peringatan', 'Harap unggah gambar produk terlebih dahulu.', 'error');
      return;
    }

    try {
      if (obj.id && typeof obj.id === 'number' && obj.id < 2000000000) {
        await supabase.from('products').update(obj).eq('id', obj.id);
      } else {
        const { id, ...newObj } = obj;
        await supabase.from('products').insert([newObj]);
      }
      fetchData();
      setEditObj(null);
      showAlert('Berhasil', 'Katalog produk telah diperbarui.', 'success');
    } catch (err) { showAlert('Gagal', 'Gagal menyimpan data ke database.', 'error'); }
  };

  const handleDeleteProduct = (id) => {
    showConfirm('Hapus Produk?', 'Tindakan ini permanen.', async () => {
      if (supabase) {
        await supabase.from('products').delete().eq('id', id);
        fetchData();
        showAlert('Dihapus', 'Produk telah dihapus.', 'success');
      }
    });
  };

  const saveProfile = async () => {
    if (supabase) {
      await supabase.from('profile').update({
        shop_name: profile.shopName,
        phone_number: profile.phoneNumber,
        description: profile.description,
        address: profile.address,
        website_title: profile.websiteTitle,
        favicon_url: profile.faviconUrl
      }).eq('id', 1);
      showAlert('Berhasil', 'Identitas website telah diperbarui.', 'success');
    }
  };

  const saveTestimonial = async (name, text) => {
    if (supabase) {
      await supabase.from('testimonials').insert([{ name, text, rating: 5 }]);
      fetchData();
      showAlert('Terpublikasi', 'Testimoni pembeli telah ditambahkan.', 'success');
    }
  };

  const handleDeleteTestimonial = (id) => {
    showConfirm('Hapus?', 'Hapus testimoni ini?', async () => {
      if (supabase) {
        await supabase.from('testimonials').delete().eq('id', id);
        fetchData();
      }
    });
  };

  // --- UI HELPERS ---
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const calculateDiscount = (orig, disc) => {
    if (!orig || orig <= disc) return null;
    return Math.round(((orig - disc) / orig) * 100);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    setIsCartOpen(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => selectedCategory === 'Semua' || p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleLogin = () => {
    if (loginData.user === 'arunika' && loginData.pass === 'arunika1234') {
      setIsLoggedIn(true);
      setIsLoginModalOpen(false);
      setView('admin');
      showAlert('Akses Diberikan', `Halo Admin! Selamat bekerja di panel kontrol.`, 'success');
    } else {
      showAlert('Gagal', 'Lupa Password? Hubungi Developer', 'error');
    }
  };

  const sendWhatsApp = () => {
    const total = cart.reduce((a, b) => a + (b.discount_price * b.qty), 0);
    const itemList = cart.map(i => `%0A- *${i.name}* (x${i.qty})`).join('');
    const message = `Halo Kak admin *${profile.shopName}*,%0ASaya ingin memesan produk berikut:${itemList}%0A%0A*Total Estimasi:* ${formatIDR(total)}%0A%0AMohon info ketersediaan stok & cara pembayarannya ya kak. Terima kasih!`;
    window.open(`https://wa.me/${profile.phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-w-[1280px] overflow-x-auto bg-[#FDFBF7] text-[#4A443F] font-sans selection:bg-[#D9C5B2] min-h-screen">
      
      {/* CUSTOM MODAL POPUP */}
      {modal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#4A443F]/60 backdrop-blur-md">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl border border-[#E8E2D9] animate-in zoom-in-95 duration-200 text-center">
             <div className="flex flex-col items-center">
                {modal.type === 'success' && <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><CheckCircle2 size={32}/></div>}
                {modal.type === 'error' && <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6"><AlertCircle size={32}/></div>}
                {modal.type === 'confirm' && <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6"><AlertCircle size={32}/></div>}
                
                <h3 className="text-xl font-black text-[#4A443F] mb-2">{modal.title}</h3>
                <p className="text-sm text-[#8B8276] leading-relaxed mb-8">{modal.message}</p>
                
                <div className="flex gap-3 w-full">
                  {modal.onConfirm ? (
                    <>
                      <button onClick={() => setModal({ ...modal, show: false })} className="flex-1 py-4 rounded-xl font-bold border border-[#E8E2D9] hover:bg-[#FDFBF7]">Batal</button>
                      <button onClick={() => { modal.onConfirm(); setModal({ ...modal, show: false }); }} className="flex-1 py-4 rounded-xl font-bold bg-red-500 text-white shadow-lg">Hapus</button>
                    </>
                  ) : (
                    <button onClick={() => setModal({ ...modal, show: false })} className="w-full py-4 rounded-xl font-bold bg-[#4A443F] text-white shadow-xl shadow-black/10">Oke, Siap!</button>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#4A443F]/40 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl border border-[#E8E2D9]">
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-[#F3EFE9] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#A68966] shadow-sm"><LayoutDashboard size={32}/></div>
               <h2 className="text-2xl font-black text-[#4A443F]">Admin Login</h2>
               <p className="text-sm text-[#8B8276]">Gunakan akun arunika untuk masuk</p>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Username" className="w-full p-4 rounded-2xl border bg-[#FDFBF7] outline-none focus:border-[#A68966] transition-all" onChange={(e) => setLoginData({...loginData, user: e.target.value})} />
              <input type="password" placeholder="Password" className="w-full p-4 rounded-2xl border bg-[#FDFBF7] outline-none focus:border-[#A68966] transition-all" onChange={(e) => setLoginData({...loginData, pass: e.target.value})} />
              <button onClick={handleLogin} className="w-full bg-[#4A443F] text-white py-5 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-black/10 mt-4">Masuk Panel</button>
              <button onClick={() => setIsLoginModalOpen(false)} className="w-full text-xs text-gray-400 mt-2 font-bold hover:text-[#4A443F]">Batal & Kembali</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-10 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('shop')}>
            <div className="bg-[#4A443F] p-3 rounded-2xl group-hover:rotate-6 transition-transform shadow-md">
              <Store className="text-white w-6 h-6" />
            </div>
            <div>
               <h1 className="font-black text-2xl tracking-tighter leading-none text-[#4A443F]">{profile.shopName}</h1>
               <p className="text-[10px] font-black text-[#A68966] uppercase tracking-[0.2em] mt-1 italic">Toko Pilihan Keluarga</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => setIsCartOpen(!isCartOpen)} className="relative p-3 rounded-2xl bg-[#F3EFE9] text-[#4A443F] hover:bg-[#E8E2D9] transition-all shadow-sm">
              <ShoppingCart size={24} />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[#A68966] text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-white animate-bounce shadow-md">{cart.length}</span>}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 rounded-2xl border border-[#E8E2D9] hover:bg-[#FDFBF7] shadow-sm">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b p-10 shadow-2xl animate-in slide-in-from-top duration-300 border-t border-[#FDFBF7]">
            <div className="max-w-7xl mx-auto grid grid-cols-2 gap-10">
              <div className="space-y-2">
                <button onClick={() => {setView('shop'); setIsMenuOpen(false)}} className="w-full text-left p-5 rounded-2xl hover:bg-[#FDFBF7] flex items-center gap-4 font-black transition-all text-[#4A443F] border border-transparent hover:border-[#E8E2D9]"><Home size={20}/> Beranda</button>
                <button onClick={() => {setIsCartOpen(true); setIsMenuOpen(false)}} className="w-full text-left p-5 rounded-2xl hover:bg-[#FDFBF7] flex items-center gap-4 font-black transition-all text-[#4A443F] border border-transparent hover:border-[#E8E2D9]"><ShoppingCart size={20}/> Keranjang Belanja</button>
                <a href={`https://wa.me/${profile.phoneNumber}`} target="_blank" rel="noreferrer" className="w-full text-left p-5 rounded-2xl hover:bg-[#FDFBF7] flex items-center gap-4 font-black transition-all text-[#4A443F] border border-transparent hover:border-[#E8E2D9]"><Phone size={20}/> Hubungi WhatsApp</a>
              </div>
              <div className="bg-[#FDFBF7] rounded-[2.5rem] p-8 border border-[#E8E2D9] flex flex-col justify-center">
                {!isLoggedIn ? (
                    <button onClick={() => {setIsLoginModalOpen(true); setIsMenuOpen(false)}} className="w-full p-5 rounded-2xl bg-white text-[#A68966] flex items-center justify-center gap-4 font-black border border-[#E8E2D9] shadow-sm hover:shadow-md transition-all"><LogIn size={20}/> Dashboard Admin</button>
                ) : (
                  <div className="space-y-4">
                    <button onClick={() => {setView('admin'); setIsMenuOpen(false)}} className="w-full p-5 rounded-2xl bg-[#4A443F] text-white flex items-center justify-center gap-4 font-black shadow-lg shadow-black/10"><LayoutDashboard size={20}/> Masuk Dashboard</button>
                    <button onClick={() => {setIsLoggedIn(false); setView('shop')}} className="w-full p-5 rounded-2xl text-red-500 flex items-center justify-center gap-4 font-black hover:bg-red-50 transition-all"><LogOut size={20}/> Keluar Admin</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* SIDEBAR KERANJANG */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <div className="absolute inset-0 bg-[#4A443F]/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-[#E8E2D9]">
            <div className="p-8 border-b flex justify-between items-center bg-[#FDFBF7]">
              <div>
                <h2 className="text-2xl font-black text-[#4A443F]">Pesanan Saya</h2>
                <p className="text-xs font-bold text-[#A68966] uppercase tracking-widest">{cart.length} Produk Dipilih</p>
              </div>
              <button onClick={() => setIsCartOpen(false)}><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#8B8276] opacity-30">
                  <ShoppingBag size={80} className="mb-6" />
                  <p className="font-black text-xl uppercase tracking-tighter">Keranjang Kosong</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-5 p-4 bg-[#FDFBF7] rounded-[2rem] border border-[#E8E2D9] group transition-all hover:border-[#A68966] shadow-sm">
                    <img src={item.image} className="w-16 h-16 rounded-xl object-cover shadow-md" alt="" />
                    <div className="flex-1">
                      <h4 className="font-black text-sm text-[#4A443F]">{item.name}</h4>
                      <p className="text-[#A68966] text-xs font-black mt-1">{formatIDR(item.discount_price)}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <button onClick={() => setCart(cart.map(x => x.id === item.id ? {...x, qty: Math.max(1, x.qty-1)} : x))} className="w-7 h-7 flex items-center justify-center font-black bg-white rounded-lg border shadow-sm">-</button>
                        <span className="text-xs font-black w-6 text-center">{item.qty}</span>
                        <button onClick={() => setCart(cart.map(x => x.id === item.id ? {...x, qty: x.qty+1} : x))} className="w-7 h-7 flex items-center justify-center font-black bg-white rounded-lg border shadow-sm">+</button>
                        <button onClick={() => setCart(cart.filter(x => x.id !== item.id))} className="text-red-300 hover:text-red-500 transition-colors ml-auto"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-10 border-t bg-[#FDFBF7] rounded-t-[3rem] shadow-2xl">
                <div className="flex justify-between mb-8 font-black text-[#4A443F]">
                  <span className="text-lg">Total Estimasi</span>
                  <span className="text-2xl text-[#A68966]">{formatIDR(cart.reduce((a, b) => a + (b.discount_price * b.qty), 0))}</span>
                </div>
                <button onClick={sendWhatsApp} className="w-full bg-[#4A443F] text-white py-6 rounded-3xl font-black flex items-center justify-center gap-4 hover:bg-black shadow-2xl active:scale-95 transition-all">
                  Kirim Pesanan ke WA <ArrowRight size={24} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN VIEW */}
      <main className="max-w-7xl mx-auto px-10 py-10">
        
        {view === 'shop' && (
          <div className="space-y-32 animate-in fade-in duration-1000">
            {/* HERO - BEAUTIFIED */}
            <section id="hero" className="rounded-[4rem] bg-white border border-[#E8E2D9] p-24 flex items-center gap-24 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F3EFE9]/30 -skew-x-12 translate-x-1/4 border-l border-[#E8E2D9]/30"></div>
              
              <div className="flex-1 space-y-10 relative z-10">
                <div className="inline-flex items-center gap-3 bg-[#FDFBF7] px-6 py-2 rounded-full border border-[#E8E2D9] text-[#A68966] font-black uppercase tracking-[0.2em] text-[10px] shadow-sm">
                   <Tag size={14}/> UMKM Terverifikasi
                </div>
                <h2 className="text-8xl font-black leading-[0.9] text-[#4A443F] tracking-tighter">
                  {profile.shopName}
                </h2>
                <p className="text-[#8B8276] text-2xl leading-relaxed max-w-xl font-medium italic border-l-4 border-[#A68966] pl-6 bg-white/50 py-2">
                  {profile.description}
                </p>
                <div className="flex gap-6">
                  <button onClick={() => document.getElementById('catalog').scrollIntoView({behavior:'smooth'})} className="bg-[#4A443F] text-white px-12 py-6 rounded-3xl font-black text-lg hover:bg-black hover:translate-x-2 transition-all shadow-2xl shadow-black/10 flex items-center gap-3">
                    Buka Katalog <ChevronRight size={24}/>
                  </button>
                  <div className="flex items-center gap-3 text-sm font-black text-[#A68966] uppercase tracking-widest px-8">
                    <CheckCircle2 size={20}/> 100% Produk Lokal
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-6 relative z-10">
                {advantages.map(adv => (
                  <div key={adv.id} className="p-10 bg-[#FDFBF7]/80 backdrop-blur-md rounded-[3rem] border border-[#E8E2D9] hover:border-[#A68966] transition-all group shadow-sm">
                    <div className="w-14 h-14 bg-[#A68966] rounded-2xl mb-8 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                      <Star size={24} fill="currentColor"/>
                    </div>
                    <h4 className="font-black text-[#4A443F] text-xl mb-3">{adv.title}</h4>
                    <p className="text-sm text-[#8B8276] leading-relaxed font-medium">{adv.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* KATALOG */}
            <section id="catalog" className="space-y-16 scroll-mt-24">
              <div className="flex justify-between items-end border-b border-[#E8E2D9] pb-12">
                <div>
                  <h3 className="text-6xl font-black text-[#4A443F] tracking-tighter">Produk Pilihan</h3>
                  <p className="text-[#A68966] font-black uppercase tracking-[0.3em] text-xs mt-4">Katalog terbaru minggu ini</p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide max-w-2xl">
                  {categories.map(cat => (
                    <button 
                      key={cat} onClick={() => setSelectedCategory(cat)} 
                      className={`px-10 py-4 rounded-full text-sm font-black border transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-[#A68966] text-white border-[#A68966] shadow-xl shadow-[#A68966]/20' : 'bg-white text-[#8B8276] hover:border-[#A68966] shadow-sm'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-10">
                {filteredProducts.map(p => {
                  const discPercent = calculateDiscount(p.original_price, p.discount_price);
                  return (
                    <div key={p.id} className="bg-white rounded-[3rem] overflow-hidden border border-[#E8E2D9] group hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 shadow-sm relative">
                      <div className="h-[380px] overflow-hidden relative">
                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={p.name} />
                        {discPercent && (
                          <div className="absolute top-6 left-6 bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-red-200 flex items-center gap-2 animate-pulse">
                             <Tag size={12}/> Hemat {discPercent}%
                          </div>
                        )}
                        <span className="absolute bottom-6 right-6 bg-white/95 backdrop-blur px-5 py-2 rounded-full text-[10px] font-black uppercase text-[#A68966] border border-[#E8E2D9] tracking-widest shadow-xl">{p.category}</span>
                      </div>
                      <div className="p-10">
                        <h4 className="font-black text-2xl mb-2 text-[#4A443F] group-hover:text-[#A68966] transition-colors">{p.name}</h4>
                        <div className="flex flex-col mb-10">
                          <span className="text-3xl font-black text-[#4A443F]">{formatIDR(p.discount_price)}</span>
                          <span className="text-sm text-gray-300 line-through font-black mt-1">{formatIDR(p.original_price)}</span>
                        </div>
                        <button onClick={() => addToCart(p)} className="w-full py-6 rounded-[2rem] bg-[#F3EFE9] text-[#4A443F] hover:bg-[#4A443F] hover:text-white flex items-center justify-center gap-4 font-black transition-all shadow-sm active:scale-95">
                          <Plus size={24}/> Ambil Sekarang
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* TESTIMONI - COMPACT */}
            <section className="bg-[#4A443F] rounded-[5rem] p-24 text-white text-center space-y-16 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase">Apa Kata Pembeli?</h3>
                <div className="w-20 h-1.5 bg-[#A68966] mx-auto rounded-full mb-10"></div>
                <div className="grid grid-cols-4 gap-8">
                  {testimonials.map(t => (
                    <div key={t.id} className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 flex flex-col items-center hover:bg-white/10 transition-all text-center group">
                      <div className="flex gap-1 text-[#A68966] mb-4 group-hover:scale-110 transition-transform">
                        {[...Array(t.rating || 5)].map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
                      </div>
                      <p className="text-sm font-medium leading-relaxed mb-6 italic text-white/80 line-clamp-3">"{t.text}"</p>
                      <p className="font-black text-[10px] tracking-[0.3em] uppercase opacity-60 border-t border-white/10 pt-4 w-full">— {t.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ADMIN VIEW */}
        {view === 'admin' && (
          <div className="flex gap-16 animate-in slide-in-from-bottom-10 duration-700">
            <aside className="w-80 space-y-4 shrink-0">
              <div className="p-10 bg-[#A68966] text-white rounded-[3rem] mb-10 shadow-2xl shadow-[#A68966]/30">
                <h4 className="font-black text-2xl uppercase leading-none">Admin Panel</h4>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Sistem Arunika</p>
              </div>
              <div className="space-y-2">
                {[
                  {id:'products', label:'Manajemen Produk', icon: Package},
                  {id:'categories', label:'List Kategori', icon: Filter},
                  {id:'testimonials', label:'Koleksi Ulasan', icon: MessageSquare},
                  {id:'settings', label:'Identitas Website', icon: Globe}
                ].map(item => (
                  <button key={item.id} onClick={() => setAdminSection(item.id)} className={`w-full flex items-center gap-5 px-10 py-6 rounded-[2.5rem] font-black text-sm transition-all border-2 ${adminSection === item.id ? 'bg-[#4A443F] border-[#4A443F] text-white shadow-xl' : 'bg-white border-transparent hover:border-[#E8E2D9] text-[#8B8276]'}`}>
                    <item.icon size={22}/> {item.label}
                  </button>
                ))}
              </div>
              <button onClick={() => {setIsLoggedIn(false); setView('shop')}} className="w-full flex items-center gap-5 px-10 py-6 rounded-[2.5rem] font-black text-sm text-red-500 hover:bg-red-50 transition-all mt-10">
                <LogOut size={22}/> Keluar Dashboard
              </button>
            </aside>

            <div className="flex-1">
              <div className="bg-white p-16 rounded-[4rem] border border-[#E8E2D9] shadow-sm min-h-full">
                
                {adminSection === 'products' && (
                  <div className="space-y-12">
                    <div className="flex justify-between items-center border-b pb-10">
                      <div>
                        <h3 className="text-4xl font-black text-[#4A443F] tracking-tighter">Daftar Katalog</h3>
                        <p className="text-sm font-bold text-[#A68966] uppercase mt-2">Update Produk Anda</p>
                      </div>
                      <button onClick={() => setEditObj({ name:'', discount_price:0, original_price:0, category: categories[1], description:'', image: null, stock:1 })} className="bg-[#A68966] text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-4 shadow-xl"><PlusCircle size={24}/> Tambah Baru</button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {products.map(p => (
                        <div key={p.id} className="flex items-center gap-10 p-8 bg-[#FDFBF7] rounded-[3rem] border border-transparent hover:border-[#A68966] transition-all group shadow-sm">
                          <img src={p.image} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-lg" alt="" />
                          <div className="flex-1">
                            <h4 className="font-black text-xl text-[#4A443F]">{p.name}</h4>
                            <p className="font-black text-[#A68966] text-lg">{formatIDR(p.discount_price)}</p>
                          </div>
                          <div className="flex gap-4">
                            <button onClick={() => setEditObj(p)} className="p-4 text-blue-500 bg-white border rounded-2xl shadow-sm hover:shadow-md"><Edit3 size={20}/></button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-4 text-red-400 bg-white border rounded-2xl shadow-sm hover:shadow-md"><Trash2 size={20}/></button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {editObj && (
                      <div className="fixed inset-0 z-[110] flex items-center justify-center p-10 bg-[#4A443F]/60 backdrop-blur-md">
                        <div className="bg-white p-16 rounded-[4rem] w-full max-w-3xl shadow-2xl border border-[#E8E2D9] max-h-[90vh] overflow-y-auto">
                          <div className="flex justify-between items-center mb-12 border-b pb-8">
                             <h4 className="text-3xl font-black text-[#4A443F] tracking-tighter">Editor Katalog</h4>
                             <button onClick={() => setEditObj(null)}><X size={32}/></button>
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                            <div className="col-span-2 space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">Nama Produk</label>
                               <input className="w-full p-6 rounded-[2rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-bold text-lg" value={editObj.name} onChange={e=>setEditObj({...editObj, name: e.target.value})} />
                            </div>
                            
                            {/* SUPABASE STORAGE UPLOAD (BUCKET: product-images) */}
                            <div className="col-span-2 space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">Foto Produk (Unggah ke Supabase)</label>
                               <div className="flex items-center gap-6 p-6 border-2 border-dashed border-[#E8E2D9] rounded-[2rem] bg-[#FDFBF7]">
                                  {isUploading ? (
                                    <div className="flex items-center gap-3 font-bold text-[#A68966] py-10 w-full justify-center">
                                      <Loader2 className="animate-spin" /> Sedang Mengunggah...
                                    </div>
                                  ) : editObj.image ? (
                                    <div className="flex items-center gap-6">
                                      <img src={editObj.image} className="w-24 h-24 rounded-2xl object-cover shadow-md" alt="Preview" />
                                      <button onClick={() => setEditObj({...editObj, image: null})} className="text-xs font-black text-red-500 uppercase underline">Hapus & Ganti</button>
                                    </div>
                                  ) : (
                                    <label className="flex-1 flex flex-col items-center justify-center cursor-pointer py-10">
                                       <Upload className="text-[#A68966] mb-2" size={32}/>
                                       <span className="text-sm font-black text-[#8B8276]">Klik untuk Pilih Gambar</span>
                                       <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                  )}
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">Harga Jual</label>
                               <input type="number" className="w-full p-6 rounded-[2rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-black text-[#A68966]" value={editObj.discount_price} onChange={e=>setEditObj({...editObj, discount_price: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">Harga Coret</label>
                               <input type="number" className="w-full p-6 rounded-[2rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-bold text-gray-400" value={editObj.original_price} onChange={e=>setEditObj({...editObj, original_price: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">Kategori</label>
                               <select className="w-full p-6 rounded-[2rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-black" value={editObj.category} onChange={e=>setEditObj({...editObj, category: e.target.value})}>
                                  {categories.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">Stok</label>
                               <input type="number" className="w-full p-6 rounded-[2rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-bold" value={editObj.stock} onChange={e=>setEditObj({...editObj, stock: Number(e.target.value)})} />
                            </div>
                            <div className="col-span-2 space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-[0.2em]">Deskripsi Produk</label>
                               <textarea rows="4" className="w-full p-8 rounded-[3rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none resize-none" value={editObj.description} onChange={e=>setEditObj({...editObj, description: e.target.value})} />
                            </div>
                          </div>
                          <div className="flex gap-6 mt-16">
                            <button onClick={() => saveProduct(editObj)} className="flex-1 bg-[#4A443F] text-white py-8 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all hover:bg-black" disabled={isUploading}><Save size={24} className="inline mr-2"/> Simpan Katalog</button>
                            <button onClick={() => setEditObj(null)} className="px-16 border-2 border-[#E8E2D9] py-8 rounded-[2.5rem] font-black text-xl">Batal</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {adminSection === 'categories' && (
                  <div className="space-y-12">
                    <h3 className="text-4xl font-black text-[#4A443F] tracking-tighter">Atur Kategori</h3>
                    <div className="flex gap-6 p-10 bg-[#FDFBF7] rounded-[3rem] border border-[#E8E2D9]">
                      <input id="newCat" placeholder="Kategori baru..." className="flex-1 p-6 rounded-[2rem] border border-[#E8E2D9] bg-white outline-none font-bold shadow-inner" />
                      <button onClick={() => {
                        const val = document.getElementById('newCat').value;
                        if(val && !categories.includes(val)) { setCategories([...categories, val]); document.getElementById('newCat').value = ''; showAlert('Berhasil', 'Kategori ditambahkan.', 'success'); }
                      }} className="bg-[#4A443F] text-white px-12 py-6 rounded-[2rem] font-black shadow-xl">Tambah</button>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      {categories.map((c, i) => i !== 0 && (
                        <div key={i} className="flex items-center justify-between gap-6 px-10 py-8 bg-white border border-[#E8E2D9] rounded-[2.5rem] font-black shadow-sm group hover:border-[#A68966] transition-all">
                          <span className="text-lg">{c}</span>
                          <button onClick={() => setCategories(categories.filter(cat => cat !== c))} className="text-red-200 hover:text-red-500 p-2"><X size={24}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminSection === 'testimonials' && (
                  <div className="space-y-12">
                    <h3 className="text-4xl font-black text-[#4A443F] tracking-tighter">Koleksi Ulasan</h3>
                    <div className="p-16 bg-[#FDFBF7] rounded-[4rem] border-2 border-dashed border-[#E8E2D9] space-y-10">
                      <div className="grid grid-cols-1 gap-6 max-w-xl mx-auto text-center">
                        <input id="tName" placeholder="Nama Pelanggan" className="w-full p-6 rounded-[2rem] border border-[#E8E2D9] bg-white outline-none font-bold" />
                        <textarea id="tText" placeholder="Pesan Ulasan..." className="w-full p-8 rounded-[2.5rem] border border-[#E8E2D9] bg-white outline-none resize-none" rows="4" />
                        <button onClick={() => {
                            const n = document.getElementById('tName').value;
                            const t = document.getElementById('tText').value;
                            if(n && t) { saveTestimonial(n, t); document.getElementById('tName').value=''; document.getElementById('tText').value=''; }
                          }} className="bg-[#A68966] text-white py-7 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-[#8B7356]">Publikasikan</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {testimonials.map(t => (
                        <div key={t.id} className="p-8 bg-white border border-[#E8E2D9] rounded-[2.5rem] flex justify-between items-center group shadow-sm">
                          <div>
                            <p className="font-black text-xl text-[#4A443F]">{t.name}</p>
                            <p className="text-[#8B8276] text-sm italic leading-relaxed">"{t.text}"</p>
                          </div>
                          <button onClick={() => handleDeleteTestimonial(t.id)} className="p-4 text-red-200 hover:text-red-500"><Trash2 size={24}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminSection === 'settings' && (
                  <div className="space-y-16">
                    <div className="flex justify-between items-center border-b pb-10">
                      <div>
                        <h3 className="text-4xl font-black text-[#4A443F] tracking-tighter">Identitas & Metadata</h3>
                        <p className="text-xs font-bold text-[#A68966] uppercase mt-2">Sinkronkan favicon & judul tab</p>
                      </div>
                      <button onClick={saveProfile} className="bg-[#A68966] text-white px-12 py-6 rounded-[2.5rem] font-black shadow-2xl flex items-center gap-4">
                        <Save size={24}/> Simpan Identitas
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-3 col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-4">Website Title (Tab Browser)</label>
                        <input className="w-full p-8 rounded-[2.5rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-black text-2xl text-[#4A443F] shadow-inner" value={profile.websiteTitle} onChange={e => setProfile({...profile, websiteTitle: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-4">Nama Toko UMKM</label>
                        <input className="w-full p-8 rounded-[2.5rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-black text-2xl shadow-inner" value={profile.shopName} onChange={e => setProfile({...profile, shopName: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-4">URL Favicon (Ikon Kecil Tab)</label>
                        <input className="w-full p-8 rounded-[2.5rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-bold text-sm shadow-inner" value={profile.faviconUrl} onChange={e => setProfile({...profile, faviconUrl: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-4">Nomor WhatsApp (Awal 62...)</label>
                        <input className="w-full p-8 rounded-[2.5rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-black text-xl shadow-inner" value={profile.phoneNumber} onChange={e => setProfile({...profile, phoneNumber: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-4">Lokasi / Kota</label>
                        <input className="w-full p-8 rounded-[2.5rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-black text-xl shadow-inner" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} />
                      </div>
                      <div className="space-y-3 col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em] ml-4">Slogan Toko</label>
                        <textarea rows="5" className="w-full p-10 rounded-[3.5rem] border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-medium text-xl leading-relaxed shadow-inner" value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-48 border-t border-[#E8E2D9] py-32 px-10 bg-white relative">
        <div className="max-w-7xl mx-auto flex justify-between items-start gap-32 relative z-10 text-center md:text-left">
          <div className="max-w-md space-y-10">
            <div className="flex items-center gap-5 justify-center md:justify-start">
              <div className="bg-[#4A443F] p-4 rounded-3xl shadow-xl shadow-black/10 transition-transform hover:rotate-6"><Store className="text-white w-8 h-8" /></div>
              <span className="font-black text-4xl text-[#4A443F] uppercase tracking-tighter">{profile.shopName}</span>
            </div>
            <p className="text-[#8B8276] text-xl font-medium leading-relaxed">{profile.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-32">
            <div className="space-y-10">
              <h5 className="font-black text-sm uppercase tracking-[0.4em] text-[#A68966]">Halaman</h5>
              <ul className="text-lg space-y-5 text-[#8B8276] font-black">
                <li className="hover:text-[#4A443F] cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>Beranda</li>
                <li className="hover:text-[#4A443F] cursor-pointer" onClick={() => setIsCartOpen(true)}>Pesanan</li>
                <li className="hover:text-[#4A443F] cursor-pointer" onClick={() => setIsLoginModalOpen(true)}>Login Admin</li>
              </ul>
            </div>
            <div className="space-y-10">
              <h5 className="font-black text-sm uppercase tracking-[0.4em] text-[#A68966]">Kontak</h5>
              <div className="flex gap-6 text-lg font-black text-[#8B8276]">
                <MapPin size={24} className="text-[#A68966] shrink-0" />
                <span>{profile.address}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-16 border-t border-[#F3EFE9] text-[10px] font-black uppercase tracking-[0.4em] text-[#D9C5B2] flex justify-between items-center">
          <p>© 2024 {profile.shopName}. Handcrafted in Indonesia 🇮🇩</p>
          <div className="flex items-center gap-6">
             <span className="cursor-pointer hover:text-[#4A443F]" onClick={() => setIsLoginModalOpen(true)}>Dashboard Kontrol</span>
             <span className="w-1.5 h-1.5 bg-[#D9C5B2] rounded-full"></span>
             <span>Sistem Template UMKM</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

/**
 * --- DOKUMENTASI LENGKAP PENGGUNAAN SISTEM ---
 * * 1. AKSES ADMIN:
 * - Username: arunika
 * - Password: arunika1234
 * - Akses via tombol "Login Admin" di footer atau menu navigasi.
 * * 2. PENGATURAN STORAGE (WAJIB):
 * - BUCKET: Pastikan di dashboard Supabase sudah dibuat Bucket bernama "product-images".
 * - PERMISSION: Ubah setting Bucket tersebut menjadi "Public" agar gambar bisa tampil di website.
 * - FLOW UPLOAD: Pilih gambar -> Supabase Upload -> Dapatkan URL -> Simpan Database.
 * * 3. DESKTOP MODE FORCED:
 * - Website menggunakan kontainer "min-w-[1280px]".
 * - Tampilan akan tetap sama (Mode Desktop) meskipun dibuka di HP untuk menjaga estetika UI.
 * * 4. WHATSAPP AUTO-ORDER:
 * - Pesan otomatis mencakup: Nama barang, jumlah (qty), dan total harga.
 * - Memudahkan admin memproses pesanan tanpa harus bertanya ulang barang apa yang dibeli.
 * * 5. METADATA WEBSITE:
 * - Dapat diubah di Dashboard Admin > Identitas Website.
 * - Mendukung perubahan Judul Tab (Title) dan Ikon Tab (Favicon) secara instan.
 * * 6. LABEL DISKON OTOMATIS:
 * - Muncul jika "Harga Coret" (original_price) lebih tinggi dari "Harga Jual" (discount_price).
 * * 7. CUSTOM POPUP (MODAL):
 * - Menggantikan alert browser yang membosankan dengan modal transparan bertema Cream & Brown.
 */
