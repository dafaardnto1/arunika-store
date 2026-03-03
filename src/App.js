import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Settings, Trash2, Edit3, Phone, Store,
  X, Filter, ShoppingCart, Package, LayoutDashboard,
  Star, Menu, MessageSquare, Home, LogIn, LogOut, PlusCircle,
  ChevronRight, ArrowRight, MapPin, ShoppingBag, Save
} from 'lucide-react';

// --- KONFIGURASI DATABASE ---
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://mqenyookxpcqpbhezvlt.supabase.co'; 
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_d1ujW-SiX5aiLJDbVL5Yfw_kWoH7m6S'; 

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

  // State Penyimpanan Data
  const [profile, setProfile] = useState({ 
    shopName: 'Arunika Craft & Co', 
    phoneNumber: '6281234567890', 
    description: 'Menghadirkan kehangatan karya tangan pengrajin lokal ke dalam rumah Anda.', 
    address: 'Yogyakarta, Indonesia' 
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

  // --- MEMUAT SUPABASE SECARA DINAMIS ---
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

  // --- MENGAMBIL DATA DARI SUPABASE ---
  const fetchData = useCallback(async () => {
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
        address: pr.address
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, [supabase]);

  useEffect(() => {
    if (supabase) fetchData();
  }, [supabase, fetchData]);

  // --- FUNGSI ADMIN ---
  const saveProduct = async (obj) => {
    if (!supabase) return;
    try {
      if (obj.id && typeof obj.id === 'number' && obj.id < 2000000000) {
        await supabase.from('products').update(obj).eq('id', obj.id);
      } else {
        const { id, ...newObj } = obj;
        await supabase.from('products').insert([newObj]);
      }
      fetchData();
      setEditObj(null);
    } catch (err) {
      alert("Gagal menyimpan produk.");
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Hapus produk ini?')) {
      if (supabase) {
        await supabase.from('products').delete().eq('id', id);
        fetchData();
      }
    }
  };

  const saveProfile = async () => {
    if (supabase) {
      await supabase.from('profile').update({
        shop_name: profile.shopName,
        phone_number: profile.phoneNumber,
        description: profile.description,
        address: profile.address
      }).eq('id', 1);
      alert('Profil diperbarui!');
    }
  };

  const saveTestimonial = async (name, text) => {
    if (supabase) {
      await supabase.from('testimonials').insert([{ name, text, rating: 5 }]);
      fetchData();
    }
  };

  const deleteTestimonial = async (id) => {
    if (window.confirm('Hapus testimoni ini?')) {
      if (supabase) {
        await supabase.from('testimonials').delete().eq('id', id);
        fetchData();
      }
    }
  };

  // --- UI HELPERS ---
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

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
    if (loginData.user === 'admin' && loginData.pass === 'admin') {
      setIsLoggedIn(true);
      setIsLoginModalOpen(false);
      setView('admin');
    } else {
      alert('Login Gagal! Gunakan admin / admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A443F] font-sans selection:bg-[#D9C5B2] selection:text-white">
      
      {/* MODAL LOGIN */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black mb-6 text-center text-[#4A443F]">Admin Login</h2>
            <div className="space-y-4">
              <input 
                type="text" placeholder="Username" 
                className="w-full p-4 rounded-xl border bg-[#FDFBF7] outline-none focus:ring-2 focus:ring-[#A68966]" 
                onChange={(e) => setLoginData({...loginData, user: e.target.value})}
              />
              <input 
                type="password" placeholder="Password" 
                className="w-full p-4 rounded-xl border bg-[#FDFBF7] outline-none focus:ring-2 focus:ring-[#A68966]" 
                onChange={(e) => setLoginData({...loginData, pass: e.target.value})}
              />
              <button onClick={handleLogin} className="w-full bg-[#4A443F] text-white py-4 rounded-xl font-bold hover:bg-black transition-all">Masuk</button>
              <button onClick={() => setIsLoginModalOpen(false)} className="w-full text-sm text-gray-400 mt-2">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E8E2D9] px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => {setView('shop'); setIsMenuOpen(false)}}>
            <div className="bg-[#4A443F] p-2 rounded-xl group-hover:rotate-6 transition-transform">
              <Store className="text-white w-5 h-5" />
            </div>
            <h1 className="font-black text-xl tracking-tight leading-none">{profile.shopName}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCartOpen(!isCartOpen)} className="relative p-2.5 rounded-xl bg-[#F3EFE9] text-[#4A443F] hover:bg-[#E8E2D9] transition-all">
              <ShoppingCart size={22} />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[#A68966] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white animate-bounce">{cart.length}</span>}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 rounded-xl border border-[#E8E2D9] hover:bg-[#FDFBF7]">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b p-6 shadow-2xl animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <button onClick={() => {setView('shop'); setIsMenuOpen(false)}} className="w-full text-left p-4 rounded-xl hover:bg-[#FDFBF7] flex items-center gap-3 font-bold transition-all"><Home size={18}/> Beranda Utama</button>
                <button onClick={() => {setIsCartOpen(true); setIsMenuOpen(false)}} className="w-full text-left p-4 rounded-xl hover:bg-[#FDFBF7] flex items-center gap-3 font-bold transition-all"><ShoppingCart size={18}/> Keranjang Pesanan</button>
                <button onClick={() => {setView('shop'); setIsMenuOpen(false); document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'})}} className="w-full text-left p-4 rounded-xl hover:bg-[#FDFBF7] flex items-center gap-3 font-bold transition-all"><Package size={18}/> Katalog Koleksi</button>
                <a href={`https://wa.me/${profile.phoneNumber}`} target="_blank" rel="noreferrer" className="w-full text-left p-4 rounded-xl hover:bg-[#FDFBF7] flex items-center gap-3 font-bold transition-all"><Phone size={18}/> Hubungi Kami</a>
              </div>
              <div className="border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8 flex flex-col justify-center">
                {!isLoggedIn ? (
                  <button onClick={() => {setIsLoginModalOpen(true); setIsMenuOpen(false)}} className="w-full p-4 rounded-xl bg-[#FDFBF7] text-[#A68966] flex items-center justify-center gap-3 font-bold border border-[#E8E2D9]"><LogIn size={18}/> Login Admin</button>
                ) : (
                  <div className="space-y-3">
                    <button onClick={() => {setView('admin'); setIsMenuOpen(false)}} className="w-full p-4 rounded-xl bg-[#4A443F] text-white flex items-center justify-center gap-3 font-bold hover:bg-black transition-all">
                      <LayoutDashboard size={18}/> Dashboard Kelola
                    </button>
                    <button onClick={() => {setIsLoggedIn(false); setView('shop')}} className="w-full p-4 rounded-xl text-red-500 flex items-center justify-center gap-3 font-bold hover:bg-red-50 transition-all">
                      <LogOut size={18}/> Logout
                    </button>
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
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-[#FDFBF7]">
              <h2 className="text-xl font-black text-[#4A443F] flex items-center gap-2">
                <ShoppingCart className="text-[#A68966]" /> Pesanan Saya
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#8B8276] opacity-40">
                  <ShoppingBag size={64} className="mb-4" />
                  <p className="font-medium text-lg">Keranjang masih kosong</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 p-4 bg-[#FDFBF7] rounded-2xl border border-[#E8E2D9] shadow-sm">
                    <img src={item.image} className="w-20 h-20 rounded-xl object-cover shadow-sm" alt={item.name} />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm leading-tight text-[#4A443F]">{item.name}</h4>
                      <p className="text-[#A68966] text-xs font-bold mt-1">{formatIDR(item.discount_price)}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center border border-[#E8E2D9] rounded-lg bg-white overflow-hidden">
                          <button onClick={() => setCart(cart.map(x => x.id === item.id ? {...x, qty: Math.max(1, x.qty-1)} : x))} className="px-2 py-1 hover:bg-gray-50 text-[#A68966] font-bold">-</button>
                          <span className="px-3 text-xs font-bold text-[#4A443F]">{item.qty}</span>
                          <button onClick={() => setCart(cart.map(x => x.id === item.id ? {...x, qty: x.qty+1} : x))} className="px-2 py-1 hover:bg-gray-50 text-[#A68966] font-bold">+</button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setCart(cart.filter(x => x.id !== item.id))} className="text-red-300 hover:text-red-500 self-start p-1 transition-colors"><Trash2 size={16}/></button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-8 border-t bg-[#FDFBF7]">
                <div className="flex justify-between mb-6 font-black text-xl text-[#4A443F]">
                  <span>Total Bayar</span>
                  <span>{formatIDR(cart.reduce((a, b) => a + (b.discount_price * b.qty), 0))}</span>
                </div>
                <button 
                  onClick={() => {
                    const text = cart.map(i => `- ${i.name} (x${i.qty})`).join('%0A');
                    window.open(`https://wa.me/${profile.phoneNumber}?text=Halo ${profile.shopName}, saya mau pesan produk berikut:%0A${text}%0A%0A*Total Estimasi: ${formatIDR(cart.reduce((a, b) => a + (b.discount_price * b.qty), 0))}*`, '_blank');
                  }} 
                  className="w-full bg-[#4A443F] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-95"
                >
                  Pesan via WhatsApp <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {view === 'shop' && (
          <div className="space-y-24 animate-in fade-in duration-700">
            {/* Hero Section */}
            <section id="hero" className="rounded-[3rem] bg-white border border-[#E8E2D9] p-10 md:p-20 flex flex-col md:flex-row items-center gap-16 shadow-sm overflow-hidden relative">
              <div className="flex-1 space-y-8 relative z-10">
                <h2 className="text-5xl md:text-7xl font-black leading-tight text-[#4A443F]">{profile.shopName}</h2>
                <p className="text-[#8B8276] text-xl leading-relaxed max-w-xl">{profile.description}</p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => document.getElementById('catalog').scrollIntoView({behavior:'smooth'})} 
                    className="bg-[#4A443F] text-white px-10 py-5 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center gap-2"
                  >
                    Mulai Belanja Sekarang <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 w-full">
                {advantages.map(adv => (
                  <div key={adv.id} className="p-8 bg-[#FDFBF7] rounded-[2rem] border border-[#E8E2D9] hover:border-[#A68966] transition-all group">
                    <div className="w-12 h-12 bg-[#A68966] rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-all">
                      <Star size={24}/>
                    </div>
                    <h4 className="font-black text-[#4A443F] text-lg mb-2">{adv.title}</h4>
                    <p className="text-sm text-[#8B8276] leading-relaxed">{adv.desc}</p>
                  </div>
                ))}
              </div>
              <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#D9C5B2]/10 rounded-full blur-3xl opacity-50"></div>
            </section>

            {/* Katalog Section */}
            <section id="catalog" className="space-y-12 scroll-mt-24">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 border-b border-[#E8E2D9] pb-10">
                <div className="text-center md:text-left">
                  <h3 className="text-4xl font-black text-[#4A443F] mb-2">Katalog Koleksi</h3>
                  <p className="text-[#8B8276]">Pilihan terbaik untuk melengkapi kebutuhan estetik Anda.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
                  {categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)} 
                      className={`px-7 py-3 rounded-full text-sm font-bold border transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-[#A68966] text-white border-[#A68966] shadow-lg shadow-[#A68966]/20' : 'bg-white text-[#8B8276] hover:border-[#A68966]'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Produk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-[#E8E2D9] group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 shadow-sm">
                    <div className="h-64 overflow-hidden relative">
                      <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-[#A68966] border border-[#E8E2D9] tracking-widest">
                          {p.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-8">
                      <h4 className="font-bold text-xl mb-1 text-[#4A443F] group-hover:text-[#A68966] transition-colors">{p.name}</h4>
                      <p className="text-[#8B8276] text-xs font-medium mb-6 uppercase tracking-wider italic">Stok: {p.stock || 0}</p>
                      <div className="flex flex-col mb-6">
                        <span className="text-sm text-gray-300 line-through font-bold">{formatIDR(p.original_price)}</span>
                        <span className="text-2xl font-black text-[#4A443F]">{formatIDR(p.discount_price)}</span>
                      </div>
                      <button 
                        onClick={() => addToCart(p)} 
                        className="w-full py-4 rounded-2xl bg-[#F3EFE9] text-[#4A443F] hover:bg-[#4A443F] hover:text-white flex items-center justify-center gap-3 font-black transition-all shadow-sm"
                      >
                        <Plus size={20}/> Tambah Pesanan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Testimoni Section */}
            <section className="bg-[#4A443F] rounded-[3.5rem] p-12 md:p-24 text-white text-center space-y-16 shadow-2xl relative overflow-hidden">
              <h3 className="text-4xl md:text-5xl font-black mb-4">Kata Pelanggan Kami</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-20">
                {testimonials.map(t => (
                  <div key={t.id} className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 flex flex-col justify-between hover:bg-white/20 transition-all">
                    <div>
                      <div className="flex gap-1 text-[#A68966] mb-6">
                        {[...Array(t.rating || 5)].map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
                      </div>
                      <p className="text-lg font-medium leading-relaxed mb-8 italic text-white/90">"{t.text}"</p>
                    </div>
                    <p className="font-black text-sm tracking-widest uppercase border-t border-white/10 pt-6">— {t.name}</p>
                  </div>
                ))}
                {testimonials.length === 0 && <p className="col-span-full text-center opacity-40">Belum ada testimoni terbaru.</p>}
              </div>
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl opacity-40"></div>
            </section>
          </div>
        )}

        {/* ADMIN VIEW */}
        {view === 'admin' && (
          <div className="flex flex-col lg:flex-row gap-10 animate-in slide-in-from-bottom-6 duration-700">
            <aside className="w-full lg:w-72 space-y-3 shrink-0">
              <div className="p-8 bg-[#A68966] text-white rounded-[2.5rem] mb-8 shadow-xl shadow-[#A68966]/20 text-center lg:text-left">
                <h4 className="font-black text-2xl text-white">Dashboard</h4>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 text-white">Admin Panel</p>
              </div>
              {[
                {id:'products', label:'Manajemen Produk', icon: Package},
                {id:'categories', label:'Atur Kategori', icon: Filter},
                {id:'testimonials', label:'Manajemen Testimoni', icon: MessageSquare},
                {id:'settings', label:'Profil & WhatsApp', icon: Settings}
              ].map(item => (
                <button 
                  key={item.id} onClick={() => setAdminSection(item.id)}
                  className={`w-full flex items-center gap-4 px-8 py-5 rounded-[1.5rem] font-bold text-sm transition-all ${adminSection === item.id ? 'bg-[#4A443F] text-white shadow-xl shadow-black/10' : 'bg-white border border-transparent hover:border-[#E8E2D9] text-[#8B8276] hover:text-[#4A443F]'}`}
                >
                  <item.icon size={20}/> {item.label}
                </button>
              ))}
              <div className="h-[1px] bg-[#E8E2D9] my-8"></div>
              <button onClick={() => {setIsLoggedIn(false); setView('shop')}} className="w-full flex items-center gap-4 px-8 py-5 rounded-[1.5rem] font-bold text-sm text-red-400 hover:bg-red-50 transition-all transition-colors">
                <LogOut size={20}/> Logout Dashboard
              </button>
            </aside>

            <div className="flex-1 space-y-8 min-h-[600px]">
              <div className="bg-white p-10 rounded-[3rem] border border-[#E8E2D9] shadow-sm">
                
                {adminSection === 'products' && (
                  <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center border-b border-[#FDFBF7] pb-8 gap-4">
                      <h3 className="text-2xl font-black text-[#4A443F]">Katalog Produk</h3>
                      <button 
                        onClick={() => setEditObj({ name:'', discount_price:0, original_price:0, category: categories[1], description:'', image:'', stock:1 })} 
                        className="bg-[#A68966] text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-[#8B7356] shadow-xl shadow-[#A68966]/20 transition-all active:scale-95"
                      >
                        <PlusCircle size={20}/> Tambah Baru
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {products.map(p => (
                        <div key={p.id} className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-[#FDFBF7] rounded-[2.5rem] border border-[#F3EFE9] hover:border-[#A68966] transition-all group shadow-sm">
                          <img src={p.image} className="w-24 h-24 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" alt="" />
                          <div className="flex-1 text-center sm:text-left">
                            <h4 className="font-bold text-lg text-[#4A443F]">{p.name}</h4>
                            <p className="text-sm font-bold text-[#A68966]">{formatIDR(p.discount_price)} <span className="text-gray-300 line-through ml-2 text-xs">{formatIDR(p.original_price)}</span></p>
                            <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">{p.category} • Stok {p.stock}</p>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => setEditObj(p)} className="p-4 text-blue-500 bg-white border border-[#E8E2D9] rounded-2xl hover:shadow-lg transition-all shadow-sm"><Edit3 size={18}/></button>
                            <button onClick={() => deleteProduct(p.id)} className="p-4 text-red-400 bg-white border border-[#E8E2D9] rounded-2xl hover:shadow-lg transition-all shadow-sm"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {editObj && (
                      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <div className="bg-white p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                          <h4 className="text-2xl font-black mb-8 border-b pb-6 text-[#4A443F]">Data Katalog</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <input className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] md:col-span-2 outline-none" placeholder="Nama Produk" value={editObj.name} onChange={e=>setEditObj({...editObj, name: e.target.value})} />
                            <input type="number" className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] outline-none" placeholder="Harga Jual" value={editObj.discount_price} onChange={e=>setEditObj({...editObj, discount_price: Number(e.target.value)})} />
                            <input type="number" className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] outline-none" placeholder="Harga Dicoret" value={editObj.original_price} onChange={e=>setEditObj({...editObj, original_price: Number(e.target.value)})} />
                            <select className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] outline-none" value={editObj.category} onChange={e=>setEditObj({...editObj, category: e.target.value})}>
                                {categories.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="number" className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] outline-none" placeholder="Stok" value={editObj.stock} onChange={e=>setEditObj({...editObj, stock: Number(e.target.value)})} />
                            <input className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] md:col-span-2 outline-none" placeholder="URL Gambar" value={editObj.image} onChange={e=>setEditObj({...editObj, image: e.target.value})} />
                            <textarea rows="3" className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] md:col-span-2 outline-none resize-none" placeholder="Deskripsi" value={editObj.description} onChange={e=>setEditObj({...editObj, description: e.target.value})} />
                          </div>
                          <div className="flex gap-4 mt-12">
                            <button onClick={() => saveProduct(editObj)} className="flex-1 bg-[#4A443F] text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-black/10 transition-all">Simpan Katalog</button>
                            <button onClick={() => setEditObj(null)} className="px-10 border border-[#E8E2D9] py-5 rounded-[1.5rem] font-bold hover:bg-[#FDFBF7]">Batal</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {adminSection === 'categories' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-black text-[#4A443F]">Atur Kategori</h3>
                    <div className="flex gap-4 mb-8">
                      <input id="newCat" placeholder="Tambah Kategori Baru..." className="flex-1 p-5 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] outline-none" />
                      <button onClick={() => {
                        const val = document.getElementById('newCat').value;
                        if(val && !categories.includes(val)) { setCategories([...categories, val]); document.getElementById('newCat').value = ''; }
                      }} className="bg-[#4A443F] text-white px-8 py-4 rounded-2xl font-black shadow-lg">Tambah</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {categories.map((c, i) => i !== 0 && (
                        <div key={i} className="flex items-center justify-between gap-4 px-6 py-4 bg-[#FDFBF7] border border-[#F3EFE9] rounded-2xl font-bold group shadow-sm">
                          <span>{c}</span>
                          <button onClick={() => setCategories(categories.filter(cat => cat !== c))} className="text-red-300 hover:text-red-500 transition-colors">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminSection === 'testimonials' && (
                  <div className="space-y-8">
                    <h3 className="text-2xl font-black text-[#4A443F]">Koleksi Testimoni</h3>
                    <div className="p-10 bg-[#FDFBF7] rounded-[2.5rem] border-2 border-dashed border-[#E8E2D9] space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        <input id="tName" placeholder="Nama Pelanggan" className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-white outline-none" />
                        <textarea id="tText" placeholder="Pesan Testimoni..." className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-white outline-none resize-none" rows="3" />
                        <button 
                          onClick={() => {
                            const n = document.getElementById('tName').value;
                            const t = document.getElementById('tText').value;
                            if(n && t) { saveTestimonial(n, t); document.getElementById('tName').value=''; document.getElementById('tText').value=''; }
                          }} 
                          className="bg-[#A68966] text-white py-5 rounded-[1.5rem] font-black shadow-lg shadow-[#A68966]/20 transition-all hover:bg-[#8B7356]"
                        >
                          Publish Testimoni
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {testimonials.map(t => (
                        <div key={t.id} className="p-6 bg-white border border-[#F3EFE9] rounded-[2rem] flex justify-between items-center group shadow-sm">
                          <div>
                            <p className="font-bold text-[#4A443F]">{t.name}</p>
                            <p className="text-sm text-[#8B8276] italic mt-1 leading-relaxed">"{t.text}"</p>
                          </div>
                          <button onClick={() => deleteTestimonial(t.id)} className="p-3 text-red-300 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminSection === 'settings' && (
                  <div className="space-y-10 max-w-2xl mx-auto">
                    <div className="flex justify-between items-center border-b border-[#FDFBF7] pb-8 gap-4">
                      <h3 className="text-2xl font-black text-[#4A443F]">Setelan Toko</h3>
                      <button onClick={saveProfile} className="bg-[#A68966] text-white px-10 py-4 rounded-[1.5rem] font-black shadow-xl shadow-[#A68966]/20 transition-all hover:bg-[#8B7356]">
                        <Save size={20}/> Update Data
                      </button>
                    </div>
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Nama UMKM</label>
                        <input className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-black text-xl text-[#4A443F]" value={profile.shopName} onChange={e => setProfile({...profile, shopName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px) font-black uppercase text-gray-400 tracking-[0.2em]">Nomor WA (Gunakan 62...)</label>
                        <div className="relative">
                           <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A68966]" size={18}/>
                           <input className="w-full p-5 pl-14 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] outline-none font-bold" value={profile.phoneNumber} onChange={e => setProfile({...profile, phoneNumber: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Slogan / Deskripsi Singkat</label>
                        <textarea rows="5" className="w-full p-5 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] outline-none resize-none font-medium" value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Lokasi / Alamat</label>
                        <div className="relative">
                           <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A68966]" size={18}/>
                           <input className="w-full p-5 pl-14 rounded-2xl border border-[#E8E2D9] bg-[#FDFBF7] outline-none" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-32 border-t border-[#E8E2D9] py-24 px-6 bg-white overflow-hidden relative text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 relative z-10">
          <div className="max-w-md space-y-6">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="bg-[#4A443F] p-2 rounded-xl"><Store className="text-white w-6 h-6" /></div>
              <span className="font-black text-2xl text-[#4A443F] uppercase tracking-tighter">{profile.shopName}</span>
            </div>
            <p className="text-[#8B8276] text-lg leading-relaxed">{profile.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-20 text-left">
            <div className="space-y-6">
              <h5 className="font-black text-xs uppercase tracking-[0.3em] text-[#A68966]">Menu Cepat</h5>
              <ul className="text-sm space-y-4 text-[#8B8276] font-bold">
                <li className="hover:text-[#4A443F] cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>Beranda</li>
                <li className="hover:text-[#4A443F] cursor-pointer" onClick={() => setIsCartOpen(true)}>Keranjang</li>
                <li className="hover:text-[#4A443F] cursor-pointer" onClick={() => setIsLoginModalOpen(true)}>Login Admin</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-xs uppercase tracking-[0.3em] text-[#A68966]">Toko Kami</h5>
              <div className="flex gap-4 text-sm font-bold text-[#8B8276]">
                <MapPin size={18} className="text-[#A68966] shrink-0" />
                <span>{profile.address || 'Yogyakarta, Indonesia'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-[#F3EFE9] text-[10px] font-black uppercase tracking-[0.3em] text-[#D9C5B2] flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2024 {profile.shopName}. Handcrafted in Indonesia 🇮🇩</p>
          <div className="flex items-center gap-4">
             <span className="cursor-pointer hover:text-[#4A443F]" onClick={() => setIsLoginModalOpen(true)}>Dashboard Admin</span>
             <span className="w-1 h-1 bg-[#D9C5B2] rounded-full"></span>
             <span>Sistem Template UMKM</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
