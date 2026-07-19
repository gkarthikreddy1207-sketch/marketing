import { useState } from 'react';
import { ChevronDown, Mail, Phone, MapPin, HelpCircle } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { classNames } from '../lib/format';

const FAQS = [
  { q: 'How long does shipping take?', a: 'Standard shipping takes 3–5 business days; express is 1–2 days. Orders over $75 ship free. You will receive a tracking link by email once your order ships.' },
  { q: 'What is your return policy?', a: 'We offer 30-day hassle-free returns on unused items in original packaging. Initiate a return from your order history and we will email a prepaid label within 24 hours.' },
  { q: 'Which payment methods do you accept?', a: 'We accept credit and debit cards (Visa, Mastercard, Amex), digital wallets (Apple Pay, Google Pay), and cash on delivery in select regions. All payments are encrypted with 256-bit SSL.' },
  { q: 'Can I change or cancel my order?', a: 'Orders can be edited or cancelled within 1 hour of placing them. Go to your order history or contact support and we will help right away.' },
  { q: 'Do you ship internationally?', a: 'Yes, we ship to over 80 countries. Shipping costs and times vary by destination and are calculated at checkout.' },
  { q: 'Are my payment details secure?', a: 'Absolutely. We are PCI-DSS compliant and never store your full card number. All transactions are encrypted end-to-end.' },
];

const SECTIONS = [
  { id: 'about', title: 'About Maison', body: 'Maison is a premium marketplace curating electronics, home, fashion, and lifestyle goods from world-class brands. Our mission is to make beautifully designed products accessible to everyone, backed by exceptional service.' },
  { id: 'privacy', title: 'Privacy Policy', body: 'We respect your privacy. We collect only the information needed to fulfill orders and improve your experience. We never sell your data to third parties. You can request deletion of your account and data at any time by contacting care@maison.shop.' },
  { id: 'terms', title: 'Terms of Service', body: 'By using Maison you agree to use the service lawfully and not to misuse, reverse-engineer, or disrupt it. Prices and availability may change without notice. All sales are subject to our returns policy.' },
  { id: 'shipping', title: 'Shipping Policy', body: 'Free express shipping on orders over $75. Standard shipping is $12 (3–5 days); express is $17 (1–2 days). International rates calculated at checkout. We ship to 80+ countries.' },
  { id: 'returns', title: 'Returns & Refunds', body: '30-day returns on unused items in original packaging. Refunds issued to the original payment method within 5–7 business days of receiving the return. Clearance items are final sale.' },
  { id: 'contact', title: 'Contact', body: 'Email: care@maison.shop · Phone: +1 (800) 555-1234 · Address: 24 Market St, San Francisco, CA. Support hours: 24/7 via chat; phone Mon–Fri 9am–6pm PT.' },
];

export function PoliciesPage() {
  const [open, setOpen] = useState<number | null>(0);
  const { hash } = window.location;
  const activeId = hash.replace('#', '') || 'faq';

  return (
    <div className="container-page py-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Help & policies' }]} />
      <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">Help & policies</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800">{s.title}</a>
            ))}
            <a href="#faq" className="block rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800">FAQ</a>
          </nav>
        </aside>

        <div className="space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="font-display text-xl font-semibold">{s.title}</h2>
              <p className="mt-2 text-ink-600 dark:text-ink-300">{s.body}</p>
            </section>
          ))}

          <section id="faq" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><HelpCircle size={20} /> Frequently asked questions</h2>
            <div className="mt-4 space-y-2">
              {FAQS.map((f, i) => (
                <div key={i} className="rounded-2xl border border-ink-200 dark:border-ink-800">
                  <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-4 text-left">
                    <span className="font-medium">{f.q}</span>
                    <ChevronDown size={18} className={classNames('shrink-0 text-ink-400 transition-transform', open === i && 'rotate-180')} />
                  </button>
                  {open === i && <p className="px-4 pb-4 text-sm text-ink-600 dark:text-ink-300">{f.a}</p>}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-ink-200 p-6 dark:border-ink-800">
            <h2 className="font-display text-lg font-semibold">Get in touch</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <a href="mailto:care@maison.shop" className="flex items-center gap-3 rounded-xl bg-ink-50 p-4 dark:bg-ink-900"><Mail size={18} className="text-brand-600" /><div><p className="text-sm font-medium">Email</p><p className="text-xs text-ink-500">care@maison.shop</p></div></a>
              <a href="tel:+18005551234" className="flex items-center gap-3 rounded-xl bg-ink-50 p-4 dark:bg-ink-900"><Phone size={18} className="text-brand-600" /><div><p className="text-sm font-medium">Phone</p><p className="text-xs text-ink-500">+1 (800) 555-1234</p></div></a>
              <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-4 dark:bg-ink-900"><MapPin size={18} className="text-brand-600" /><div><p className="text-sm font-medium">Address</p><p className="text-xs text-ink-500">24 Market St, SF, CA</p></div></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
