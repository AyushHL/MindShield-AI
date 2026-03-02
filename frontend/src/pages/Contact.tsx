// Dashboard Contact Page
import React, { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const faqs = [
  { q: 'How does the AI model detect suicidal ideation?', a: 'The platform uses a Bi-LSTM deep learning model trained on labelled crisis text datasets. It analyses semantic and contextual patterns to classify content into risk categories.' },
  { q: 'What are the three risk levels?', a: '"No Risk" (0–25) indicates no crisis signals. "Potential Risk" (26–69) suggests concerning language. "High Risk – Urgent" (70–100) indicates immediate crisis indicators.' },
  { q: 'What file formats can I upload?', a: 'The platform supports plain text input, PDF documents, and Microsoft Word (.docx) files. Content is processed securely.' },
  { q: 'Is the data stored permanently?', a: 'Prediction results may be logged to your account history. Raw text is not retained beyond the analysis session.' },
  { q: 'How accurate is the Bi-LSTM model?', a: 'The model was trained and validated as part of a B.Tech research project. Accuracy metrics and confusion matrices are in the project report.' },
];

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'support@mindshield.ai' },
  { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
  { icon: MapPin, label: 'Location', value: 'Delhi Technological University, Delhi, India' },
];

export const Contact = () => {
  const [open, setOpen] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Contact &amp; Support</h1>
        <p className="text-slate-400 mt-1 text-sm">Get in touch with us or browse our FAQ.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-violet-400" /> Get in Touch
            </h2>
            {contactInfo.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm text-slate-300">{value}</p>
                </div>
              </div>
            ))}
          </Card>
          <Card className="p-5 bg-gradient-to-br from-violet-600/10 to-cyan-600/10 border-violet-500/20">
            <p className="text-sm font-medium text-violet-300">Response SLA</p>
            <p className="text-xs text-slate-400 mt-1">We respond within <strong className="text-white">24 hours</strong> on business days.</p>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-6">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <Send className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-lg font-semibold text-white">Message Sent!</p>
                <p className="text-sm text-slate-400 max-w-xs">Thank you. We'll get back to you within 24 hours.</p>
                <Button variant="outline" size="sm" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                  Send Another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-semibold text-white">Send a Message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  <Input label="Email Address" type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <Input label="Subject" placeholder="How can we help?" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Message</label>
                  <textarea
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
                    rows={5} placeholder="Describe your issue or feedback..." value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required
                  />
                </div>
                <Button type="submit" isLoading={loading} className="w-full">
                  <Send className="h-4 w-4 mr-2" /> Send Message
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Card key={i} className="overflow-hidden">
              <button className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors" onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-sm font-medium text-slate-200">{faq.q}</span>
                {open === i ? <ChevronUp className="h-4 w-4 shrink-0 text-violet-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />}
              </button>
              {open === i && <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed border-t border-slate-800 pt-3">{faq.a}</div>}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};