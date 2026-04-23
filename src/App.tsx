/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MapPin, 
  Sprout, 
  History, 
  ChevronRight, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  User as UserIcon,
  Leaf,
  LayoutGrid,
  Settings,
  ArrowRight,
  ArrowLeft,
  Camera,
  RefreshCcw,
  Check,
  X,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CameraScan } from './components/CameraScan';
import { diagnosePlant, DiagnosisResult } from './services/gemini';
import { db } from './lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';

// --- Types ---
interface Field {
  id: string;
  name: string;
  location?: string;
  size?: string;
  cropType?: string;
  createdAt: any;
}

interface ScanData extends DiagnosisResult {
  id: string;
  imageUrl: string;
  createdAt: any;
}

// --- Components ---

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="h-16 md:h-20 bg-white border-b border-agri-border flex items-center justify-between px-4 md:px-8 shrink-0 relative z-30">
      <div className="flex flex-col">
        <h1 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
          {user?.displayName ? `Ferme de ${user.displayName.split(' ')[0]}` : 'Ma Ferme'}
        </h1>
        <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Zone de Diagnostic • IA</p>
      </div>
      
      {user && (
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-medium">{user.displayName}</p>
            <p className="text-xs text-agri-primary">Artisan Agriculteur</p>
          </div>
          <button 
            onClick={logout}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-agri-secondary flex items-center justify-center text-agri-primary hover:bg-agri-primary hover:text-white transition-all shadow-sm"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      )}
    </header>
  );
}

function Sidebar({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-20 bg-white border-r border-agri-border flex-col items-center py-8 gap-10 shrink-0">
        <div className="w-10 h-10 bg-agri-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">A</div>
        <nav className="flex flex-col gap-8">
          <button 
            onClick={() => onTabChange('fields')}
            className={cn(
              "p-3 rounded-lg transition-all",
              activeTab === 'fields' ? "bg-agri-secondary text-agri-primary" : "text-gray-400 hover:text-agri-primary"
            )}
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
          <button 
            className="p-3 text-gray-400 hover:text-agri-primary transition-colors"
            title="Analyses (bientôt)"
          >
            <Camera className="w-6 h-6" />
          </button>
          <button 
            className="p-3 text-gray-400 hover:text-agri-primary transition-colors"
            title="Statistiques (bientôt)"
          >
            <Activity className="w-6 h-6" />
          </button>
        </nav>
        <div className="mt-auto mb-4 p-3 text-gray-400 hover:text-agri-primary cursor-pointer">
          <Settings className="w-6 h-6" />
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-agri-border flex items-center justify-around px-6 z-40 bg-white/80 backdrop-blur-md">
        <button 
          onClick={() => onTabChange('fields')}
          className={cn(
            "p-2 rounded-xl transition-all flex flex-col items-center gap-1",
            activeTab === 'fields' ? "text-agri-primary" : "text-gray-400"
          )}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Champs</span>
        </button>
        <button 
          className="p-2 text-gray-400 flex flex-col items-center gap-1"
        >
          <Camera className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Scanner</span>
        </button>
        <button 
          className="p-2 text-gray-400 flex flex-col items-center gap-1"
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Stats</span>
        </button>
        <button 
          className="p-2 text-gray-400 flex flex-col items-center gap-1"
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase">Profil</span>
        </button>
      </nav>
    </>
  );
}

function Landing() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-agri-bg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-20 -left-20 w-80 h-80 bg-agri-primary rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl z-10"
      >
        <div className="mx-auto w-16 h-16 bg-agri-primary rounded-2xl flex items-center justify-center text-white shadow-2xl mb-6 md:mb-8 font-bold text-2xl">A</div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-gray-800">
          AgriScanner IA
        </h2>
        <p className="text-base md:text-lg text-gray-500 mb-8 md:mb-10 leading-relaxed max-w-[280px] sm:max-w-sm mx-auto">
          Gestion minimaliste et diagnostic intelligent pour l'agriculture moderne.
        </p>

        <button 
          onClick={signIn}
          className="bg-agri-primary text-white px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-bold text-base md:text-lg flex items-center gap-3 mx-auto shadow-xl shadow-agri-primary/20 hover:scale-105 transition-all w-full sm:w-auto justify-center"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Se connecter avec Google
        </button>
      </motion.div>
    </div>
  );
}

function FieldCard({ field, onClick }: { field: Field, onClick: () => void }) {
  return (
    <motion.div 
      layout
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-agri-secondary rounded-2xl flex items-center justify-center text-agri-primary group-hover:bg-agri-primary group-hover:text-white transition-all">
          <Sprout className="w-6 h-6" />
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-agri-primary transition-colors" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{field.name}</h3>
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Localisation</p>
        <p className="text-xs font-semibold text-gray-600 mb-3">{field.location || 'Zone non définie'}</p>
        
        <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] font-bold text-agri-primary uppercase">
          <span>Ouvrir le champ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
}

function DiagnosisBadge({ status }: { status: ScanData['status'] }) {
  const configs = {
    healthy: { dot: 'bg-green-500', text: 'Vigoureux', textColor: 'text-green-600' },
    warning: { dot: 'bg-orange-500', text: 'Stress', textColor: 'text-orange-600' },
    diseased: { dot: 'bg-red-500', text: 'Pathogène', textColor: 'text-red-600' },
  };
  const config = configs[status];

  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full", config.dot)} />
      <span className={cn("text-xs font-bold uppercase tracking-wider", config.textColor)}>
        {config.text}
      </span>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');
  const [newFieldName, setNewFieldName] = useState('');

  // Fetch fields
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'fields'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setFields(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Field)));
    });
  }, [user]);

  // Fetch scans
  useEffect(() => {
    if (!user || !selectedField) return;
    const q = query(
      collection(db, 'users', user.uid, 'fields', selectedField.id, 'scans'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setScans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScanData)));
    });
  }, [user, selectedField]);

  const addField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFieldName.trim()) return;
    await addDoc(collection(db, 'users', user.uid, 'fields'), {
      name: newFieldName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setNewFieldName('');
    setShowAddField(false);
  };

  const handleScanCapture = async (base64: string) => {
    if (!user || !selectedField) return;
    setIsScanning(false);
    setIsDiagnosing(true);

    try {
      const result = await diagnosePlant(base64);
      
      await addDoc(collection(db, 'users', user.uid, 'fields', selectedField.id, 'scans'), {
        ...result,
        imageUrl: `data:image/jpeg;base64,${base64}`,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      let message = "Une erreur est survenue lors du diagnostic.";
      
      if (err?.message?.includes("insufficient permissions")) {
        message = "Erreur de stockage : Permission refusée. Veuillez contacter le support.";
      } else if (err?.message?.includes("API key")) {
        message = "Erreur IA : La clé API n'est pas configurée correctement.";
      }
      
      alert(message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-agri-bg">
        <Loader2 className="w-10 h-10 text-agri-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Landing />;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-agri-bg overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {!selectedField ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-6xl mx-auto"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-10 gap-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Tableau de Bord</h2>
                    <p className="text-sm text-gray-500">Gérez vos {fields.length} zones de culture actives</p>
                  </div>
                  <button 
                    onClick={() => setShowAddField(true)}
                    className="bg-agri-primary text-white h-12 md:h-12 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-agri-primary/20 hover:scale-105 active:scale-95 transition-all font-bold w-full sm:w-auto"
                  >
                    <Plus className="w-5 h-5" />
                    NOUVEAU CHAMP
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                  {fields.map(field => (
                    <FieldCard 
                      key={field.id} 
                      field={field} 
                      onClick={() => setSelectedField(field)} 
                    />
                  ))}
                  
                  {fields.length === 0 && (
                    <div className="col-span-full py-20 md:py-32 text-center bg-white border border-dashed border-gray-200 rounded-[2.5rem] px-6">
                      <div className="w-16 h-16 bg-agri-secondary text-agri-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sprout className="w-8 h-8" />
                      </div>
                      <p className="text-gray-500 font-medium max-w-xs mx-auto text-sm md:text-base">Votre ferme est vide. Commencez par ajouter votre premier champ d'action.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="field-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-6xl mx-auto"
              >
                <div className="flex flex-col shrink-0 gap-6 mb-8 md:mb-10">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedField(null)}
                      className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-white transition-all shadow-sm shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">{selectedField.name}</h2>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Historique & Diagnostic IA</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsScanning(true)}
                    className="bg-agri-primary text-white h-14 md:h-12 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-agri-primary/20 hover:scale-105 active:scale-95 transition-all font-bold w-full"
                  >
                    <Camera className="w-5 h-5" />
                    SCANNER LA PLANTE
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 min-h-0">
                  {/* Left Column - Diagnostic Summary */}
                  <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <div className="w-10 h-10 bg-agri-secondary rounded-full flex items-center justify-center text-agri-primary">
                          <Activity className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <h3 className="font-bold text-lg md:text-xl text-gray-800">Résumé du Champ</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="p-4 md:p-5 bg-agri-bg rounded-2xl border border-gray-50">
                          <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1 md:mb-2 text-center sm:text-left">Total Scans</p>
                          <p className="text-2xl md:text-3xl font-bold text-agri-ink text-center sm:text-left">{scans.length}</p>
                        </div>
                        <div className="p-4 md:p-5 bg-agri-bg rounded-2xl border border-gray-50">
                          <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1 md:mb-2 text-center sm:text-left">Santé Moy.</p>
                          <p className="text-2xl md:text-3xl font-bold text-green-600 text-center sm:text-left">
                            {scans.length > 0 ? (scans[0].status === 'healthy' ? '92%' : '65%') : '--'}
                          </p>
                        </div>
                      </div>

                      {scans.length > 0 && (
                        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-50 space-y-6">
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 status-dot shrink-0"></div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-800">État : {scans[0].status === 'healthy' ? 'Vigoureux' : 'À surveiller'}</h4>
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                {scans[0].diagnosis}
                              </p>
                            </div>
                          </div>
                          
                          <div className="p-5 bg-agri-secondary rounded-[2rem] border border-agri-primary/10">
                            <p className="text-[10px] font-bold text-agri-primary uppercase mb-2 tracking-widest leading-none">Recommandation Immédiate</p>
                            <div className="text-xs text-agri-primary leading-relaxed">
                              <ReactMarkdown>{scans[0].recommendations}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - History Feed */}
                  <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                    <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Flux d'Analyses</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4 md:gap-6 pb-4">
                      {scans.map((scan) => (
                        <motion.div 
                          key={scan.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-[2rem] border border-gray-50 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col xl:flex-row group"
                        >
                          <div className="w-full xl:w-48 aspect-video sm:aspect-square relative overflow-hidden bg-gray-100 shrink-0">
                            <img src={scan.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Scan" />
                            <div className="absolute top-4 left-4">
                              <DiagnosisBadge status={scan.status} />
                            </div>
                          </div>
                          <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  {scan.createdAt?.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] font-bold text-gray-300">
                                  {scan.createdAt?.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-gray-700 line-clamp-3 md:line-clamp-2 leading-relaxed">
                                {scan.diagnosis}
                              </p>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-agri-primary font-bold text-[10px] uppercase tracking-widest">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">IA AgriScanner active</span>
                                <span className="sm:hidden">IA Active</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-agri-primary transition-colors" />
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {scans.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-white border border-dashed border-gray-100 rounded-[2rem] md:rounded-[2.5rem]">
                          <Camera className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-400 text-sm italic">Aucun scan réalisé pour cette parcelle.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="hidden md:flex h-12 px-8 flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-50 bg-white shrink-0">
          <div className="flex gap-6 font-bold tracking-widest uppercase">
            <span>© 2026 AgriScanner Platform</span>
            <span>Système: <span className="text-green-500">Opérationnel</span></span>
          </div>
          <div>
            <span className="font-bold text-gray-300 uppercase tracking-widest">Utilisateur: {user.displayName}</span>
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {showAddField && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-agri-ink/30 backdrop-blur-md flex items-center justify-center p-4 md:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-white"
            >
              <h3 className="text-xl md:text-2xl font-bold mb-2 text-agri-ink">Nouveau Champ</h3>
              <p className="text-gray-500 text-xs md:text-sm mb-6 md:mb-8">Définissez une nouvelle zone de diagnostic agricole.</p>
              
              <form onSubmit={addField} className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Désignation</label>
                  <input 
                    type="text" 
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Ex: Parcelle Nord Alpha"
                    className="w-full bg-agri-bg border border-gray-100 rounded-2xl px-5 md:px-6 py-3.5 md:py-4 focus:outline-none focus:border-agri-primary transition-all font-medium text-agri-ink text-sm md:text-base"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 md:gap-4 pt-2 md:pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddField(false)}
                    className="flex-1 px-4 py-3.5 md:py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm md:text-base transition-colors hover:bg-gray-200"
                  >
                    FERMER
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3.5 md:py-4 rounded-2xl bg-agri-primary text-white font-bold text-sm md:text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-agri-primary/20"
                  >
                    CRÉER
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {isScanning && (
          <CameraScan 
            onCapture={handleScanCapture}
            onClose={() => setIsScanning(false)}
          />
        )}

        {isDiagnosing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative mb-10 scale-150">
              <Loader2 className="w-12 h-12 text-agri-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-agri-primary" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4 tracking-tight">Analyse Gemini Vision</h3>
            <p className="text-gray-500 max-w-sm font-medium leading-relaxed">
              Nous traitons les données visuelles de la plante pour extraire un diagnostic précis et des prédictions de croissance.
            </p>
            <div className="mt-8 flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-agri-primary animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-agri-primary animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-agri-primary animate-bounce"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

