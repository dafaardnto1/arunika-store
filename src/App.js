import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Trash2, Edit3, Phone, Store,
  X, ShoppingCart, Package, LayoutDashboard,
  Menu, MessageSquare, Home, LogIn, PlusCircle,
  ChevronRight, ArrowRight, ShoppingBag, Save, AlertCircle, Globe, 
  Upload, Loader2, Search, TrendingUp, Eye, Share2,
  Heart, Moon, Sun, Zap, BarChart3, Clock
} from 'lucide-react';

// --- KONFIGURASI DATABASE ---
const SUPABASE_URL = 'https://mqenyookxpcqpbhezvlt.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_d1ujW-SiX5aiLJDbVL5Yfw_kWoH7m6S'; 

const App = () => {
  // --- STATE UTAMA ---
  const [view, setView] = useState('shop'); 
  const [adminSection, setAdminSection] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Filtering, Sorting, Search
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy] = useState('latest'); 
  
  // Cart & Wishlist Logic
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); 
  
  // Supabase & Media
  const [supabase, setSupabase] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 

  // Custom Modal & Profile
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null });
  const [profile, setProfile] = useState({ 
    shopName: 'Arunika Craft & Co', 
    phoneNumber: '6281234567890', 
    description: 'Menghadirkan kehangatan karya tangan pengrajin lokal ke dalam rumah Anda.', 
    address: 'Yogyakarta, Indonesia',
    websiteTitle: 'Arunika Craft - Toko Kerajinan Lokal Terbaik',
    faviconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869636.png'
  });
  
  const [categories, setCategories] = useState(['Semua', 'Fashion', 'Home Living', 'Kuliner', 'Homemade']);
  const [testimonials, setTestimonials] = useState([]);
  const [products, setProducts] = useState([]);
  const [editObj, setEditObj] = useState(null);
  const [loginData, setLoginData] = useState({ user: '', pass: '' });

  // --- POPUP HANDLER ---
  const showAlert = useCallback((title, message, type = 'info') => {
    setModal({ show: true, title, message, type, onConfirm: null });
  }, []);

  const showConfirm = useCallback((title, message, onConfirm) => {
    setModal({ show: true, title, message, type: 'confirm', onConfirm });
  }, []);

  // --- SINKRONISASI METADATA ---
  useEffect(() => {
    document.title = profile.websiteTitle || profile.shopName;
  }, [profile]);

  // --- SUPABASE SETUP ---
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

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: p } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (p) setProducts(p);

      const { data: t } = await supabase.from('testimonials').select('*').order('id', { ascending: false });
      if (t) setTestimonials(t);

      const { data: pr } = await supabase.from('profile').select('*').eq('id', 1).single();
      if (pr) setProfile(prev => ({
        ...prev,
        shopName: pr.shop_name,
        phoneNumber: pr.phone_number,
        description: pr.description,
        address: pr.address,
        websiteTitle: pr.website_title || prev.websiteTitle,
        faviconUrl: pr.favicon_url || prev.faviconUrl
      }));
    } catch (err) { console.error("Data error:", err); }
  }, [supabase]);

  useEffect(() => { if (supabase) fetchData(); }, [supabase, fetchData]);

  // --- UPLOAD GAMBAR ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !supabase) return;
    setIsUploading(true);
    try {
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('product-images').upload(`uploads/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(`uploads/${fileName}`);
      setEditObj(prev => ({ ...prev, image: publicUrl }));
      showAlert('Berhasil', 'Gambar tersimpan di cloud.', 'success');
    } catch (err) {
      showAlert('Gagal', 'Pastikan bucket "product-images" diset Public.', 'error');
    } finally { setIsUploading(false); }
  };

  // --- FUNGSI ADMIN ---
  const saveProduct = async (obj) => {
    if (!supabase) return;
    if (!obj.image) return showAlert('Peringatan', 'Harap unggah gambar produk.', 'error');

    try {
      if (obj.id && typeof obj.id === 'number') {
        await supabase.from('products').update(obj).eq('id', obj.id);
      } else {
        const { id, ...newObj } = obj;
        await supabase.from('products').insert([newObj]);
      }
      fetchData();
      setEditObj(null);
      showAlert('Berhasil', 'Katalog telah diperbarui.', 'success');
    } catch (err) { showAlert('Gagal', 'Error menyimpan data.', 'error'); }
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
    if (!supabase) return;
    try {
      await supabase.from('profile').update({
        shop_name: profile.shopName,
        phone_number: profile.phoneNumber,
        description: profile.description,
        address: profile.address,
        website_title: profile.websiteTitle,
        favicon_url: profile.faviconUrl
      }).eq('id', 1);
      showAlert('Berhasil', 'Identitas website diperbarui.', 'success');
    } catch (err) { showAlert('Gagal', 'Gagal menyimpan profil.', 'error'); }
  };

  const saveTestimonial = async (name, text) => {
    if (!supabase) return;
    try {
      await supabase.from('testimonials').insert([{ name, text, rating: 5 }]);
      fetchData();
      showAlert('Berhasil', 'Testimoni dipublikasikan.', 'success');
    } catch (err) { showAlert('Gagal', 'Gagal menyimpan ulasan.', 'error'); }
  };

  const handleLogin = () => {
    if (loginData.user === 'arunika' && loginData.pass === 'arunika1234') {
      setIsLoggedIn(true);
      setIsLoginModalOpen(false);
      setView('admin');
      showAlert('Halo Admin!', 'Akses panel kontrol dibuka.', 'success');
    } else {
      showAlert('Gagal', 'Username atau Password salah.', 'error');
    }
  };

  // --- LOGIKA KERANJANG ---
  const applyVoucher = () => {
    if (voucherCode.toUpperCase() === 'ARUNIKA10') {
      setAppliedDiscount(10);
      showAlert('Voucher Berhasil!', 'Diskon 10% diterapkan.', 'success');
    } else {
      setAppliedDiscount(0);
      showAlert('Voucher Gagal', 'Kode tidak valid.', 'error');
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return showAlert('Maaf', 'Stok habis.', 'error');
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    setIsCartOpen(true);
    setSelectedProduct(null);
  };

  const toggleWishlist = (product) => {
    if (wishlist.find(p => p.id === product.id)) {
      setWishlist(wishlist.filter(p => p.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  // --- DATA PROCESSING ---
  const filteredProducts = useMemo(() => {
    let res = products.filter(p => (selectedCategory === 'Semua' || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sortBy === 'price-low') res.sort((a, b) => a.discount_price - b.discount_price);
    if (sortBy === 'price-high') res.sort((a, b) => b.discount_price - a.discount_price);
    return res;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const subtotal = cart.reduce((a, b) => a + (b.discount_price * b.qty), 0);
  const discountAmountValue = (subtotal * appliedDiscount) / 100;
  const grandTotal = subtotal - discountAmountValue;

  // --- UI HELPERS ---
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const sendWhatsApp = () => {
    const itemList = cart.map(i => `%0A- *${i.name}* (x${i.qty})`).join('');
    const message = `Halo Kak admin *${profile.shopName}*,%0ASaya mau pesan:${itemList}%0A%0A*Total Akhir:* ${formatIDR(grandTotal)}`;
    window.open(`https://wa.me/${profile.phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className={`${darkMode ? 'bg-[#1A1816] text-[#E8E2D9]' : 'bg-[#FDFBF7] text-[#4A443F]'} min-w-[1280px] overflow-x-auto font-sans transition-colors duration-500 min-h-screen relative`}>
      
      {/* FLOATING WHATSAPP */}
      <a href={`https://wa.me/${profile.phoneNumber}`} target="_blank" rel="noreferrer" className="fixed bottom-10 right-10 z-[100] bg-[#25D366] text-white p-5 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-3 group">
         <Phone size={28}/>
         <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap font-black uppercase text-xs tracking-widest">Tanya Admin</span>
      </a>

      {/* CUSTOM MODAL */}
      {modal.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`${darkMode ? 'bg-[#2A2825] border-white/10' : 'bg-white border-[#E8E2D9]'} p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl border text-center animate-in zoom-in-95`}>
             <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${modal.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}><AlertCircle size={32}/></div>
                <h3 className="text-xl font-black mb-2">{modal.title}</h3>
                <p className="text-sm opacity-60 mb-8">{modal.message}</p>
                <button onClick={() => setModal({ ...modal, show: false })} className="w-full py-4 rounded-xl font-bold bg-[#A68966] text-white shadow-lg">Lanjutkan</button>
             </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl">
           <div className={`${darkMode ? 'bg-[#2A2825]' : 'bg-white'} rounded-[4rem] w-full max-w-5xl shadow-2xl overflow-hidden flex animate-in slide-in-from-bottom-10`}>
              <div className="w-1/2 h-[650px] relative">
                 <img src={selectedProduct.image} className="w-full h-full object-cover" alt="" />
                 <button onClick={() => setSelectedProduct(null)} className="absolute top-8 left-8 bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/40"><X size={24}/></button>
              </div>
              <div className="w-1/2 p-20 flex flex-col justify-center">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <span className="text-[10px] font-black text-[#A68966] uppercase tracking-[0.4em]">{selectedProduct.category}</span>
                       <h2 className="text-5xl font-black tracking-tighter mt-2">{selectedProduct.name}</h2>
                    </div>
                    <button onClick={() => toggleWishlist(selectedProduct)} className={`p-4 rounded-2xl border ${wishlist.find(x => x.id === selectedProduct.id) ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-300'}`}><Heart size={24} fill={wishlist.find(x => x.id === selectedProduct.id) ? 'currentColor' : 'none'}/></button>
                 </div>
                 <div className="text-4xl font-black text-[#A68966] mb-8">{formatIDR(selectedProduct.discount_price)}</div>
                 <p className="text-lg opacity-60 mb-10 italic">"{selectedProduct.description}"</p>
                 <div className="flex gap-4 mb-10">
                    <div className="flex-1 p-5 rounded-3xl border border-gray-100 flex items-center justify-between">
                       <span className="text-xs font-black uppercase tracking-widest opacity-40">Stok Sedia</span>
                       <span className="font-black text-xl">{selectedProduct.stock}</span>
                    </div>
                    <button onClick={() => {
                        const text = `Cek produk ${selectedProduct.name} di ${profile.shopName}!`;
                        if(navigator.share) navigator.share({ title: selectedProduct.name, text, url: window.location.href });
                    }} className="p-5 rounded-3xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 transition-colors"><Share2 size={24}/></button>
                 </div>
                 <button onClick={() => addToCart(selectedProduct)} className="w-full py-8 rounded-[2.5rem] bg-[#4A443F] text-white font-black text-xl hover:bg-black transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-4">
                    <ShoppingCart size={24}/> Tambahkan Keranjang
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className={`sticky top-0 z-[110] transition-all border-b ${darkMode ? 'bg-[#1A1816]/90 border-white/5' : 'bg-white/90 border-[#E8E2D9]'} backdrop-blur-xl px-10 py-5`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5 group cursor-pointer" onClick={() => setView('shop')}>
             <div className="bg-[#4A443F] p-4 rounded-2xl group-hover:rotate-12 transition-transform"><Store className="text-white" size={24}/></div>
             <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none">{profile.shopName}</h1>
                <p className="text-[10px] font-black text-[#A68966] uppercase tracking-[0.2em] mt-1 italic">Indonesian Heritage</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setDarkMode(!darkMode)} className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>
                {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
             </button>
             <button onClick={() => setIsCartOpen(true)} className="relative p-4 rounded-2xl bg-[#F3EFE9] text-[#4A443F] hover:shadow-lg transition-all">
                <ShoppingCart size={20}/>
                {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">{cart.length}</span>}
             </button>
             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-4 rounded-2xl border hover:bg-gray-50 transition-all">
                {isMenuOpen ? <X size={20}/> : <Menu size={20}/>}
             </button>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className={`absolute top-full left-0 w-full p-10 shadow-2xl border-t animate-in slide-in-from-top ${darkMode ? 'bg-[#2A2825] border-white/5' : 'bg-white border-[#E8E2D9]'}`}>
             <div className="max-w-7xl mx-auto grid grid-cols-3 gap-10">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A68966] mb-6">Navigasi Utama</h4>
                   <button onClick={() => {setView('shop'); setIsMenuOpen(false)}} className="w-full text-left p-5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-4 font-black transition-all"><Home size={20}/> Home Landing</button>
                   <button onClick={() => {setIsCartOpen(true); setIsMenuOpen(false)}} className="w-full text-left p-5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-4 font-black transition-all"><ShoppingCart size={20}/> Keranjang Belanja</button>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A68966] mb-6">Koleksi Tersimpan</h4>
                   <div className="p-5 rounded-[2rem] border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                      <Heart size={32} className="text-red-400 mb-3"/>
                      <p className="text-xs font-black">{wishlist.length} Produk Favorit</p>
                   </div>
                </div>
                <div className="flex flex-col justify-center">
                   {!isLoggedIn ? (
                     <button onClick={() => {setIsLoginModalOpen(true); setIsMenuOpen(false)}} className="w-full py-6 rounded-3xl bg-[#4A443F] text-white font-black flex items-center justify-center gap-4"><LogIn size={20}/> Login Administrator</button>
                   ) : (
                     <div className="space-y-3">
                        <button onClick={() => {setView('admin'); setIsMenuOpen(false)}} className="w-full py-6 rounded-3xl bg-[#A68966] text-white font-black"><LayoutDashboard size={20} className="inline mr-3"/> Ke Dashboard</button>
                        <button onClick={() => {setIsLoggedIn(false); setView('shop')}} className="w-full py-6 text-red-500 font-black">Logout</button>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </nav>

      {/* CART SIDEBAR */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[150] flex justify-end">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
           <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ${darkMode ? 'bg-[#2A2825]' : 'bg-white'}`}>
              <div className="p-10 border-b border-gray-100 flex justify-between items-center">
                 <div>
                    <h2 className="text-3xl font-black tracking-tighter">Keranjang</h2>
                    <p className="text-[10px] font-black uppercase text-[#A68966] tracking-[0.2em]">{cart.length} Item Terpilih</p>
                 </div>
                 <button onClick={() => setIsCartOpen(false)}><X size={28}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6">
                 {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                       <ShoppingBag size={100} className="mb-6"/>
                       <p className="font-black uppercase tracking-widest">Kosong</p>
                    </div>
                 ) : (
                   cart.map(item => (
                     <div key={item.id} className={`flex gap-5 p-5 rounded-[2rem] border transition-all ${darkMode ? 'bg-white/5 border-white/5' : 'bg-[#FDFBF7] border-gray-100'} shadow-sm`}>
                        <img src={item.image} className="w-20 h-20 rounded-2xl object-cover shadow-lg" alt="" />
                        <div className="flex-1">
                           <h4 className="font-black text-sm">{item.name}</h4>
                           <p className="text-[#A68966] font-black text-xs mt-1">{formatIDR(item.discount_price)}</p>
                           <div className="flex items-center gap-3 mt-4">
                              <button onClick={() => setCart(cart.map(x => x.id === item.id ? {...x, qty: Math.max(1, x.qty-1)} : x))} className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center font-black">-</button>
                              <span className="w-8 text-center font-black text-xs">{item.qty}</span>
                              <button onClick={() => setCart(cart.map(x => x.id === item.id ? {...x, qty: x.qty+1} : x))} className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center font-black">+</button>
                              <button onClick={() => setCart(cart.filter(x => x.id !== item.id))} className="ml-auto text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                           </div>
                        </div>
                     </div>
                   ))
                 )}
              </div>
              {cart.length > 0 && (
                <div className={`p-10 rounded-t-[3rem] shadow-2xl border-t ${darkMode ? 'bg-white/5' : 'bg-[#FDFBF7]'}`}>
                   {/* VOUCHER INPUT */}
                   <div className="flex gap-2 mb-8">
                      <input 
                        placeholder="Kode: ARUNIKA10" 
                        className="flex-1 px-6 py-4 rounded-2xl border bg-transparent outline-none font-bold uppercase text-xs"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                      />
                      <button onClick={applyVoucher} className="px-6 bg-[#A68966] text-white rounded-2xl font-black text-xs uppercase tracking-widest">Gunakan</button>
                   </div>
                   <div className="space-y-3 mb-8">
                      <div className="flex justify-between text-sm opacity-60"><span>Subtotal</span><span>{formatIDR(subtotal)}</span></div>
                      {appliedDiscount > 0 && <div className="flex justify-between text-sm text-green-500 font-bold"><span>Diskon {appliedDiscount}%</span><span>-{formatIDR(discountAmountValue)}</span></div>}
                      <div className="flex justify-between font-black text-2xl pt-3 border-t"><span>Total</span><span className="text-[#A68966]">{formatIDR(grandTotal)}</span></div>
                   </div>
                   <button onClick={sendWhatsApp} className="w-full py-8 rounded-[2rem] bg-[#4A443F] text-white font-black text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all">
                      Kirim Pesanan WA <ArrowRight size={24}/>
                   </button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* MAIN VIEW */}
      <main className="max-w-7xl mx-auto px-10 py-10">
         
         {view === 'shop' && (
           <div className="space-y-40 animate-in fade-in duration-1000">
              {/* HERO SECTION */}
              <section className={`rounded-[4rem] p-24 flex items-center gap-24 relative overflow-hidden shadow-sm ${darkMode ? 'bg-[#2A2825]' : 'bg-white border border-[#E8E2D9]'}`}>
                 <div className="absolute top-0 right-0 w-1/2 h-full bg-[#A68966]/5 -skew-x-12 translate-x-1/4"></div>
                 <div className="flex-1 space-y-12 relative z-10">
                    <div className="inline-flex items-center gap-3 bg-[#A68966]/10 px-8 py-3 rounded-full text-[#A68966] font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
                       <Zap size={16}/> New Season Arrival
                    </div>
                    <h2 className="text-8xl font-black leading-[0.9] tracking-tighter relative">{profile.shopName}</h2>
                    <p className="text-2xl leading-relaxed opacity-60 max-w-xl italic border-l-8 border-[#A68966] pl-8">{profile.description}</p>
                    <div className="flex gap-6">
                       <button onClick={() => document.getElementById('catalog').scrollIntoView({behavior:'smooth'})} className="px-16 py-8 bg-[#4A443F] text-white rounded-[2.5rem] font-black text-xl hover:bg-black transition-all shadow-2xl flex items-center gap-4 group">
                          Jelajahi Sekarang <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform"/>
                       </button>
                    </div>
                 </div>
                 <div className="flex-1 grid grid-cols-2 gap-8 relative z-10">
                    <div className={`p-12 rounded-[3.5rem] shadow-xl ${darkMode ? 'bg-white/5 border border-white/5' : 'bg-[#FDFBF7] border border-gray-100'} transform rotate-3`}>
                       <BarChart3 size={40} className="text-[#A68966] mb-8"/>
                       <h4 className="text-2xl font-black mb-4 tracking-tighter">Kualitas Premium</h4>
                       <p className="text-sm opacity-50 font-medium leading-relaxed">Dibuat langsung oleh tangan-tangan terampil pengrajin lokal.</p>
                    </div>
                    <div className={`p-12 rounded-[3.5rem] shadow-xl ${darkMode ? 'bg-white/5 border border-white/5' : 'bg-[#FDFBF7] border border-gray-100'} transform -rotate-3 mt-12`}>
                       <Clock size={40} className="text-[#A68966] mb-8"/>
                       <h4 className="text-2xl font-black mb-4 tracking-tighter">Produksi Etis</h4>
                       <p className="text-sm opacity-50 font-medium leading-relaxed">Menghargai lingkungan dan memberdayakan komunitas.</p>
                    </div>
                 </div>
              </section>

              {/* KATALOG */}
              <section id="catalog" className="scroll-mt-24 space-y-16">
                 <div className="flex justify-between items-end border-b border-gray-200 pb-16">
                    <div>
                       <h3 className="text-7xl font-black tracking-tighter">Katalog Produk</h3>
                       <p className="text-[#A68966] font-black uppercase tracking-[0.4em] text-xs mt-4">Pilih produk favorit Anda ({filteredProducts.length})</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className={`relative group border ${darkMode ? 'border-white/10' : 'border-gray-200'} rounded-full`}>
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20" size={20}/>
                          <input 
                            placeholder="Cari..." 
                            className="pl-14 pr-8 py-5 rounded-full bg-transparent outline-none font-black text-sm w-64 focus:w-80 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {categories.map(cat => (
                       <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-12 py-5 rounded-full text-sm font-black border transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-[#A68966] text-white border-[#A68966] shadow-xl' : 'border-gray-200 opacity-40 hover:opacity-100'}`}>
                          {cat}
                       </button>
                    ))}
                 </div>

                 <div className="grid grid-cols-4 gap-12">
                    {filteredProducts.map(p => (
                       <div key={p.id} className={`group rounded-[3.5rem] overflow-hidden border border-transparent hover:border-[#A68966] transition-all duration-700 relative ${p.stock <= 0 ? 'opacity-50 grayscale' : ''}`}>
                          <div className="h-[450px] overflow-hidden relative">
                             <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt="" />
                             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-4">
                                <button onClick={() => setSelectedProduct(p)} className="p-5 bg-white rounded-full text-black hover:bg-[#A68966] hover:text-white transition-all transform translate-y-8 group-hover:translate-y-0"><Eye size={24}/></button>
                                {p.stock > 0 && <button onClick={() => addToCart(p)} className="p-5 bg-white rounded-full text-black hover:bg-[#A68966] hover:text-white transition-all transform translate-y-8 group-hover:translate-y-0 delay-100"><ShoppingCart size={24}/></button>}
                             </div>
                             {p.stock <= 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-black tracking-[0.5em] text-xs">STOK HABIS</div>}
                          </div>
                          <div className="p-10 text-center">
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-2 block">{p.category}</span>
                             <h4 className="text-2xl font-black mb-4 group-hover:text-[#A68966] transition-colors">{p.name}</h4>
                             <div className="flex flex-col items-center">
                                <span className="text-3xl font-black text-[#A68966]">{formatIDR(p.discount_price)}</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </section>

              {/* TESTIMONI */}
              <section className="bg-[#4A443F] rounded-[5rem] p-32 text-white relative overflow-hidden">
                 <div className="max-w-4xl mx-auto text-center space-y-20 relative z-10">
                    <h3 className="text-5xl font-black tracking-tighter uppercase mb-6">Cerita Mereka</h3>
                    <div className="grid grid-cols-2 gap-12 text-left">
                       {testimonials.slice(0, 2).map(t => (
                         <div key={t.id} className="bg-white/5 p-12 rounded-[3.5rem] border border-white/5">
                            <p className="text-xl font-medium leading-relaxed italic mb-8 opacity-80">"{t.text}"</p>
                            <span className="font-black uppercase tracking-widest text-xs opacity-40">— {t.name}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </section>
           </div>
         )}

         {/* ADMIN PANEL */}
         {view === 'admin' && (
           <div className="flex gap-16 animate-in slide-in-from-bottom-10 duration-1000">
              <aside className="w-80 shrink-0 space-y-4">
                 <div className="p-10 bg-[#A68966] text-white rounded-[3rem] shadow-xl">
                    <h4 className="text-3xl font-black tracking-tighter leading-none">Admin Area</h4>
                 </div>
                 <div className="space-y-2">
                    {[
                      {id:'overview', label:'Ringkasan Toko', icon: BarChart3},
                      {id:'products', label:'Manajemen Produk', icon: Package},
                      {id:'categories', label:'List Kategori', icon: Filter},
                      {id:'testimonials', label:'Koleksi Ulasan', icon: MessageSquare},
                      {id:'settings', label:'Identitas Website', icon: Globe}
                    ].map(item => (
                      <button key={item.id} onClick={() => setAdminSection(item.id)} className={`w-full flex items-center gap-5 px-10 py-6 rounded-[2.5rem] font-black text-sm transition-all border-2 ${adminSection === item.id ? 'bg-[#4A443F] border-[#4A443F] text-white shadow-xl' : 'bg-transparent border-transparent hover:border-gray-200'}`}>
                         <item.icon size={22}/> {item.label}
                      </button>
                    ))}
                 </div>
                 <button onClick={() => {setIsLoggedIn(false); setView('shop')}} className="w-full text-red-500 font-black py-6 mt-10 hover:bg-red-50 rounded-full transition-all">Logout Administrator</button>
              </aside>

              <div className={`flex-1 p-16 rounded-[4rem] shadow-sm border ${darkMode ? 'bg-[#2A2825] border-white/5' : 'bg-white border-gray-100'} min-h-screen`}>
                 
                 {adminSection === 'overview' && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       <h3 className="text-4xl font-black tracking-tighter">Ringkasan Toko</h3>
                       <div className="grid grid-cols-3 gap-10">
                          <div className="p-10 rounded-[3rem] bg-[#FDFBF7] dark:bg-white/5 border border-gray-100 dark:border-white/5 relative group">
                             <TrendingUp size={80} className="absolute -right-4 -bottom-4 opacity-5"/>
                             <h5 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-4">Total Katalog</h5>
                             <p className="text-7xl font-black">{products.length}</p>
                          </div>
                       </div>
                    </div>
                 )}

                 {adminSection === 'products' && (
                   <div className="space-y-12 animate-in fade-in duration-500">
                      <div className="flex justify-between items-center border-b pb-10">
                         <h3 className="text-4xl font-black tracking-tighter">Manajemen Produk</h3>
                         <button onClick={() => setEditObj({ name:'', discount_price:0, original_price:0, category: categories[1], description:'', image: null, stock:1 })} className="bg-[#A68966] text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-4 shadow-xl"><PlusCircle size={24}/> Tambah Baru</button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         {products.map(p => (
                           <div key={p.id} className="p-8 rounded-[3rem] bg-[#FDFBF7] dark:bg-white/5 border border-transparent hover:border-[#A68966] transition-all flex items-center gap-10">
                              <img src={p.image} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-lg" alt="" />
                              <div className="flex-1">
                                 <h4 className="font-black text-xl">{p.name}</h4>
                                 <div className="flex items-center gap-4 mt-2">
                                    <span className="font-black text-[#A68966] text-lg">{formatIDR(p.discount_price)}</span>
                                    <span className={`text-[10px] font-black uppercase ${p.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>Stok: {p.stock}</span>
                                 </div>
                              </div>
                              <div className="flex gap-4">
                                 <button onClick={() => setEditObj(p)} className="p-4 text-blue-500 bg-white border rounded-2xl shadow-sm"><Edit3 size={20}/></button>
                                 <button onClick={() => handleDeleteProduct(p.id)} className="p-4 text-red-400 bg-white border rounded-2xl shadow-sm"><Trash2 size={20}/></button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}

                 {adminSection === 'categories' && (
                  <div className="space-y-12">
                    <h3 className="text-4xl font-black tracking-tighter">Atur Kategori</h3>
                    <div className="flex gap-6 p-10 bg-[#FDFBF7] rounded-[3rem]">
                      <input id="newCat" placeholder="Kategori baru..." className="flex-1 p-6 rounded-[2rem] border outline-none font-bold" />
                      <button onClick={() => {
                        const val = document.getElementById('newCat').value;
                        if(val && !categories.includes(val)) { setCategories([...categories, val]); document.getElementById('newCat').value = ''; }
                      }} className="bg-[#4A443F] text-white px-12 py-6 rounded-[2rem] font-black shadow-xl">Tambah</button>
                    </div>
                  </div>
                 )}

                 {adminSection === 'testimonials' && (
                  <div className="space-y-12">
                    <h3 className="text-4xl font-black tracking-tighter">Ulasan</h3>
                    <div className="p-16 bg-[#FDFBF7] rounded-[4rem] border-2 border-dashed space-y-10">
                      <input id="tName" placeholder="Nama Pelanggan" className="w-full p-6 rounded-[2rem] border" />
                      <textarea id="tText" placeholder="Pesan..." className="w-full p-8 rounded-[2.5rem] border" rows="4" />
                      <button onClick={() => {
                          const n = document.getElementById('tName').value;
                          const t = document.getElementById('tText').value;
                          if(n && t) { saveTestimonial(n, t); document.getElementById('tName').value=''; document.getElementById('tText').value=''; }
                        }} className="bg-[#A68966] text-white py-7 rounded-[2.5rem] font-black w-full">Kirim</button>
                    </div>
                  </div>
                 )}

                 {editObj && (
                   <div className="fixed inset-0 z-[250] flex items-center justify-center p-10 bg-black/60 backdrop-blur-md">
                      <div className={`${darkMode ? 'bg-[#2A2825]' : 'bg-white'} p-16 rounded-[4rem] w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
                         <div className="flex justify-between items-center mb-12 border-b pb-8">
                            <h4 className="text-3xl font-black tracking-tighter">Editor Produk</h4>
                            <button onClick={() => setEditObj(null)}><X size={32}/></button>
                         </div>
                         <div className="grid grid-cols-2 gap-8">
                            <div className="col-span-2 space-y-2">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-widest">Nama Produk</label>
                               <input className="w-full p-6 rounded-[2rem] border bg-[#FDFBF7] dark:bg-white/5 outline-none font-bold" value={editObj.name} onChange={e=>setEditObj({...editObj, name: e.target.value})} />
                            </div>
                            <div className="col-span-2 space-y-2">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-widest">Foto Produk</label>
                               <div className="p-10 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center">
                                  {isUploading ? <Loader2 className="animate-spin text-[#A68966]" size={40}/> : editObj.image ? (
                                    <div className="flex items-center gap-6"><img src={editObj.image} className="w-24 h-24 rounded-2xl object-cover" alt="" /><button onClick={()=>setEditObj({...editObj, image:null})} className="text-xs font-black text-red-500 underline">Ganti</button></div>
                                  ) : (
                                    <label className="cursor-pointer flex flex-col items-center">
                                       <Upload size={32} className="opacity-20 mb-2"/>
                                       <span className="text-sm font-black opacity-40">Pilih File</span>
                                       <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                  )}
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-widest">Harga Jual</label>
                               <input type="number" className="w-full p-6 rounded-[2rem] border bg-[#FDFBF7] dark:bg-white/5 outline-none font-black" value={editObj.discount_price} onChange={e=>setEditObj({...editObj, discount_price: Number(e.target.value)})} />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-widest">Stok</label>
                               <input type="number" className="w-full p-6 rounded-[2rem] border bg-[#FDFBF7] dark:bg-white/5 outline-none font-bold" value={editObj.stock} onChange={e=>setEditObj({...editObj, stock: Number(e.target.value)})} />
                            </div>
                         </div>
                         <div className="flex gap-4 mt-12">
                            <button onClick={() => saveProduct(editObj)} className="flex-1 py-8 rounded-[2.5rem] bg-[#4A443F] text-white font-black text-xl hover:bg-black" disabled={isUploading}><Save size={24} className="inline mr-2"/> Simpan Data</button>
                            <button onClick={() => setEditObj(null)} className="px-12 py-8 rounded-[2.5rem] border font-black text-xl">Batal</button>
                         </div>
                      </div>
                   </div>
                 )}

                 {adminSection === 'settings' && (
                    <div className="space-y-16">
                       <div className="flex justify-between items-center border-b pb-10">
                          <h3 className="text-4xl font-black tracking-tighter">Identitas Website</h3>
                          <button onClick={saveProfile} className="bg-[#A68966] text-white px-10 py-5 rounded-[2rem] font-black shadow-xl"><Save size={24} className="inline mr-2"/> Simpan Perubahan</button>
                       </div>
                       <div className="grid grid-cols-2 gap-10">
                          <div className="space-y-3 col-span-2">
                             <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-widest">Judul Web</label>
                             <input className="w-full p-8 rounded-[2.5rem] border bg-[#FDFBF7] dark:bg-white/5 outline-none font-black text-2xl" value={profile.websiteTitle} onChange={e=>setProfile({...profile, websiteTitle: e.target.value})} />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase opacity-40 ml-4 tracking-widest">WhatsApp</label>
                             <input className="w-full p-8 rounded-[2.5rem] border bg-[#FDFBF7] dark:bg-white/5 outline-none font-black text-xl" value={profile.phoneNumber} onChange={e=>setProfile({...profile, phoneNumber: e.target.value})} />
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
         )}
      </main>

      {/* FOOTER */}
      <footer className={`mt-64 border-t py-40 px-10 relative overflow-hidden ${darkMode ? 'bg-[#1A1816] border-white/5' : 'bg-white border-[#E8E2D9]'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center relative z-10">
           <div className="space-y-12">
              <div className="flex items-center gap-6">
                 <div className="bg-[#4A443F] p-5 rounded-3xl"><Store className="text-white" size={32}/></div>
                 <h5 className="text-5xl font-black tracking-tighter uppercase">{profile.shopName}</h5>
              </div>
              <p className="text-2xl font-medium opacity-60 leading-relaxed max-w-md">{profile.description}</p>
           </div>
           <button onClick={() => setIsLoginModalOpen(true)} className="text-xs font-black opacity-20 uppercase tracking-[0.4em]">Admin Panel</button>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`${darkMode ? 'bg-[#2A2825] border-white/5' : 'bg-white border-[#E8E2D9]'} p-12 rounded-[3.5rem] w-full max-w-sm shadow-2xl border`}>
            <div className="text-center mb-10">
               <h2 className="text-3xl font-black tracking-tighter">Admin Login</h2>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Username" className="w-full p-5 rounded-2xl border bg-transparent outline-none font-bold" onChange={(e) => setLoginData({...loginData, user: e.target.value})} />
              <input type="password" placeholder="Password" className="w-full p-5 rounded-2xl border bg-transparent outline-none font-bold" onChange={(e) => setLoginData({...loginData, pass: e.target.value})} />
              <button onClick={handleLogin} className="w-full bg-[#4A443F] text-white py-6 rounded-2xl font-black text-lg mt-6 hover:bg-black">Masuk Dashboard</button>
              <button onClick={() => setIsLoginModalOpen(false)} className="w-full text-xs font-black opacity-40 mt-4 uppercase tracking-widest">Kembali</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
