'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Check, X, ArrowUpRight, AlertTriangle, Loader2, Upload,
} from 'lucide-react';

// An icon value is an image when it's a data URI / URL / path; otherwise it's emoji/text.
export const isImgIcon = (v: string) => /^(data:|https?:|\/)/.test(v);

// ── Types ───────────────────────────────────────────────────────────────────
export type Block    = { id: number; name: string; areaName: string; active: boolean; sortOrder: number };
export type Amenity  = { id: number; label: string; icon: string; active: boolean; sortOrder: number };
export type Category = { id: number; label: string; slug: string; bg: string; fg: string; active: boolean; sortOrder: number };
export type Plan     = { id: number; name: string; price: number; period: string; description: string; active: boolean; sortOrder: number };
export type AuditRow = { id: number; adminName: string; entity: string; action: string; summary: string; createdAt: string };
export type Observed = { area: string; count: number };

interface Props {
  initialBlocks: Block[];
  initialAmenities: Amenity[];
  initialCategories: Category[];
  initialPricing: Plan[];
  observed: Observed[];
  initialAudit: AuditRow[];
}

const ACCENT = '#1E3A5C';
const CARD: React.CSSProperties = {
  background: '#fff', border: '1px solid #ECEEF1', borderRadius: 18,
  padding: '22px 22px 20px', boxShadow: '0 1px 2px rgba(20,40,70,.03)',
};

// ── Network helper ──────────────────────────────────────────────────────────
async function api<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Request failed (${res.status})`);
  }
  return res.json();
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const s = Math.floor((Date.now() - then) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

// ── Small UI atoms ──────────────────────────────────────────────────────────
function Card({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={CARD}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: '#15243B' }}>{title}</h3>
          {sub && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#8893A4', fontWeight: 500 }}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function GhostBtn({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, height: 33, padding: '0 13px',
      borderRadius: 9, border: '1px solid #ECEEF1', background: '#fff',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
      fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: ACCENT,
    }}>{children}</button>
  );
}

function IconBtn({ onClick, title, danger, disabled, children }: { onClick: () => void; title: string; danger?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, borderRadius: 8, border: '1px solid #ECEEF1',
      background: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      color: danger ? '#B4402B' : '#5A6172', flexShrink: 0,
    }}>{children}</button>
  );
}

// ── Amenity icon chip (shows uploaded image or emoji/text) ────────────────────
function IconChip({ icon, size = 30 }: { icon: string; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 8, background: '#EEF1F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, flexShrink: 0, overflow: 'hidden' }}>
      {icon ? (isImgIcon(icon) ? <img src={icon} alt="" style={{ width: '70%', height: '70%', objectFit: 'contain' }} /> : icon) : '✓'}
    </span>
  );
}

// ── Icon input: emoji text field + image upload (SVG/PNG → data URI) ───────────
const MAX_ICON_BYTES = 64 * 1024; // 64KB — keep DB rows small; SVG/small PNG only
function IconInput({ value, onChange, onEnter, onEscape, onError }: {
  value: string; onChange: (v: string) => void;
  onEnter?: () => void; onEscape?: () => void; onError?: (m: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isImg = isImgIcon(value);

  function pick(file: File) {
    if (!/^image\/(svg\+xml|png|jpeg|webp)$/.test(file.type)) { onError?.('Use SVG, PNG, JPG or WebP'); return; }
    if (file.size > MAX_ICON_BYTES) { onError?.('Icon must be under 64KB'); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => onError?.('Could not read file');
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <input ref={fileRef} type="file" accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
        style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
      {isImg ? (
        <>
          <IconChip icon={value} size={33} />
          <IconBtn onClick={() => onChange('')} title="Remove image"><X size={14} /></IconBtn>
        </>
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onEnter?.(); if (e.key === 'Escape') onEscape?.(); }}
          placeholder="🏊" maxLength={4} style={{ ...inputStyle, width: 46, textAlign: 'center', flexShrink: 0 }} />
      )}
      <IconBtn onClick={() => fileRef.current?.click()} title="Upload SVG / PNG"><Upload size={14} /></IconBtn>
    </div>
  );
}

// ── iOS-style switch ──────────────────────────────────────────────────────────
function Switch({ checked, onChange, title, disabled }: { checked: boolean; onChange: () => void; title?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      title={title}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      style={{
        position: 'relative', width: 38, height: 22, flexShrink: 0,
        borderRadius: 99, border: 'none', padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        background: checked ? '#34C759' : '#E2E5EA',
        transition: 'background 180ms ease',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: 2, width: 18, height: 18,
        borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
        transform: checked ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform 180ms ease',
      }} />
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  height: 33, padding: '0 10px', borderRadius: 8, border: '1.5px solid #D7DCE3',
  fontFamily: 'inherit', fontSize: 13.5, color: '#15243B', outline: 'none', minWidth: 0,
};

// ── Toast ───────────────────────────────────────────────────────────────────
type Toast = { kind: 'ok' | 'err'; msg: string } | null;
function ToastView({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  if (!toast) return null;
  const ok = toast.kind === 'ok';
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      background: ok ? '#1E3A5C' : '#B4402B', color: '#fff', borderRadius: 14,
      padding: '13px 22px', boxShadow: '0 12px 32px rgba(15,25,45,0.28)', fontSize: 14, fontWeight: 700,
      animation: 'bvfade .3s cubic-bezier(.22,1,.36,1) both',
    }}>
      <span style={{ fontSize: 16 }}>{ok ? '✓' : '!'}</span>
      {toast.msg}
      <button onClick={onClose} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function ConfigManager(props: Props) {
  const [blocks, setBlocks]         = useState(props.initialBlocks);
  const [amenities, setAmenities]   = useState(props.initialAmenities);
  const [categories, setCategories] = useState(props.initialCategories);
  const [pricing, setPricing]       = useState(props.initialPricing);
  const [observed, setObserved]     = useState(props.observed);
  const [audit, setAudit]           = useState(props.initialAudit);
  const [toast, setToast]           = useState<Toast>(null);

  const notify = useCallback((kind: 'ok' | 'err', msg: string) => {
    setToast({ kind, msg });
    window.clearTimeout((notify as unknown as { _t?: number })._t);
    (notify as unknown as { _t?: number })._t = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const refreshAudit = useCallback(async () => {
    try { setAudit(await api<AuditRow[]>('/api/admin/config/audit', 'GET')); } catch { /* keep stale */ }
  }, []);

  // Wrap a mutation: runs fn, refreshes audit, toasts on success/error. Returns ok boolean.
  const run = useCallback(async (fn: () => Promise<void>, okMsg: string): Promise<boolean> => {
    try {
      await fn();
      await refreshAudit();
      notify('ok', okMsg);
      return true;
    } catch (e) {
      notify('err', e instanceof Error ? e.message : 'Something went wrong');
      return false;
    }
  }, [notify, refreshAudit]);

  return (
    <div style={{ animation: 'bvfade .45s cubic-bezier(.22,1,.36,1) both', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Intro */}
      <div>
        <p style={{ margin: 0, fontSize: 13.5, color: '#8893A4', fontWeight: 500, maxWidth: 720 }}>
          Everything below is stored in the database and applies across the marketplace. Changes save immediately and are recorded in the audit trail.
        </p>
      </div>

      {/* Row 1 — Managed blocks | Observed areas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <BlocksSection blocks={blocks} setBlocks={setBlocks} run={run} />
        <ObservedAreas
          observed={observed}
          managed={blocks}
          onPromote={async (area) => {
            const ok = await run(async () => {
              const row = await api<Block>('/api/admin/config/blocks', 'POST', { name: area });
              setBlocks(b => [...b, row]);
            }, `Promoted “${area}” to a managed block`);
            if (ok) setObserved(o => o.filter(x => x.area !== area));
          }}
        />
      </div>

      {/* Row 2 — Amenities | Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <AmenitiesSection items={amenities} setItems={setAmenities} run={run} notify={notify} />
        <CategoriesSection items={categories} setItems={setCategories} run={run} />
      </div>

      {/* Row 3 — Pricing */}
      <PricingSection items={pricing} setItems={setPricing} run={run} />

      {/* Row 4 — Audit */}
      <AuditPanel rows={audit} />

      <ToastView toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// ── Blocks ──────────────────────────────────────────────────────────────────
function BlocksSection({ blocks, setBlocks, run }: {
  blocks: Block[]; setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  run: (fn: () => Promise<void>, ok: string) => Promise<boolean>;
}) {
  const [adding, setAdding]     = useState(false);
  const [draft, setDraft]       = useState('');
  const [editId, setEditId]     = useState<number | null>(null);
  const [editVal, setEditVal]   = useState('');
  const [busyId, setBusyId]     = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  async function add() {
    const name = draft.trim();
    if (!name) return;
    const ok = await run(async () => {
      const row = await api<Block>('/api/admin/config/blocks', 'POST', { name });
      setBlocks(b => [...b, row]);
    }, `Block “${name}” added`);
    if (ok) { setDraft(''); setAdding(false); }
  }

  async function saveEdit(id: number) {
    const name = editVal.trim();
    if (!name) return;
    setBusyId(id);
    const ok = await run(async () => {
      const row = await api<Block>(`/api/admin/config/blocks/${id}`, 'PATCH', { name });
      setBlocks(b => b.map(x => x.id === id ? row : x));
    }, 'Block renamed');
    setBusyId(null);
    if (ok) setEditId(null);
  }

  async function toggle(b: Block) {
    setBusyId(b.id);
    await run(async () => {
      const row = await api<Block>(`/api/admin/config/blocks/${b.id}`, 'PATCH', { active: !b.active });
      setBlocks(bs => bs.map(x => x.id === b.id ? row : x));
    }, b.active ? 'Block disabled' : 'Block enabled');
    setBusyId(null);
  }

  async function remove(id: number) {
    setBusyId(id);
    const ok = await run(async () => {
      await api(`/api/admin/config/blocks/${id}`, 'DELETE');
      setBlocks(b => b.filter(x => x.id !== id));
    }, 'Block removed');
    setBusyId(null);
    if (ok) setConfirmId(null);
  }

  return (
    <Card
      title="Managed blocks"
      sub="Canonical service areas you control"
      action={!adding && <GhostBtn onClick={() => setAdding(true)}><Plus size={15} /> Add block</GhostBtn>}
    >
      {adding && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') { setAdding(false); setDraft(''); } }}
            placeholder="e.g. Block J" style={{ ...inputStyle, flex: 1 }} />
          <IconBtn onClick={add} title="Save"><Check size={15} /></IconBtn>
          <IconBtn onClick={() => { setAdding(false); setDraft(''); }} title="Cancel"><X size={15} /></IconBtn>
        </div>
      )}

      {blocks.length === 0 ? (
        <Empty label="No managed blocks yet" hint="Add one above, or promote an observed area." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {blocks.map(b => {
            const busy = busyId === b.id;
            return (
              <div key={b.id} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px',
                borderRadius: 12, border: '1px solid #F2F4F7', opacity: b.active ? 1 : 0.55,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: '#15243B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>
                  {b.name[0]?.toUpperCase()}
                </div>

                {editId === b.id ? (
                  <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(b.id); if (e.key === 'Escape') setEditId(null); }}
                    style={{ ...inputStyle, flex: 1 }} />
                ) : (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B' }}>{b.name}</div>
                    <div style={{ fontSize: 11.5, color: '#8893A4' }}>{b.areaName}{b.active ? '' : ' · disabled'}</div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {busy && <Loader2 size={14} className="bv-spin" style={{ color: '#8893A4' }} />}
                  {confirmId === b.id ? (
                    <>
                      <span style={{ fontSize: 12, color: '#B4402B', fontWeight: 700 }}>Delete?</span>
                      <IconBtn onClick={() => remove(b.id)} title="Confirm delete" danger disabled={busy}><Check size={15} /></IconBtn>
                      <IconBtn onClick={() => setConfirmId(null)} title="Cancel"><X size={15} /></IconBtn>
                    </>
                  ) : editId === b.id ? (
                    <>
                      <IconBtn onClick={() => saveEdit(b.id)} title="Save" disabled={busy}><Check size={15} /></IconBtn>
                      <IconBtn onClick={() => setEditId(null)} title="Cancel"><X size={15} /></IconBtn>
                    </>
                  ) : (
                    <>
                      <Switch checked={b.active} onChange={() => toggle(b)} title={b.active ? 'Disable' : 'Enable'} disabled={busy} />
                      <IconBtn onClick={() => { setEditId(b.id); setEditVal(b.name); }} title="Rename" disabled={busy}><Pencil size={14} /></IconBtn>
                      <IconBtn onClick={() => setConfirmId(b.id)} title="Delete" danger disabled={busy}><Trash2 size={14} /></IconBtn>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Observed areas (read-only, promotable) ──────────────────────────────────
function ObservedAreas({ observed, managed, onPromote }: {
  observed: Observed[]; managed: Block[]; onPromote: (area: string) => void;
}) {
  const managedNames = new Set(managed.map(b => b.name.toLowerCase()));
  const unmanaged = observed.filter(o => !managedNames.has(o.area.toLowerCase()));

  return (
    <Card title="Observed areas" sub="Free-text areas seen in live listings — read-only">
      {unmanaged.length === 0 ? (
        <Empty label="All observed areas are managed" hint="No stray free-text areas right now." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {unmanaged.map(o => (
            <div key={o.area} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 12, border: '1px dashed #DDE2E8', background: '#FAFBFC' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#44506A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.area}</div>
                <div style={{ fontSize: 11.5, color: '#8893A4' }}>{o.count} active listing{o.count !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => onPromote(o.area)} title="Promote to a managed block" style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, height: 30, padding: '0 11px',
                borderRadius: 8, border: `1px solid ${ACCENT}`, background: '#fff', color: ACCENT,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, flexShrink: 0,
              }}>
                <ArrowUpRight size={14} /> Promote
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Amenities ───────────────────────────────────────────────────────────────
function AmenitiesSection({ items, setItems, run, notify }: {
  items: Amenity[]; setItems: React.Dispatch<React.SetStateAction<Amenity[]>>;
  run: (fn: () => Promise<void>, ok: string) => Promise<boolean>;
  notify: (kind: 'ok' | 'err', msg: string) => void;
}) {
  const [draft, setDraft]   = useState('');
  const [draftIcon, setDraftIcon] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  async function add() {
    const label = draft.trim();
    if (!label) return;
    const icon = draftIcon.trim();
    const ok = await run(async () => {
      const row = await api<Amenity>('/api/admin/config/amenities', 'POST', { label, icon });
      setItems(a => [...a, row]);
    }, `Amenity “${label}” added`);
    if (ok) { setDraft(''); setDraftIcon(''); setAdding(false); }
  }
  async function saveEdit(id: number) {
    const label = editVal.trim();
    if (!label) return;
    const icon = editIcon.trim();
    const ok = await run(async () => {
      const row = await api<Amenity>(`/api/admin/config/amenities/${id}`, 'PATCH', { label, icon });
      setItems(a => a.map(x => x.id === id ? row : x));
    }, 'Amenity updated');
    if (ok) setEditId(null);
  }
  async function toggle(a: Amenity) {
    await run(async () => {
      const row = await api<Amenity>(`/api/admin/config/amenities/${a.id}`, 'PATCH', { active: !a.active });
      setItems(xs => xs.map(x => x.id === a.id ? row : x));
    }, a.active ? 'Amenity disabled' : 'Amenity enabled');
  }
  async function remove(id: number) {
    const ok = await run(async () => {
      await api(`/api/admin/config/amenities/${id}`, 'DELETE');
      setItems(a => a.filter(x => x.id !== id));
    }, 'Amenity removed');
    if (ok) setConfirmId(null);
  }

  return (
    <Card title="Amenities" sub="Offered to owners when listing"
      action={!adding && <GhostBtn onClick={() => setAdding(true)}><Plus size={15} /> Add</GhostBtn>}>
      {adding && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <IconInput value={draftIcon} onChange={setDraftIcon} onEnter={add}
            onEscape={() => { setAdding(false); setDraft(''); setDraftIcon(''); }} onError={m => notify('err', m)} />
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') { setAdding(false); setDraft(''); setDraftIcon(''); } }}
            placeholder="e.g. Swimming pool" style={{ ...inputStyle, flex: 1 }} />
          <IconBtn onClick={add} title="Save"><Check size={15} /></IconBtn>
          <IconBtn onClick={() => { setAdding(false); setDraft(''); setDraftIcon(''); }} title="Cancel"><X size={15} /></IconBtn>
        </div>
      )}
      {items.length === 0 ? (
        <Empty label="No amenities yet" hint="Add the first one above." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {items.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 10, border: '1px solid #F2F4F7', opacity: a.active ? 1 : 0.5 }}>
              {editId === a.id ? (
                <>
                  <IconInput value={editIcon} onChange={setEditIcon} onEnter={() => saveEdit(a.id)}
                    onEscape={() => setEditId(null)} onError={m => notify('err', m)} />
                  <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(a.id); if (e.key === 'Escape') setEditId(null); }}
                    style={{ ...inputStyle, flex: 1 }} />
                </>
              ) : (
                <>
                  <IconChip icon={a.icon} />
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: '#44506A' }}>{a.label}{a.active ? '' : ' · off'}</span>
                </>
              )}
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                {confirmId === a.id ? (
                  <>
                    <span style={{ fontSize: 12, color: '#B4402B', fontWeight: 700, alignSelf: 'center' }}>Delete?</span>
                    <IconBtn onClick={() => remove(a.id)} title="Confirm" danger><Check size={15} /></IconBtn>
                    <IconBtn onClick={() => setConfirmId(null)} title="Cancel"><X size={15} /></IconBtn>
                  </>
                ) : editId === a.id ? (
                  <>
                    <IconBtn onClick={() => saveEdit(a.id)} title="Save"><Check size={15} /></IconBtn>
                    <IconBtn onClick={() => setEditId(null)} title="Cancel"><X size={15} /></IconBtn>
                  </>
                ) : (
                  <>
                    <Switch checked={a.active} onChange={() => toggle(a)} title={a.active ? 'Disable' : 'Enable'} />
                    <IconBtn onClick={() => { setEditId(a.id); setEditVal(a.label); setEditIcon(a.icon || ''); }} title="Edit"><Pencil size={14} /></IconBtn>
                    <IconBtn onClick={() => setConfirmId(a.id)} title="Delete" danger><Trash2 size={14} /></IconBtn>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Categories ──────────────────────────────────────────────────────────────
function CategoriesSection({ items, setItems, run }: {
  items: Category[]; setItems: React.Dispatch<React.SetStateAction<Category[]>>;
  run: (fn: () => Promise<void>, ok: string) => Promise<boolean>;
}) {
  const [draft, setDraft]   = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  async function add() {
    const label = draft.trim();
    if (!label) return;
    const ok = await run(async () => {
      const row = await api<Category>('/api/admin/config/categories', 'POST', { label });
      setItems(c => [...c, row]);
    }, `Category “${label}” added`);
    if (ok) { setDraft(''); setAdding(false); }
  }
  async function saveEdit(id: number) {
    const label = editVal.trim();
    if (!label) return;
    const ok = await run(async () => {
      const row = await api<Category>(`/api/admin/config/categories/${id}`, 'PATCH', { label });
      setItems(c => c.map(x => x.id === id ? row : x));
    }, 'Category renamed');
    if (ok) setEditId(null);
  }
  async function toggle(c: Category) {
    await run(async () => {
      const row = await api<Category>(`/api/admin/config/categories/${c.id}`, 'PATCH', { active: !c.active });
      setItems(xs => xs.map(x => x.id === c.id ? row : x));
    }, c.active ? 'Category disabled' : 'Category enabled');
  }
  async function remove(id: number) {
    const ok = await run(async () => {
      await api(`/api/admin/config/categories/${id}`, 'DELETE');
      setItems(c => c.filter(x => x.id !== id));
    }, 'Category removed');
    if (ok) setConfirmId(null);
  }

  return (
    <Card title="Listing categories" sub="Taxonomy shown across search & listings"
      action={!adding && <GhostBtn onClick={() => setAdding(true)}><Plus size={15} /> Add</GhostBtn>}>
      {adding && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') { setAdding(false); setDraft(''); } }}
            placeholder="e.g. Commercial" style={{ ...inputStyle, flex: 1 }} />
          <IconBtn onClick={add} title="Save"><Check size={15} /></IconBtn>
          <IconBtn onClick={() => { setAdding(false); setDraft(''); }} title="Cancel"><X size={15} /></IconBtn>
        </div>
      )}
      {items.length === 0 ? (
        <Empty label="No categories yet" hint="Add the first one above." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {items.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 10, border: '1px solid #F2F4F7', opacity: c.active ? 1 : 0.5 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: c.bg, border: `1.5px solid ${c.fg}`, flexShrink: 0 }} />
              {editId === c.id ? (
                <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') setEditId(null); }}
                  style={{ ...inputStyle, flex: 1 }} />
              ) : (
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: c.fg }}>{c.label}{c.active ? '' : ' · off'}</span>
              )}
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                {confirmId === c.id ? (
                  <>
                    <span style={{ fontSize: 12, color: '#B4402B', fontWeight: 700, alignSelf: 'center' }}>Delete?</span>
                    <IconBtn onClick={() => remove(c.id)} title="Confirm" danger><Check size={15} /></IconBtn>
                    <IconBtn onClick={() => setConfirmId(null)} title="Cancel"><X size={15} /></IconBtn>
                  </>
                ) : editId === c.id ? (
                  <>
                    <IconBtn onClick={() => saveEdit(c.id)} title="Save"><Check size={15} /></IconBtn>
                    <IconBtn onClick={() => setEditId(null)} title="Cancel"><X size={15} /></IconBtn>
                  </>
                ) : (
                  <>
                    <Switch checked={c.active} onChange={() => toggle(c)} title={c.active ? 'Disable' : 'Enable'} />
                    <IconBtn onClick={() => { setEditId(c.id); setEditVal(c.label); }} title="Rename"><Pencil size={14} /></IconBtn>
                    <IconBtn onClick={() => setConfirmId(c.id)} title="Delete" danger><Trash2 size={14} /></IconBtn>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Pricing ─────────────────────────────────────────────────────────────────
function PricingSection({ items, setItems, run }: {
  items: Plan[]; setItems: React.Dispatch<React.SetStateAction<Plan[]>>;
  run: (fn: () => Promise<void>, ok: string) => Promise<boolean>;
}) {
  const [editId, setEditId]   = useState<number | null>(null);
  const [fName, setFName]     = useState('');
  const [fPrice, setFPrice]   = useState('');
  const [fDesc, setFDesc]     = useState('');
  const [adding, setAdding]   = useState(false);
  const [confirmLive, setConfirmLive] = useState<number | null>(null);
  const [confirmDel, setConfirmDel]   = useState<number | null>(null);
  const [busyId, setBusyId]   = useState<number | null>(null);

  const liveCount = items.filter(p => p.active).length;

  function startEdit(p: Plan) { setEditId(p.id); setFName(p.name); setFPrice(String(p.price)); setFDesc(p.description); }
  function startAdd() { setAdding(true); setFName(''); setFPrice(''); setFDesc(''); }

  function validate(): string | null {
    if (!fName.trim()) return 'Name is required';
    const n = Number(fPrice);
    if (!Number.isInteger(n) || n < 0) return 'Price must be a whole number ≥ 0';
    return null;
  }

  async function saveEdit(id: number) {
    const err = validate(); if (err) { run(async () => { throw new Error(err); }, ''); return; }
    setBusyId(id);
    const ok = await run(async () => {
      const row = await api<Plan>(`/api/admin/config/pricing/${id}`, 'PATCH', { name: fName.trim(), price: Number(fPrice), description: fDesc.trim() });
      setItems(p => p.map(x => x.id === id ? row : x));
    }, 'Plan updated');
    setBusyId(null);
    if (ok) setEditId(null);
  }
  async function add() {
    const err = validate(); if (err) { run(async () => { throw new Error(err); }, ''); return; }
    const ok = await run(async () => {
      const row = await api<Plan>('/api/admin/config/pricing', 'POST', { name: fName.trim(), price: Number(fPrice), description: fDesc.trim() });
      setItems(p => [...p, row]);
    }, 'Plan added');
    if (ok) setAdding(false);
  }
  async function toggleLive(p: Plan) {
    setBusyId(p.id);
    await run(async () => {
      const row = await api<Plan>(`/api/admin/config/pricing/${p.id}`, 'PATCH', { active: !p.active });
      setItems(xs => xs.map(x => x.id === p.id ? row : x));
    }, p.active ? `“${p.name}” set OFF` : `“${p.name}” is now LIVE`);
    setBusyId(null);
    setConfirmLive(null);
  }
  async function remove(id: number) {
    setBusyId(id);
    const ok = await run(async () => {
      await api(`/api/admin/config/pricing/${id}`, 'DELETE');
      setItems(p => p.filter(x => x.id !== id));
    }, 'Plan removed');
    setBusyId(null);
    if (ok) setConfirmDel(null);
  }

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, gap: 12 }}>
        <div>
          <h3 style={{ margin: '0 0 5px', fontSize: 15.5, fontWeight: 800, color: '#15243B' }}>Paid feature pricing</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#8893A4', fontWeight: 500 }}>
            Set prices now; flip a plan LIVE once monetisation opens. Every change is audited.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ padding: '5px 13px', borderRadius: 999, background: liveCount ? '#E7F1EC' : '#F7EFDD', color: liveCount ? '#2E7D55' : '#9A6A1F', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
            {liveCount ? `${liveCount} plan${liveCount !== 1 ? 's' : ''} LIVE` : 'Monetisation OFF'}
          </span>
          {!adding && <GhostBtn onClick={startAdd}><Plus size={15} /> Add plan</GhostBtn>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 18 }}>
        {adding && (
          <PlanEditCard
            fName={fName} fPrice={fPrice} fDesc={fDesc}
            setFName={setFName} setFPrice={setFPrice} setFDesc={setFDesc}
            onSave={add} onCancel={() => setAdding(false)} title="New plan"
          />
        )}
        {items.map(p => {
          const busy = busyId === p.id;
          if (editId === p.id) {
            return (
              <PlanEditCard key={p.id}
                fName={fName} fPrice={fPrice} fDesc={fDesc}
                setFName={setFName} setFPrice={setFPrice} setFDesc={setFDesc}
                onSave={() => saveEdit(p.id)} onCancel={() => setEditId(null)} title="Edit plan" busy={busy}
              />
            );
          }
          return (
            <div key={p.id} style={{ background: '#F7F9FC', borderRadius: 14, border: `1px solid ${p.active ? '#C6DDD1' : '#ECEEF1'}`, padding: '16px 16px 14px', position: 'relative' }}>
              {p.active && <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 9.5, fontWeight: 800, color: '#2E7D55', background: '#E7F1EC', borderRadius: 999, padding: '2px 7px' }}>LIVE</span>}
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#15243B', marginBottom: 6, paddingRight: 34 }}>{p.name}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: ACCENT, letterSpacing: -0.4, marginBottom: 5 }}>৳{p.price.toLocaleString('en')}<span style={{ fontSize: 12, fontWeight: 600, color: '#8893A4' }}>/{p.period}</span></div>
              <div style={{ fontSize: 12.5, color: '#8893A4', fontWeight: 500, marginBottom: 12, minHeight: 32 }}>{p.description}</div>

              {confirmDel === p.id ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => remove(p.id)} disabled={busy} style={miniBtn('#B4402B', '#fff')}>Delete</button>
                  <button onClick={() => setConfirmDel(null)} style={miniBtn('#fff', '#6A7180', '#D7DCE3')}>Cancel</button>
                </div>
              ) : confirmLive === p.id ? (
                <div>
                  <div style={{ fontSize: 11.5, color: '#9A6A1F', fontWeight: 700, marginBottom: 6, display: 'flex', gap: 5, alignItems: 'center' }}>
                    <AlertTriangle size={13} /> Charge owners ৳{p.price.toLocaleString('en')}/{p.period}?
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => toggleLive(p)} disabled={busy} style={miniBtn('#2E7D55', '#fff')}>Go LIVE</button>
                    <button onClick={() => setConfirmLive(null)} style={miniBtn('#fff', '#6A7180', '#D7DCE3')}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => p.active ? toggleLive(p) : setConfirmLive(p.id)} disabled={busy} style={miniBtn(p.active ? '#fff' : '#1E3A5C', p.active ? '#2E7D55' : '#fff', p.active ? '#C6DDD1' : undefined)}>
                    {p.active ? 'Set OFF' : 'Set LIVE'}
                  </button>
                  <IconBtn onClick={() => startEdit(p)} title="Edit" disabled={busy}><Pencil size={14} /></IconBtn>
                  <IconBtn onClick={() => setConfirmDel(p.id)} title="Delete" danger disabled={busy}><Trash2 size={14} /></IconBtn>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {items.length === 0 && !adding && <div style={{ marginTop: 14 }}><Empty label="No pricing plans" hint="Add your first plan." /></div>}
    </div>
  );
}

function miniBtn(bg: string, fg: string, border?: string): React.CSSProperties {
  return {
    flex: 1, height: 32, borderRadius: 8, background: bg, color: fg,
    border: border ? `1.5px solid ${border}` : 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
  };
}

function PlanEditCard({ fName, fPrice, fDesc, setFName, setFPrice, setFDesc, onSave, onCancel, title, busy }: {
  fName: string; fPrice: string; fDesc: string;
  setFName: (v: string) => void; setFPrice: (v: string) => void; setFDesc: (v: string) => void;
  onSave: () => void; onCancel: () => void; title: string; busy?: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${ACCENT}`, padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</div>
      <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Plan name" style={{ ...inputStyle, width: '100%' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, color: '#8893A4', fontWeight: 700 }}>৳</span>
        <input value={fPrice} onChange={e => setFPrice(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" style={{ ...inputStyle, flex: 1 }} />
      </div>
      <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Short description" style={{ ...inputStyle, width: '100%' }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <button onClick={onSave} disabled={busy} style={miniBtn('#1E3A5C', '#fff')}>{busy ? 'Saving…' : 'Save'}</button>
        <button onClick={onCancel} style={miniBtn('#fff', '#6A7180', '#D7DCE3')}>Cancel</button>
      </div>
    </div>
  );
}

// ── Audit panel ─────────────────────────────────────────────────────────────
function AuditPanel({ rows }: { rows: AuditRow[] }) {
  const tag: Record<string, { bg: string; fg: string }> = {
    create: { bg: '#E7F1EC', fg: '#2E7D55' },
    update: { bg: '#EEF3F8', fg: '#1E3A5C' },
    toggle: { bg: '#F7EFDD', fg: '#9A6A1F' },
    delete: { bg: '#F8E8E3', fg: '#B4402B' },
  };
  return (
    <Card title="Recent configuration changes" sub="Audit trail — newest first">
      {rows.length === 0 ? (
        <Empty label="No changes yet" hint="Edits you make will appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((r, i) => {
            const t = tag[r.action] ?? tag.update;
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 2px', borderTop: i === 0 ? 'none' : '1px solid #F2F4F7' }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999, background: t.bg, color: t.fg, flexShrink: 0, minWidth: 56, textAlign: 'center' }}>{r.action}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#44506A', minWidth: 0 }}>{r.summary}</span>
                <span style={{ fontSize: 11.5, color: '#A4ADBA', flexShrink: 0 }}>{r.adminName} · {timeAgo(r.createdAt)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
function Empty({ label, hint }: { label: string; hint: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed #E1E6EC', borderRadius: 12, background: '#FAFBFC' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#5A6172' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#9AA6B6', marginTop: 3 }}>{hint}</div>
    </div>
  );
}
