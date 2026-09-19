import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const statusOptions = ['Open', 'In Progress', 'Closed'];

const statusColors = {
  Open: 'status-open',
  'In Progress': 'status-progress',
  Closed: 'status-closed',
};

const formatDate = (value) => {
  if (!value) return '—';

  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Something went wrong');
  }

  return payload;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/new" element={<CreateTicketPage />} />
        <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function DashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadTickets = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams();

        if (statusFilter) params.append('status', statusFilter);
        if (searchTerm.trim()) params.append('search', searchTerm.trim());

        const response = await fetchJson(`${API_BASE}/api/tickets?${params.toString()}`, {
          signal: controller.signal,
        });

        setTickets(response.data || []);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadTickets();

    return () => controller.abort();
  }, [statusFilter, searchTerm, refreshKey]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((ticket) => ticket.status === 'Open').length;
    const inProgress = tickets.filter((ticket) => ticket.status === 'In Progress').length;
    const closed = tickets.filter((ticket) => ticket.status === 'Closed').length;

    return { total, open, inProgress, closed };
  }, [tickets]);

  const customers = useMemo(() => {
    const customerMap = new Map();

    tickets.forEach((ticket) => {
      if (!customerMap.has(ticket.customer_email)) {
        customerMap.set(ticket.customer_email, {
          name: ticket.customer_name,
          email: ticket.customer_email,
          tickets: 0,
          lastTicket: ticket.created_at,
        });
      }

      const customer = customerMap.get(ticket.customer_email);
      customer.tickets += 1;
      if (new Date(ticket.created_at) > new Date(customer.lastTicket)) {
        customer.lastTicket = ticket.created_at;
      }
    });

    return Array.from(customerMap.values()).sort((first, second) => second.tickets - first.tickets);
  }, [tickets]);

  const navigateToView = (view) => {
    setActiveView(view);
    if (view !== 'all-tickets') {
      setStatusFilter('');
      setSearchTerm('');
    }
  };

  const viewTitle = {
    dashboard: 'Overview',
    'all-tickets': 'All Tickets',
    customers: 'Customers',
    reports: 'Reports',
  }[activeView];

  const selectStatus = (status) => {
    setActiveView('all-tickets');
    setStatusFilter(status);
    setSearchTerm('');
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
  };

  return (
    <div className="support-app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">✦</div>
          <div>
            <p className="brand-name">SUPPORT</p>
            <h2>CRM</h2>
          </div>
        </div>

        <nav className="side-nav" aria-label="Sidebar navigation">
          {[
            ['dashboard', 'Dashboard'],
            ['all-tickets', 'All Tickets'],
            ['customers', 'Customers'],
            ['reports', 'Reports'],
          ].map(([view, label]) => (
            <button
              className={`nav-item ${activeView === view ? 'active' : ''}`}
              type="button"
              key={view}
              onClick={() => navigateToView(view)}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="main-header">
          <div>
            <p className="eyebrow">Support CRM</p>
            <h1>{viewTitle}</h1>
            <p className="subtitle">Here&apos;s what&apos;s happening with your tickets.</p>
          </div>

          <button type="button" className="primary-btn" onClick={() => setShowCreateTicket(true)}>
            + New Ticket
          </button>
        </header>

        <section className="stats-grid" aria-label="Ticket summary">
          <button type="button" className="stat-card stat-card-button" onClick={() => navigateToView('dashboard')}>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </button>
          <button type="button" className="stat-card stat-card--blue stat-card-button" onClick={() => selectStatus('Open')}>
            <span className="stat-value">{stats.open}</span>
            <span className="stat-label">Open</span>
          </button>
          <button type="button" className="stat-card stat-card--amber stat-card-button" onClick={() => selectStatus('In Progress')}>
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </button>
          <button type="button" className="stat-card stat-card--green stat-card-button" onClick={() => selectStatus('Closed')}>
            <span className="stat-value">{stats.closed}</span>
            <span className="stat-label">Closed</span>
          </button>
        </section>

        {(activeView === 'dashboard' || activeView === 'all-tickets') && (
        <section className="panel-box">
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tickets..."
                className="search-box"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="select-box"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option value={status} key={status}>
                  {status}
                </option>
              ))}
            </select>
            {(statusFilter || searchTerm) && (
              <button type="button" className="clear-btn" onClick={clearFilters}>
                Clear
              </button>
            )}
            <button type="button" className="secondary-btn" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </section>
        )}

        {(activeView === 'dashboard' || activeView === 'all-tickets') && <section className="ticket-panel">
          <div className="section-header">
            <h3>{activeView === 'all-tickets' ? 'All Tickets' : 'Recent Tickets'}</h3>
          </div>

          {error && <div className="message error-message">{error}</div>}

          {loading ? (
            <div className="loading-box">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="empty-box">
              <span className="empty-icon">⌁</span>
              <strong>No tickets found</strong>
              <span>Try another search or create a new ticket to get started.</span>
              {(statusFilter || searchTerm) && <button type="button" className="secondary-btn" onClick={clearFilters}>Clear filters</button>}
            </div>
          ) : (
            <div className="ticket-list">
              {tickets.map((ticket) => (
                <Link to={`/tickets/${ticket.ticket_id}`} className="ticket-card" key={ticket.ticket_id}>
                  <div className="ticket-card-row">
                    <div className="ticket-card-main">
                      <span className="ticket-id">{ticket.ticket_id}</span>
                      <h4>{ticket.customer_name}</h4>
                      <p className="ticket-email">{ticket.customer_email}</p>
                    </div>

                    <span className={`status-badge ${statusColors[ticket.status] || ''}`}>{ticket.status}</span>
                  </div>

                  <div className="ticket-card-footer">
                    <div>
                      <p className="ticket-subject">{ticket.subject}</p>
                    </div>
                    <span className="ticket-date">{formatDate(ticket.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>}

        {activeView === 'customers' && (
          <section className="ticket-panel directory-panel">
            <div className="section-header">
              <h3>Customers</h3>
              <span className="section-count">{customers.length} total</span>
            </div>
            {customers.length === 0 ? (
              <div className="empty-box">Customers will appear after the first ticket is created.</div>
            ) : (
              <div className="customer-list">
                {customers.map((customer) => (
                  <div className="customer-row" key={customer.email}>
                    <div className="avatar">{customer.name.charAt(0).toUpperCase()}</div>
                    <div className="customer-info">
                      <strong>{customer.name}</strong>
                      <span>{customer.email}</span>
                    </div>
                    <span className="customer-ticket-count">{customer.tickets} ticket{customer.tickets === 1 ? '' : 's'}</span>
                    <span className="ticket-date">{formatDate(customer.lastTicket)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeView === 'reports' && (
          <section className="reports-grid">
            <article className="report-card">
              <span className="report-label">Resolution rate</span>
              <strong>{stats.total ? Math.round((stats.closed / stats.total) * 100) : 0}%</strong>
              <span className="report-note">{stats.closed} of {stats.total} tickets closed</span>
            </article>
            <article className="report-card">
              <span className="report-label">Needs attention</span>
              <strong>{stats.open + stats.inProgress}</strong>
              <span className="report-note">Open or currently in progress</span>
            </article>
            <article className="report-card report-card--wide">
              <span className="report-label">Status distribution</span>
              {statusOptions.map((status) => {
                const count = stats[status === 'Open' ? 'open' : status === 'Closed' ? 'closed' : 'inProgress'];
                const percentage = stats.total ? (count / stats.total) * 100 : 0;

                return (
                  <div className="report-bar-row" key={status}>
                    <span>{status}</span>
                    <div className="report-bar"><span className={statusColors[status]} style={{ width: `${percentage}%` }} /></div>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </article>
          </section>
        )}
      </main>

      {showCreateTicket && (
        <CreateTicketPage
          isModal
          onClose={() => setShowCreateTicket(false)}
          onCreated={() => {
            setShowCreateTicket(false);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}

function CreateTicketPage({ isModal = false, onClose, onCreated }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    subject: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetchJson(`${API_BASE}/api/tickets`, {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setMessage(`Ticket created successfully. Ticket ID: ${response.ticket_id}`);
      if (onCreated) {
        setTimeout(onCreated, 700);
      } else {
        setTimeout(() => navigate('/'), 1200);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={isModal ? 'modal-backdrop' : 'page-shell form-page'} role={isModal ? 'dialog' : undefined} aria-modal={isModal || undefined}>
      {isModal ? (
        <div className="ticket-modal">
          <div className="form-header">
            <div>
              <p className="eyebrow">Support CRM</p>
              <h2>Create New Ticket</h2>
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close new ticket form">×</button>
          </div>
          <TicketFormFields
            form={form}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
          {message && <div className={`message ${message.includes('successfully') ? 'success-message' : 'error-message'}`}>{message}</div>}
        </div>
      ) : (
        <>
      <div className="form-header">
        <Link to="/" className="back-link">← Back to Tickets</Link>
        <h2>Create New Ticket</h2>
      </div>

      <TicketFormFields
        form={form}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {message && <div className={`message ${message.includes('successfully') ? 'success-message' : 'error-message'}`}>{message}</div>}
        </>
      )}
    </div>
  );
}

function TicketFormFields({ form, handleChange, handleSubmit, isSubmitting }) {
  return (
    <form onSubmit={handleSubmit} className="ticket-form">
      <label>
        Customer Name
        <input name="customer_name" value={form.customer_name} onChange={handleChange} required />
      </label>

      <label>
        Customer Email
        <input name="customer_email" type="email" value={form.customer_email} onChange={handleChange} required />
      </label>

      <label>
        Issue Title
        <input name="subject" value={form.subject} onChange={handleChange} required />
      </label>

      <label>
        Description
        <textarea name="description" rows="5" value={form.description} onChange={handleChange} required />
      </label>

      <button type="submit" className="primary-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Ticket'}
      </button>
    </form>
  );
}

function TicketDetailsPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState('Open');
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadTicket = async () => {
    try {
      setIsLoading(true);
      const response = await fetchJson(`${API_BASE}/api/tickets/${ticketId}`);
      setTicket(response.data);
      setStatus(response.data.status || 'Open');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const handleUpdate = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const payload = {
        status,
        ...(noteText.trim() ? { notes: noteText.trim() } : {}),
      };

      const response = await fetchJson(`${API_BASE}/api/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setMessage(`Ticket updated successfully at ${formatDate(response.updated_at)}`);
      await loadTicket();
      setNoteText('');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="page-shell loading-box">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="page-shell empty-box">Ticket not found.</div>;
  }

  return (
    <div className="page-shell details-page">
      <div className="detail-header">
        <Link to="/" className="back-link">← Back to Tickets</Link>
        <h2>{ticket.ticket_id}</h2>
      </div>

      <div className="ticket-detail-panel">
        <div className="detail-row">
          <div>
            <p className="detail-label">Customer</p>
            <h3>{ticket.customer_name}</h3>
            <p>{ticket.customer_email}</p>
          </div>
          <div>
            <p className="detail-label">Status</p>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="select-box compact">
              {statusOptions.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="detail-block">
          <p className="detail-label">Issue</p>
          <h3>{ticket.subject}</h3>
        </div>

        <div className="detail-block">
          <p className="detail-label">Description</p>
          <p>{ticket.description}</p>
        </div>

        <div className="notes-section">
          <p className="detail-label">Notes</p>
          {ticket.notes?.length ? (
            ticket.notes.map((note, index) => (
              <div key={`${note.created_at}-${index}`} className="note-item">
                <p>{note.note_text}</p>
                <span>{formatDate(note.created_at)}</span>
              </div>
            ))
          ) : (
            <div className="note-item empty-note">No notes yet.</div>
          )}
        </div>

        <form onSubmit={handleUpdate} className="note-form">
          <label>
            Add Note
            <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} rows="3" placeholder="Write a note for this ticket..." />
          </label>
          <button type="submit" className="primary-btn" disabled={isSaving}>
            {isSaving ? 'Updating...' : 'Update Ticket'}
          </button>
        </form>
      </div>

      {message && <div className={`message ${message.includes('updated successfully') ? 'success-message' : 'error-message'}`}>{message}</div>}
    </div>
  );
}

export default App;
