import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Sparkles } from "lucide-react";

export default function Home() {
  const [names, setNames] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const addName = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedName = currentName.trim();
    if (trimmedName && !names.includes(trimmedName)) {
      setNames([...names, trimmedName]);
      setCurrentName("");
    }
  };

  const removeName = (index: number) => {
    setNames(names.filter((_, i) => i !== index));
  };

  const handleDraw = async () => {
    if (names.length < 3) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
      });
      const data = await response.json();
      if (data.drawId) {
        navigate(`/draw/${data.drawId}`);
      }
    } catch (error) {
      console.error("Draw failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-brand-text">Amigo Oculto</h1>
        <p className="text-brand-text/60 font-medium">Organize seu sorteio em segundos.</p>
      </header>

      <div className="space-y-6">
        <form onSubmit={addName} className="relative">
          <input
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            placeholder="Digite um nome..."
            className="w-full bg-white border-2 border-brand-text/5 rounded-2xl px-6 py-5 text-lg font-medium focus:outline-none focus:border-brand-primary/20 transition-all placeholder:text-brand-text/20"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-brand-text/5 text-brand-text/40 rounded-xl hover:bg-brand-text/10 transition-colors"
          >
            <Plus size={24} />
          </button>
        </form>

        <div className="min-h-[200px] flex flex-wrap gap-2">
          <AnimatePresence>
            {names.map((name, index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="bg-white border-2 border-brand-text/5 px-4 py-2 rounded-xl flex items-center gap-2 group hover:border-brand-primary/10 transition-colors"
              >
                <span className="font-medium">{name}</span>
                <button
                  onClick={() => removeName(index)}
                  className="text-brand-text/20 hover:text-brand-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {names.length === 0 && (
            <p className="text-brand-text/20 italic self-center w-full text-center">Nenhum participante adicionado.</p>
          )}
        </div>
      </div>

      <footer className="fixed bottom-12 left-0 right-0 px-6 max-w-lg mx-auto">
        <button
          onClick={handleDraw}
          disabled={names.length < 3 || isLoading}
          className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-xl ${
            names.length >= 3
              ? "bg-brand-primary text-white hover:scale-[1.02] active:scale-[0.98] shadow-brand-primary/20"
              : "bg-brand-text/10 text-brand-text/30 cursor-not-allowed shadow-none"
          }`}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Sparkles size={24} />
            </motion.div>
          ) : (
            <>
              <Sparkles size={24} />
              <span>Realizar Sorteio</span>
            </>
          )}
        </button>
        {names.length > 0 && names.length < 3 && (
          <p className="text-center mt-4 text-sm font-medium text-brand-primary opacity-60">
            Adicione pelo menos 3 pessoas
          </p>
        )}
      </footer>
    </div>
  );
}
