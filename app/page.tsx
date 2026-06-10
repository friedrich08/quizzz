'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!pseudo) return alert('Choisis un pseudo !');
    setLoading(true);
    try {
      const userId = uuidv4();
      localStorage.setItem('quizzz_userId', userId);
      localStorage.setItem('quizzz_pseudo', pseudo);

      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo, userId }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Erreur serveur");
      }

      const data = await res.json();
      if (data.code) {
        router.push(`/game/${data.code}?host=true`);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Erreur : ${error.message}`);
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!pseudo || !code) return alert('Pseudo et Code requis !');
    setLoading(true);
    try {
      const userId = uuidv4();
      localStorage.setItem('quizzz_userId', userId);
      localStorage.setItem('quizzz_pseudo', pseudo);

      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo, code, userId }),
      });

      const data = await res.json();
      if (res.ok && data.code) {
        router.push(`/game/${data.code}`);
      } else {
        alert(`Erreur : ${data.error || 'Problème de connexion'}`);
        setLoading(false);
      }
    } catch (error: any) {
      alert(`Erreur technique : ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2 italic">
            QUIZZZ
          </h1>
          <p className="text-gray-500 font-medium italic">Inspiré des 12 Coups de Midi</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Ton Pseudo..."
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 outline-none text-xl font-bold transition-all text-black"
          />

          <div className="pt-4 border-t border-gray-100 space-y-6">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'CHARGEMENT...' : 'CRÉER UNE PARTIE'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold tracking-widest">OU REJOINDRE</span></div>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Code à 6 chiffres"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 outline-none text-center text-2xl font-black tracking-[0.5em] transition-all text-black"
              />
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-black py-4 rounded-2xl text-xl transition-all active:scale-95 disabled:opacity-50"
              >
                REJOINDRE
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
