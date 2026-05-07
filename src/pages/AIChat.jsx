import { useEffect, useMemo, useState } from 'react';
import { checkAIStatus, sendAIMessage } from '../services/aiService';

const t = {
  title: '\u{645}\u{633}\u{627}\u{639}\u{62f} \u{627}\u{644}\u{645}\u{62a}\u{62c}\u{631} \u{627}\u{644}\u{630}\u{643}\u{64a}',
  status: '\u{62d}\u{627}\u{644}\u{629} \u{627}\u{62a}\u{635}\u{627}\u{644} Tencent Hy3',
  check: '\u{641}\u{62d}\u{635} \u{627}\u{644}\u{627}\u{62a}\u{635}\u{627}\u{644}',
  clear: '\u{645}\u{633}\u{62d} \u{627}\u{644}\u{645}\u{62d}\u{627}\u{62f}\u{62b}\u{629}',
  send: '\u{625}\u{631}\u{633}\u{627}\u{644}',
  placeholder: '\u{627}\u{643}\u{62a}\u{628} \u{633}\u{624}\u{627}\u{644}\u{643} \u{639}\u{646} \u{627}\u{644}\u{645}\u{628}\u{64a}\u{639}\u{627}\u{62a} \u{623}\u{648} \u{627}\u{644}\u{645}\u{62e}\u{632}\u{648}\u{646}...',
  suggestions: '\u{627}\u{642}\u{62a}\u{631}\u{627}\u{62d}\u{627}\u{62a} \u{62c}\u{627}\u{647}\u{632}\u{629}',
  summary: '\u{645}\u{644}\u{62e}\u{635} \u{627}\u{644}\u{628}\u{64a}\u{627}\u{646}\u{627}\u{62a} \u{627}\u{644}\u{645}\u{631}\u{633}\u{644}\u{629}',
  empty: '\u{627}\u{633}\u{623}\u{644} \u{639}\u{646} \u{627}\u{644}\u{631}\u{628}\u{62d}\u{60c} \u{627}\u{644}\u{645}\u{62e}\u{632}\u{648}\u{646}\u{60c} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a} \u{627}\u{644}\u{631}\u{627}\u{643}\u{62f}\u{629}\u{60c} \u{623}\u{648} \u{627}\u{642}\u{62a}\u{631}\u{627}\u{62d} \u{639}\u{631}\u{648}\u{636}.',
  emptyError: '\u{627}\u{643}\u{62a}\u{628} \u{633}\u{624}\u{627}\u{644}\u{64b}\u{627} \u{623}\u{648}\u{644}\u{64b}\u{627}.',
  loading: '\u{62c}\u{627}\u{631}\u{64a} \u{627}\u{644}\u{62a}\u{62d}\u{644}\u{64a}\u{644}...',
  online: '\u{645}\u{62a}\u{635}\u{644}',
  offline: '\u{63a}\u{64a}\u{631} \u{645}\u{62a}\u{635}\u{644}'
};

const suggestions = [
  '\u{627}\u{62d}\u{633}\u{628} \u{631}\u{628}\u{62d} \u{627}\u{644}\u{64a}\u{648}\u{645}',
  '\u{644}\u{62e}\u{635} \u{644}\u{64a} \u{645}\u{628}\u{64a}\u{639}\u{627}\u{62a} \u{627}\u{644}\u{64a}\u{648}\u{645}',
  '\u{645}\u{627} \u{647}\u{64a} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a} \u{627}\u{644}\u{623}\u{643}\u{62b}\u{631} \u{645}\u{628}\u{64a}\u{639}\u{64b}\u{627}\u{61f}',
  '\u{645}\u{627} \u{647}\u{64a} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a} \u{627}\u{644}\u{62a}\u{64a} \u{642}\u{627}\u{631}\u{628}\u{62a} \u{639}\u{644}\u{649} \u{627}\u{644}\u{646}\u{641}\u{627}\u{62f}\u{61f}',
  '\u{645}\u{627} \u{647}\u{64a} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a} \u{627}\u{644}\u{631}\u{627}\u{643}\u{62f}\u{629}\u{61f}',
  '\u{645}\u{627} \u{647}\u{648} \u{623}\u{641}\u{636}\u{644} \u{633}\u{639}\u{631} \u{628}\u{64a}\u{639} \u{644}\u{647}\u{630}\u{627} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{61f}',
  '\u{645}\u{627} \u{647}\u{64a} \u{627}\u{644}\u{645}\u{642}\u{627}\u{633}\u{627}\u{62a} \u{627}\u{644}\u{623}\u{643}\u{62b}\u{631} \u{637}\u{644}\u{628}\u{64b}\u{627}\u{61f}',
  '\u{645}\u{627} \u{647}\u{64a} \u{627}\u{644}\u{623}\u{644}\u{648}\u{627}\u{646} \u{627}\u{644}\u{623}\u{643}\u{62b}\u{631} \u{637}\u{644}\u{628}\u{64b}\u{627}\u{61f}',
  '\u{627}\u{642}\u{62a}\u{631}\u{62d} \u{644}\u{64a} \u{639}\u{631}\u{636}\u{64b}\u{627} \u{644}\u{62a}\u{635}\u{631}\u{64a}\u{641} \u{627}\u{644}\u{645}\u{62e}\u{632}\u{648}\u{646}',
  '\u{643}\u{645} \u{623}\u{62d}\u{62a}\u{627}\u{62c} \u{623}\u{646} \u{623}\u{634}\u{62a}\u{631}\u{64a} \u{645}\u{646} \u{647}\u{630}\u{627} \u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{61f}',
  '\u{62d}\u{644}\u{644} \u{644}\u{64a} \u{627}\u{644}\u{641}\u{648}\u{627}\u{62a}\u{64a}\u{631}',
  '\u{623}\u{639}\u{637}\u{646}\u{64a} \u{646}\u{635}\u{627}\u{626}\u{62d} \u{644}\u{632}\u{64a}\u{627}\u{62f}\u{629} \u{627}\u{644}\u{631}\u{628}\u{62d}'
];

const defaultBusinessContext = {
  appKnowledge: {
    appName: '\u{625}\u{62f}\u{627}\u{631}\u{629} \u{645}\u{62a}\u{62c}\u{631} \u{627}\u{644}\u{645}\u{644}\u{627}\u{628}\u{633}',
    pages: [
      '\u{644}\u{648}\u{62d}\u{629} \u{627}\u{644}\u{62a}\u{62d}\u{643}\u{645}',
      '\u{627}\u{644}\u{645}\u{628}\u{64a}\u{639}\u{627}\u{62a}',
      '\u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a}',
      '\u{627}\u{644}\u{645}\u{62e}\u{632}\u{648}\u{646}',
      '\u{627}\u{644}\u{641}\u{648}\u{627}\u{62a}\u{64a}\u{631}',
      '\u{627}\u{644}\u{632}\u{628}\u{627}\u{626}\u{646}',
      '\u{627}\u{644}\u{62a}\u{642}\u{627}\u{631}\u{64a}\u{631}',
      '\u{627}\u{644}\u{625}\u{639}\u{62f}\u{627}\u{62f}\u{627}\u{62a}',
      '\u{627}\u{644}\u{630}\u{643}\u{627}\u{621} \u{627}\u{644}\u{627}\u{635}\u{637}\u{646}\u{627}\u{639}\u{64a}'
    ],
    calculations: {
      profit: 'sales - purchaseCost - expenses',
      profitMargin: 'profit / sales * 100',
      stockValue: 'qty * purchaseCost',
      expectedRevenue: 'qty * sellPrice'
    }
  },
  today: { salesTotal: 0, purchaseCost: 0, expenses: 0, profit: 0, ordersCount: 0, soldItemsCount: 0 },
  month: { salesTotal: 0, profit: 0, ordersCount: 0, soldItemsCount: 0 },
  inventory: {
    totalProducts: 0,
    totalStockQty: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    deadStockCount: 0,
    stockPurchaseValue: 0,
    expectedSalesValue: 0
  },
  topSellingProducts: [],
  lowStockProducts: [],
  deadStockProducts: [],
  categoriesSummary: [],
  sizesSummary: [],
  colorsSummary: [],
  recentSales: [],
  currency: '\u{62f}\u{62c}'
};

export default function AIChat({ businessContext = defaultBusinessContext }) {
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const summaryRows = useMemo(() => [
    ['\u{645}\u{628}\u{64a}\u{639}\u{627}\u{62a} \u{627}\u{644}\u{64a}\u{648}\u{645}', businessContext.today?.salesTotal || 0],
    ['\u{631}\u{628}\u{62d} \u{627}\u{644}\u{64a}\u{648}\u{645}', businessContext.today?.profit || 0],
    ['\u{627}\u{644}\u{637}\u{644}\u{628}\u{627}\u{62a}', businessContext.today?.ordersCount || 0],
    ['\u{627}\u{644}\u{645}\u{646}\u{62a}\u{62c}\u{627}\u{62a}', businessContext.inventory?.totalProducts || 0],
    ['\u{642}\u{627}\u{631}\u{628} \u{627}\u{644}\u{646}\u{641}\u{627}\u{62f}', businessContext.inventory?.lowStockCount || 0]
  ], [businessContext]);

  async function refreshStatus() {
    setError('');
    try {
      const result = await checkAIStatus();
      setStatus(result);
    } catch (err) {
      setStatus({ online: false });
      setError(err.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      setError(t.emptyError);
      return;
    }

    const history = messages.slice(-8);
    const nextMessages = [...messages, { role: 'user', content: cleanMessage }];
    setMessages([...nextMessages, { role: 'assistant', content: t.loading }]);
    setMessage('');
    setLoading(true);
    setError('');

    try {
      const result = await sendAIMessage(cleanMessage, businessContext, history);
      setMessages([...nextMessages, { role: 'assistant', content: result.reply }]);
    } catch (err) {
      setMessages([...nextMessages, { role: 'assistant', content: err.message }]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <section dir="rtl" className="ai-page">
      <header className="ai-header-panel">
        <div>
          <h2>{t.title}</h2>
          <p>{t.status}: {status?.online ? `${t.online} · ${status.model || ''}` : status ? t.offline : t.loading}</p>
        </div>
        <div className="ai-header-actions">
          <button type="button" onClick={refreshStatus}>{t.check}</button>
          <button type="button" onClick={() => setMessages([])}>{t.clear}</button>
        </div>
      </header>

      <div className="ai-layout">
        <form className="ai-chat-panel" onSubmit={handleSubmit}>
          <div className="ai-chat-messages">
            {messages.length === 0 && <div className="ai-empty-state">{t.empty}</div>}
            {messages.map((item, index) => (
              <div className={`ai-message ${item.role}`} key={`${item.role}-${index}`}>
                {item.content}
              </div>
            ))}
          </div>
          <textarea
            value={message}
            maxLength={1200}
            onChange={event => setMessage(event.target.value)}
            placeholder={t.placeholder}
          />
          <button type="submit" disabled={loading}>{t.send}</button>
          {error && <div className="ai-error">{error}</div>}
        </form>

        <aside className="ai-side-stack">
          <div>
            <h3>{t.suggestions}</h3>
            <div className="ai-suggestions">
              {suggestions.map(item => (
                <button type="button" key={item} onClick={() => setMessage(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3>{t.summary}</h3>
            {summaryRows.map(([label, value]) => (
              <div className="ai-context-item" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
