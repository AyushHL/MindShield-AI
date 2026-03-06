import { Card } from '../components/ui/Card';
import {
  ShieldCheck, ShieldAlert, ShieldX,
  Phone, MessageCircle, Users, ArrowRight,
  AlertTriangle, HeartHandshake, Siren,
} from 'lucide-react';

interface Step {
  step: number;
  action: string;
  detail: string;
}

interface Protocol {
  level: string;
  icon: React.ElementType;
  accent: string;
  border: string;
  badge: string;
  badgeText: string;
  description: string;
  whatToSay: string[];
  whoToContact: { name: string; detail: string; icon: React.ElementType }[];
  escalation: Step[];
}

const protocols: Protocol[] = [
  {
    level: 'No Risk',
    icon: ShieldCheck,
    accent: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    badgeText: 'Low Priority',
    description: 'Individual shows no signs of distress. Focus on wellbeing check-in and positive reinforcement.',
    whatToSay: [
      '"It\'s great that you\'re taking care of your mental health."',
      '"Remember, support is always available if you ever need it."',
      '"Let\'s keep checking in regularly — you\'re doing well."',
    ],
    whoToContact: [
      { name: 'Counselor / Support Staff', detail: 'Optional — share positive update', icon: HeartHandshake },
      { name: 'iCall (TISS)', detail: 'Call +91 91529 87821 for guidance', icon: Phone },
    ],
    escalation: [
      { step: 1, action: 'Log the assessment', detail: 'Record result in system for trend monitoring.' },
      { step: 2, action: 'Schedule follow-up', detail: 'Plan a routine check-in within 30 days.' },
      { step: 3, action: 'Share resources', detail: 'Provide mental wellness materials proactively.' },
    ],
  },
  {
    level: 'Potential Risk',
    icon: ShieldAlert,
    accent: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    badgeText: 'Moderate Priority',
    description: 'Individual shows signs of hopelessness or vague ideation. Prompt, calm engagement is needed.',
    whatToSay: [
      '"I noticed some things that concerned me — I\'m here to listen, not to judge."',
      '"Can you tell me more about how you\'ve been feeling lately?"',
      '"You don\'t have to go through this alone. Let\'s figure out the next step together."',
      '"Have you had any thoughts of hurting yourself?" — ask directly and calmly.',
    ],
    whoToContact: [
      { name: 'Mental Health Counselor', detail: 'Refer within 24–48 hours', icon: HeartHandshake },
      { name: 'Supervisor / Case Manager', detail: 'Inform and document', icon: Users },
      { name: 'iCall (TISS)', detail: '+91 91529 87821', icon: Phone },
    ],
    escalation: [
      { step: 1, action: 'Engage in active listening', detail: 'Stay calm, ask open-ended questions, do not leave them alone.' },
      { step: 2, action: 'Conduct a safety check', detail: 'Ask directly about self-harm thoughts. Remove means if possible.' },
      { step: 3, action: 'Contact a counselor', detail: 'Arrange an urgent appointment within 48 hours.' },
      { step: 4, action: 'Document and monitor', detail: 'Log the interaction and schedule a 72-hour follow-up.' },
    ],
  },
  {
    level: 'High Risk — Urgent',
    icon: ShieldX,
    accent: 'text-red-400',
    border: 'border-red-500/30',
    badge: 'bg-red-500/10 text-red-400 border border-red-500/20',
    badgeText: 'Immediate Action',
    description: 'Individual expresses explicit self-harm intent or active suicidal ideation. Act immediately — do not leave them alone.',
    whatToSay: [
      '"I\'m very concerned about your safety right now and I\'m staying with you."',
      '"I\'m going to get you the help you need right now."',
      '"You matter. We\'re going to get through this together."',
      'Avoid: "I won\'t tell anyone" — do NOT make promises of confidentiality.',
    ],
    whoToContact: [
      { name: 'Emergency Services', detail: 'Call 112 immediately if in immediate danger', icon: Siren },
      { name: 'AASRA', detail: '+91 98204 66627 — 24/7', icon: Phone },
      { name: 'Vandrevala Foundation', detail: '+91 1860-2662-345 — 24/7', icon: MessageCircle },
      { name: 'On-call Psychiatrist / Hospital', detail: 'Initiate emergency evaluation', icon: HeartHandshake },
    ],
    escalation: [
      { step: 1, action: 'Do NOT leave them alone', detail: 'Stay present, stay calm, maintain eye contact.' },
      { step: 2, action: 'Call emergency services', detail: 'Dial 112 or AASRA (+91 98204 66627) immediately. Provide location and situation.' },
      { step: 3, action: 'Remove access to means', detail: 'Safely secure medications, sharp objects, or weapons if possible.' },
      { step: 4, action: 'Contact supervisor & family', detail: 'Notify next of kin and your organization\'s crisis lead.' },
      { step: 5, action: 'Complete incident report', detail: 'Document everything in detail post-crisis for review.' },
    ],
  },
];

const hotlines = [
  { name: 'iCall (TISS)', number: '+91 91529 87821', region: 'India', color: 'text-violet-400' },
  { name: 'Vandrevala Foundation', number: '+91 1860-2662-345', region: 'India — 24/7', color: 'text-blue-400' },
  { name: 'AASRA', number: '+91 98204 66627', region: 'India — 24/7', color: 'text-emerald-400' },
  { name: 'Snehi NGO', number: '+91 44 24640050', region: 'India — 24/7', color: 'text-amber-400' },
];

export function CrisisProtocols() {
  return (
    <div className="space-y-8 p-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Crisis Protocols</h1>
        </div>
        <p className="text-slate-400 text-sm ml-9">
          Step-by-step response guides for each risk level. Use this as an actionable reference during a real situation.
        </p>
      </div>

      {/* Protocol Cards */}
      {protocols.map((protocol) => {
        const LevelIcon = protocol.icon;
        return (
          <Card key={protocol.level} className={`border ${protocol.border} bg-slate-900/60 space-y-5 p-5`}>

            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LevelIcon className={`h-6 w-6 ${protocol.accent}`} />
                <h2 className={`text-lg font-semibold ${protocol.accent}`}>{protocol.level}</h2>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${protocol.badge}`}>
                {protocol.badgeText}
              </span>
            </div>

            <p className="text-slate-300 text-sm">{protocol.description}</p>

            <div className="grid gap-4 md:grid-cols-3">

              {/* What to Say */}
              <div className="rounded-lg bg-slate-800/40 p-4 space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">What to Say</h3>
                <ul className="space-y-2">
                  {protocol.whatToSay.map((line, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <MessageCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-500" />
                      <span className="italic">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Who to Contact */}
              <div className="rounded-lg bg-slate-800/40 p-4 space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Who to Contact</h3>
                <ul className="space-y-2">
                  {protocol.whoToContact.map((contact, i) => {
                    const ContactIcon = contact.icon;
                    return (
                      <li key={i} className="flex gap-2 text-sm">
                        <ContactIcon className={`h-4 w-4 mt-0.5 shrink-0 ${protocol.accent}`} />
                        <div>
                          <p className="text-white font-medium">{contact.name}</p>
                          <p className="text-slate-400 text-xs">{contact.detail}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Escalation Path */}
              <div className="rounded-lg bg-slate-800/40 p-4 space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Escalation Path</h3>
                <ol className="space-y-2">
                  {protocol.escalation.map((step) => (
                    <li key={step.step} className="flex gap-2 text-sm">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${protocol.badge}`}>
                        {step.step}
                      </span>
                      <div>
                        <p className="text-white font-medium flex items-center gap-1">
                          {step.action}
                          <ArrowRight className="h-3 w-3 text-slate-500" />
                        </p>
                        <p className="text-slate-400 text-xs">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          </Card>
        );
      })}

      {/* Quick Reference Hotlines */}
      <Card className="border border-slate-700/50 bg-slate-900/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-5 w-5 text-violet-400" />
          <h2 className="text-base font-semibold text-white">Quick Reference Hotlines</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {hotlines.map((h) => (
            <div key={h.name} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">{h.name}</p>
                <p className="text-xs text-slate-400">{h.region}</p>
              </div>
              <span className={`text-sm font-semibold ${h.color}`}>{h.number}</span>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
