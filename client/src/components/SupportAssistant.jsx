import { useState } from "react";
import { Link } from "react-router-dom";
import supportKnowledge from "../config/supportKnowledge";

const intentRules = [
  { test: /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i, reply: { text: "Welcome to RESYIN Publications! I can help you browse books, find author information, or get order support." } },
  { test: /\b(thanks|thank you)\b/i, reply: { text: "You’re welcome. Enjoy your next read!" } },
  { test: /\b(publish|publishing|submit|manuscript|writer)\b/i, entry: "publishing" },
  { test: /\b(contact|support|help|whatsapp|phone|email|call)\b/i, entry: "contact-and-support" },
  { test: /\b(return|refund|damaged|replacement)\b/i, entry: "returns-and-refunds" },
  { test: /\b(delivery|shipping|pickup|dispatch)\b/i, entry: "delivery-and-shipping" },
  { test: /\b(cart|checkout|order)\b/i, entry: "orders-and-cart" },
  { test: /\b(register|account|join|login|membership)\b/i, entry: "membership" },
  { test: /\b(privacy|data|security)\b/i, entry: "privacy-and-account-data" },
  { test: /\b(book|books|author|shop|buy|catalog)\b/i, entry: "books" },
];

function replyFromEntry(entry) {
  return {
    text: `${entry.summary} ${entry.details[0]}`,
    link: { label: `Read more about ${entry.title}`, to: entry.url },
  };
}

function findKnowledgeEntry(input) {
  const value = input.toLowerCase();
  const terms = value.split(/[^a-z0-9]+/).filter((term) => term.length > 2);

  const rankedEntries = supportKnowledge
    .map((entry) => {
      const searchable = [entry.title, entry.summary, ...entry.keywords, ...entry.details]
        .join(" ")
        .toLowerCase();
      const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score);

  return rankedEntries[0]?.entry || null;
}

function getReply(input) {
  const matchedIntent = intentRules.find((rule) => rule.test.test(input));
  if (matchedIntent?.reply) return matchedIntent.reply;

  if (matchedIntent?.entry) {
    const entry = supportKnowledge.find((item) => item.slug === matchedIntent.entry);
    if (entry) return replyFromEntry(entry);
  }

  const knowledgeEntry = findKnowledgeEntry(input);
  if (knowledgeEntry) return replyFromEntry(knowledgeEntry);

  return {
    text: "I can help with books, authors, publishing enquiries, orders, delivery, and returns. What would you like to know?",
  };
}

export default function SupportAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Hi! I’m RESYIN’s support assistant. I can help with books, training, services, delivery, returns, and contact options.",
    },
  ]);
  const [draft, setDraft] = useState("");

  const handleSend = (value) => {
    const message = value.trim();
    if (!message) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: message },
      {
        id: Date.now() + 1,
        role: "assistant",
        ...getReply(message),
      },
    ]);
    setDraft("");
  };

  return (
    <div className="support-assistant">
      <button
        type="button"
        className="support-assistant-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open support assistant"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div className="support-assistant-panel">
          <div className="support-assistant-header">
            <strong>RESYIN Support</strong>
            <span>Online help</span>
          </div>

          <div className="support-assistant-body">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`support-assistant-message ${message.role}`}
              >
                <span>{message.text}</span>
                {message.link && (
                  <Link className="support-assistant-link" to={message.link.to} onClick={() => setIsOpen(false)}>
                    {message.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="support-assistant-suggestions">
            {[
              "Hello",
              "What books do you offer?",
              "How can I publish my book?",
              "How can I join the community?",
              "How do I contact support?",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="support-assistant-chip"
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="support-assistant-input-row">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSend(draft);
                }
              }}
              placeholder="Ask about books, delivery, or support"
            />
            <button type="button" onClick={() => handleSend(draft)}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
