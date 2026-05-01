import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { MessageCircle, Check, Copy, Share2 } from "lucide-react";

interface Participant {
  id: string;
  name: string;
}

export default function Share() {
  const { id } = useParams();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/draw/${id}`)
      .then((res) => res.json())
      .then((data) => setParticipants(data.participants));
  }, [id]);

  const getRevealUrl = (participantId: string) => {
    return `${window.location.origin}/reveal/${id}/${participantId}`;
  };

  const shareOnWhatsApp = (participant: Participant) => {
    const url = getRevealUrl(participant.id);
    const text = encodeURIComponent(`Seu link do Amigo Oculto chegou! Clique para revelar: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setCopiedId(participant.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const copyLink = (participant: Participant) => {
    const url = getRevealUrl(participant.id);
    navigator.clipboard.writeText(url);
    setCopiedId(participant.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="space-y-12 pb-24">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-brand-text">Tudo Pronto!</h1>
        <p className="text-brand-text/60 font-medium">Compartilhe os links individuais via WhatsApp.</p>
      </header>

      <div className="space-y-4">
        {participants.map((p, index) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border-2 border-brand-text/5 p-4 rounded-2xl flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-lg">{p.name}</p>
              <p className="text-xs text-brand-text/30 font-medium font-mono uppercase tracking-widest">Link Pessoal</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyLink(p)}
                className={`p-3 rounded-xl transition-all ${
                  copiedId === p.id 
                  ? "bg-brand-secondary text-white" 
                  : "bg-brand-text/5 text-brand-text/60 hover:bg-brand-text/10"
                }`}
              >
                {copiedId === p.id ? <Check size={20} /> : <Copy size={20} />}
              </button>
              <button
                onClick={() => shareOnWhatsApp(p)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
                  copiedId === p.id
                    ? "bg-brand-secondary text-white shadow-brand-secondary/20"
                    : "bg-brand-text text-white shadow-brand-text/10"
                }`}
              >
                <MessageCircle size={20} />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <footer className="fixed bottom-12 left-0 right-0 px-6 max-w-lg mx-auto">
        <button
          onClick={() => window.location.href = "/"}
          className="w-full py-4 rounded-2xl font-bold text-brand-text/40 hover:text-brand-text transition-colors flex items-center justify-center gap-2"
        >
          <span>Criar novo sorteio</span>
        </button>
      </footer>
    </div>
  );
}
