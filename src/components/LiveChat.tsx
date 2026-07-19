import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { classNames } from '../lib/format';

type Msg = { id: number; from: 'bot' | 'user'; text: string };

const QUICK = ['Track my order', 'Return policy', 'Shipping times', 'Talk to a human'];

function reply(input: string): string {
  const t = input.toLowerCase();
  if (t.includes('track')) return 'You can track any order from the Track Order page — just enter your order number (starts with MA-). Most orders ship within 24 hours and arrive in 2–5 business days.';
  if (t.includes('return')) return 'We offer 30-day hassle-free returns. Initiate a return from your order history and we will email a prepaid label once approved.';
  if (t.includes('ship')) return 'Free express shipping on orders over $75. Standard shipping is $12 and takes 3–5 business days; express is 1–2 days.';
  if (t.includes('human') || t.includes('agent') || t.includes('support')) return 'A support specialist will follow up by email within 1 business hour. In the meantime, is there anything else I can help with?';
  if (t.includes('coupon') || t.includes('discount') || t.includes('code')) return 'Active codes: WELCOME10 (10% off), SAVE25 ($25 off over $200), FREESHIP (free shipping). Apply them at checkout.';
  if (t.includes('payment')) return 'We accept credit/debit cards, digital wallets (Apple Pay, Google Pay), and cash on delivery in select regions. All payments are encrypted.';
  if (t.includes('hi') || t.includes('hello') || t.includes('hey')) return 'Hi there! I am Maison concierge. Ask me about orders, shipping, returns, or payments.';
  return 'Great question! For anything specific, our team at care@maison.shop will help. You can also browse the Help & FAQ in the footer.';
}

export function LiveChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 1, from: 'bot', text: 'Hi! I am the Maison concierge. How can I help you today?' },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const id = Date.now();
    setMsgs((m) => [...m, { id, from: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMsgs((m) => [...m, { id: id + 1, from: 'bot', text: reply(text) }]);
    }, 700);
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open live chat"
        className="fixed bottom-5 right-5 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lift transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-[90] flex h-[460px] w-[min(92vw,360px)] flex-col overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-lift animate-scale-in dark:border-ink-800 dark:bg-ink-950">
          <div className="flex items-center gap-3 bg-brand-600 p-4 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20"><Sparkles size={18} /></div>
            <div>
              <p className="text-sm font-semibold">Maison Concierge</p>
              <p className="text-xs text-brand-100">Typically replies instantly</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4 dark:bg-ink-900">
            {msgs.map((m) => (
              <div key={m.id} className={classNames('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={classNames(
                  'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm',
                  m.from === 'user'
                    ? 'rounded-br-sm bg-brand-600 text-white'
                    : 'rounded-bl-sm bg-white text-ink-800 shadow-soft dark:bg-ink-800 dark:text-ink-100',
                )}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="border-t border-ink-200 p-3 dark:border-ink-800">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)} className="chip border border-ink-200 text-ink-600 hover:border-brand-500 hover:text-brand-700 dark:border-ink-700 dark:text-ink-300">
                  {q}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                aria-label="Chat message"
                className="input flex-1"
              />
              <button type="submit" aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
