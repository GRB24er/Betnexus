"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Search,
  Shield,
  Wallet,
  Trophy,
  ArrowLeft,
  FileText,
  Lock,
} from "lucide-react";

const faqCategories = [
  {
    name: "Account",
    icon: Shield,
    faqs: [
      { q: "How do I create an account?", a: "Click 'Sign Up' on the homepage, fill in your details including name, email, phone number, and date of birth. You must be 18 or older to register. Verify your email address to activate your account." },
      { q: "How do I verify my identity (KYC)?", a: "Go to Account Settings > KYC Verification. Upload a valid government-issued ID (passport, driver's license, or national ID) and a proof of address document. Verification is usually completed within 24 hours." },
      { q: "I forgot my password. How do I reset it?", a: "Click 'Forgot Password' on the login page, enter your registered email address, and follow the instructions in the reset email. For security, the reset link expires after 1 hour." },
      { q: "How do I enable two-factor authentication?", a: "Go to Account Settings > Security > Two-Factor Authentication. You can enable 2FA using an authenticator app (Google Authenticator or Authy) for added security on your account." },
    ],
  },
  {
    name: "Deposits & Withdrawals",
    icon: Wallet,
    faqs: [
      { q: "What payment methods are available?", a: "We accept MTN Mobile Money, Telecel Cash, Bitcoin (BTC), and Tether (USDT TRC-20). All mobile money deposits are instant and free. Crypto deposits require network confirmations." },
      { q: "How long do withdrawals take?", a: "Mobile money withdrawals: Instant to 24 hours. Bitcoin withdrawals: 10-60 minutes after approval. USDT withdrawals: 5-30 minutes after approval. All withdrawals are reviewed for security." },
      { q: "Is there a minimum deposit/withdrawal?", a: "Mobile money: Minimum deposit GHS 1, minimum withdrawal GHS 5. BTC: Minimum deposit 0.0001 BTC. USDT: Minimum deposit 5 USDT, minimum withdrawal 10 USDT." },
      { q: "Are deposits and withdrawals secure?", a: "All transactions are processed through Paystack's PCI-DSS Level 1 compliant infrastructure. Your financial data is encrypted end-to-end and we never store your payment credentials." },
    ],
  },
  {
    name: "Betting",
    icon: Trophy,
    faqs: [
      { q: "What types of bets can I place?", a: "We offer single bets, accumulators (parlays), system bets, and more. Markets include 1X2, Over/Under, Both Teams to Score, Correct Score, Handicaps, and hundreds more depending on the event." },
      { q: "What happens if a match is abandoned?", a: "If a match is abandoned before completion, bets on markets that have already been decided will stand. All other bets will be void and stakes returned. Specific rules apply to each sport." },
      { q: "Can I cash out my bet early?", a: "Yes, cash out is available on selected markets and events. The cash out value is updated in real-time based on the current state of the event. Partial cash out is also available." },
      { q: "What are the maximum winnings?", a: "Maximum payout varies by sport and market. Standard maximum is $100,000 per bet. VIP members may have higher limits. Contact support for specific limits on your account." },
    ],
  },
];

const legalPages = [
  { name: "Terms of Service", href: "/help" },
  { name: "Privacy Policy", href: "/help" },
  { name: "Cookie Policy", href: "/help" },
  { name: "Betting Rules", href: "/help" },
  { name: "License Information", href: "/help" },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Account");

  const currentCategory = faqCategories.find((c) => c.name === activeCategory);

  const filteredFaqs = searchQuery
    ? faqCategories.flatMap((c) =>
        c.faqs
          .filter(
            (f) =>
              f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              f.a.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((f) => ({ ...f, category: c.name }))
      )
    : [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3b82f6]/10 via-[#161925] to-[#3b82f6]/10 border-b border-[#3b82f6]/20">
        <div className="px-4 lg:px-6 py-6">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/" className="p-2 text-[#5a6485] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-[#3b82f6]/20 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Help Center</h1>
              <p className="text-xs text-[#8b95b8]">Find answers and get support</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6485]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full bg-[#1c2033] border border-[#2a3050] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#5a6485] focus:outline-none focus:border-[#3b82f6]/50"
            />
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-3xl">
        {/* Search Results */}
        {searchQuery && (
          <div className="mb-6">
            <p className="text-xs text-[#5a6485] mb-3">{filteredFaqs.length} results for &ldquo;{searchQuery}&rdquo;</p>
            {filteredFaqs.length > 0 ? (
              <div className="space-y-2">
                {filteredFaqs.map((faq) => (
                  <FaqItem
                    key={faq.q}
                    question={faq.q}
                    answer={faq.a}
                    isOpen={openFaq === faq.q}
                    onToggle={() => setOpenFaq(openFaq === faq.q ? null : faq.q)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#5a6485]">No results found. Try a different search or contact support.</p>
            )}
          </div>
        )}

        {!searchQuery && (
          <>
            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
              {faqCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.name
                      ? "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30"
                      : "bg-[#1c2033] text-[#8b95b8] border border-[#2a3050] hover:text-white"
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              ))}
            </div>

            {/* FAQs */}
            <div className="space-y-2 mb-8">
              {currentCategory?.faqs.map((faq) => (
                <FaqItem
                  key={faq.q}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFaq === faq.q}
                  onToggle={() => setOpenFaq(openFaq === faq.q ? null : faq.q)}
                />
              ))}
            </div>

            {/* Contact Support */}
            <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl p-5 mb-8">
              <h3 className="text-sm font-bold text-white mb-4">Still need help?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button className="flex items-center gap-3 bg-[#0f1118] border border-[#2a3050] rounded-lg px-4 py-3 hover:border-[#00d46e]/30 transition-all">
                  <MessageCircle className="w-5 h-5 text-[#00d46e]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">Live Chat</p>
                    <p className="text-[10px] text-[#5a6485]">Available 24/7</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 bg-[#0f1118] border border-[#2a3050] rounded-lg px-4 py-3 hover:border-[#3b82f6]/30 transition-all">
                  <Mail className="w-5 h-5 text-[#3b82f6]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">Email Support</p>
                    <p className="text-[10px] text-[#5a6485]">support@betnexus.com</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#5a6485]" /> Legal & Policies
              </h3>
              <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl divide-y divide-[#2a3050]">
                {legalPages.map((page) => (
                  <Link
                    key={page.name}
                    href={page.href}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#232840] transition-colors"
                  >
                    <span className="text-sm text-[#8b95b8]">{page.name}</span>
                    <Lock className="w-3.5 h-3.5 text-[#5a6485]" />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-[#1c2033] border border-[#2a3050] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-white pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#5a6485] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#5a6485] shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-3 border-t border-[#2a3050]">
          <p className="text-xs text-[#8b95b8] leading-relaxed pt-3">{answer}</p>
        </div>
      )}
    </div>
  );
}
