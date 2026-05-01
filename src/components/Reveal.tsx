import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { Gift, Sparkles, AlertCircle } from "lucide-react";

interface RevealData {
  yourName: string;
  secretSanta: string;
  alreadyRevealed: boolean;
}

export default function Reveal() {
  const { drawId, participantId } = useParams();
  const [data, setData] = useState<RevealData | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reveal/${drawId}/${participantId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Link inválido ou sorteio finalizado.");
        return res.json();
      })
      .then((data) => setData(data))
      .catch((err) => setError(err.message));
  }, [drawId, participantId]);

  const handleReveal = () => {
    if (isRevealed) return;
    setIsRevealed(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#D90429", "#2B9348", "#F7F9F9", "#FFD700"],
    });
  };

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6 text-center">
        <div className="p-6 bg-brand-primary/10 rounded-full text-brand-primary">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold">{error}</h2>
        <p className="text-brand-text/60">Verifique o link com o organizador.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div
            key="hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center space-y-12"
          >
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text/40">Olá, {data.yourName}</span>
              <h1 className="text-3xl font-bold tracking-tight">Seu Amigo Oculto</h1>
            </div>

            <motion.button
              onClick={handleReveal}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-48 h-48 bg-white border-2 border-brand-text/5 rounded-[40px] shadow-2xl flex items-center justify-center text-brand-primary group hover:border-brand-primary/20 transition-all cursor-pointer"
            >
              <Gift size={80} strokeWidth={1.5} />
              <div className="absolute -inset-4 bg-brand-primary/5 rounded-[60px] blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>

            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg font-medium text-brand-text/60"
            >
              Toque para abrir
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="p-4 bg-brand-secondary/10 text-brand-secondary rounded-full inline-flex">
              <Sparkles size={32} />
            </div>

            <div className="space-y-4">
              <p className="text-xl font-medium text-brand-text/60 tracking-wide uppercase">Você tirou:</p>
              <h2 className="text-6xl font-reveal text-brand-primary italic py-4">
                {data.secretSanta}
              </h2>
            </div>

            <div className="pt-12">
              <div className="container mx-auto p-6 bg-white border-2 border-brand-text/5 rounded-3xl max-w-xs">
                <p className="text-xs font-bold text-brand-text/40 uppercase leading-relaxed">
                  {data.alreadyRevealed 
                    ? "Este link já foi visualizado anteriormente. Guarde o nome!" 
                    : "Shhh! Guarde segredo até o dia da revelação."}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => window.location.href = "/"}
              className="mt-12 text-sm font-bold text-brand-text/30 hover:text-brand-text transition-colors"
            >
              Criar meu próprio amigo oculto
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
