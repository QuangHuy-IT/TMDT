import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';

/* ─── Category Icons ──────────────────────────────────────────────── */
const ICONS = {
  'Màn hình': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
  ),
  'Camera': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  'CPU & RAM': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
    </svg>
  ),
  'Pin & Sạc': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="16" height="10" rx="2" /><path d="M22 11v2M7 11l3-4v3h3l-3 4v-3H7z" />
    </svg>
  ),
  'Kết nối': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.42 9A15.95 15.95 0 0112 5c4.13 0 7.9 1.57 10.74 4.15" />
      <path d="M5 12.55A11 11 0 0112 10c2.6 0 5 .9 6.88 2.39" />
      <path d="M10.71 16.42A5 5 0 0112 16c.84 0 1.63.2 2.32.56" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  'Mạng & Di động': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h.01M7 20v-4M12 20v-8M17 20v-12M22 4v16" />
    </svg>
  ),
  'Hệ điều hành': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
    </svg>
  ),
  'Thiết kế': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  'Bảo mật': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
  </svg>
);

/* ─── Ordering & helpers ──────────────────────────────────────────── */
const CATEGORY_ORDER = [
  'Màn hình', 'Camera', 'CPU & RAM', 'Pin & Sạc', 'Kết nối',
  'Mạng & Di động', 'Hệ điều hành', 'Thiết kế', 'Bảo mật', 'Khác',
];

const isValidPair = ([k, v]) => String(k || '').trim() && String(v || '').trim();
const normFlat = (s) => s && typeof s === 'object' ? Object.fromEntries(Object.entries(s).filter(isValidPair)) : {};
const normGrouped = (g) => {
  if (!g || typeof g !== 'object') return {};
  return Object.entries(g).reduce((acc, [cat, specs]) => {
    const c = String(cat || '').trim();
    const s = normFlat(specs);
    if (c && Object.keys(s).length > 0) acc[c] = s;
    return acc;
  }, {});
};
const normRows = (rows) =>
  Array.isArray(rows)
    ? rows.map((r, i) => ({
        id: r?.id ?? `${r?.specCategory || 'spec'}-${i}`,
        specCategory: String(r?.specCategory || 'Khác').trim() || 'Khác',
        specKey: String(r?.specKey || '').trim(),
        specValue: String(r?.specValue || '').trim(),
        sortOrder: Number.isFinite(Number(r?.sortOrder)) ? Number(r.sortOrder) : i,
      }))
      .filter((r) => r.specKey && r.specValue)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
const groupRows = (rows) => rows.reduce((acc, r) => {
  const c = r.specCategory || 'Khác';
  if (!acc[c]) acc[c] = [];
  acc[c].push(r);
  return acc;
}, {});
const sortCats = (cats) => [...cats].sort((a, b) => {
  const iA = CATEGORY_ORDER.indexOf(a), iB = CATEGORY_ORDER.indexOf(b);
  if (iA === -1 && iB === -1) return a.localeCompare(b);
  if (iA === -1) return 1; if (iB === -1) return -1;
  return iA - iB;
});
const toSectionId = (cat) =>
  `spec-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

/* ─── SVG Arrow / Chevron icons ──────────────────────────────────── */
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/* ─── Main Component ──────────────────────────────────────────────── */
export const ProductSpecificationsTab = ({ specificationRows, groupedSpecifications, specifications }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);   // show all / show first 3

  const isClickScrolling = useRef(false);
  const navRef = useRef(null);
  const tabRefs = useRef([]);

  /* --- Normalize data --- */
  const cleanRows = useMemo(() => normRows(specificationRows), [specificationRows]);
  const rowsByCategory = useMemo(() => groupRows(cleanRows), [cleanRows]);
  const cleanGrouped = useMemo(() => normGrouped(groupedSpecifications), [groupedSpecifications]);
  const cleanFlat = useMemo(() => normFlat(specifications), [specifications]);

  /* --- Build sections --- */
  const sections = useMemo(() => {
    const hasRows = cleanRows.length > 0;
    const hasGrouped = Object.keys(cleanGrouped).length > 0;
    const hasFlat = Object.keys(cleanFlat).length > 0;
    let cats = [];
    if (hasRows) cats = sortCats(Object.keys(rowsByCategory));
    else if (hasGrouped) cats = sortCats(Object.keys(cleanGrouped));
    else if (hasFlat) cats = ['Thông số'];

    return cats.map((cat) => {
      let items = [];
      if (hasRows) items = (rowsByCategory[cat] || []).map((r) => ({ key: r.specKey, value: r.specValue }));
      else if (hasGrouped) items = Object.entries(cleanGrouped[cat] || {}).map(([k, v]) => ({ key: k, value: v }));
      else items = Object.entries(cleanFlat).map(([k, v]) => ({ key: k, value: v }));
      return { category: cat, items, id: toSectionId(cat) };
    });
  }, [cleanRows, rowsByCategory, cleanGrouped, cleanFlat]);

  const visibleSections = isExpanded ? sections : sections.slice(0, 3);
  const hasMore = sections.length > 3;

  /* --- Reset on product change --- */
  const sig = sections.map((s) => s.id).join('|');
  useEffect(() => { setActiveIndex(0); setIsExpanded(false); }, [sig]);

  /* --- Track scroll arrows state --- */
  const updateArrows = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateArrows); ro.disconnect(); };
  }, [sections, updateArrows]);

  /* --- Scroll nav to keep active tab visible --- */
  const scrollNavToTab = useCallback((index) => {
    const nav = navRef.current;
    const tab = tabRefs.current[index];
    if (!nav || !tab) return;
    const navRect = nav.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const offset = tabRect.left - navRect.left - navRect.width / 2 + tabRect.width / 2;
    nav.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  /* --- Arrow scroll buttons --- */
  const scrollNav = useCallback((dir) => {
    navRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' });
  }, []);

  /* --- IntersectionObserver scroll spy --- */
  useEffect(() => {
    if (sections.length <= 1) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const idx = sections.findIndex((s) => s.id === visible[0].target.id);
          if (idx !== -1) { setActiveIndex(idx); scrollNavToTab(idx); }
        }
      },
      { root: null, rootMargin: '-80px 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((sec) => { const el = document.getElementById(sec.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [sections, scrollNavToTab]);

  /* --- Tab click --- */
  const handleTabClick = useCallback((index, id) => {
    setActiveIndex(index);
    scrollNavToTab(index);
    // If section is collapsed (not visible), expand first
    if (!isExpanded && index >= 3) setIsExpanded(true);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        isClickScrolling.current = true;
        const y = el.getBoundingClientRect().top + window.pageYOffset - 140;
        window.scrollTo({ top: y, behavior: 'smooth' });
        setTimeout(() => { isClickScrolling.current = false; }, 900);
      }
    }, isExpanded || index < 3 ? 0 : 100);
  }, [scrollNavToTab, isExpanded]);

  /* --- Empty state --- */
  if (sections.length === 0) {
    return (
      <div style={S.emptyWrap}>
        <svg style={{ width: 40, height: 40, color: '#d1d5db' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 12 }}>Chưa có thông số kỹ thuật.</p>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerIcon}>
          <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            <path d="M9 12h6M9 16h4" />
          </svg>
        </div>
        <h2 style={S.headerTitle}>Thông số kỹ thuật</h2>
        <span style={S.headerCount}>{sections.length} nhóm</span>
      </div>

      {/* ── Sticky Tab Navigation ── */}
      {sections.length > 1 && (
        <div style={S.stickyNav}>
          <div style={S.navRow}>
            {/* Left arrow */}
            <button
              onClick={() => scrollNav(-1)}
              style={{ ...S.arrowBtn, opacity: canScrollLeft ? 1 : 0, pointerEvents: canScrollLeft ? 'auto' : 'none' }}
              aria-label="Cuộn trái"
            >
              <ChevronLeft />
            </button>

            {/* Scrollable tab track */}
            <div ref={navRef} style={S.tabTrack}>
              {sections.map((sec, i) => {
                const isActive = activeIndex === i;
                return (
                  <button
                    key={sec.id}
                    ref={(el) => (tabRefs.current[i] = el)}
                    onClick={() => handleTabClick(i, sec.id)}
                    style={{
                      ...S.tab,
                      ...(isActive ? S.tabActive : S.tabInactive),
                    }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.color = '#374151'; } }}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
                  >
                    <span style={{ ...S.tabIcon, ...(isActive ? S.tabIconActive : {}) }}>
                      {ICONS[sec.category] || DEFAULT_ICON}
                    </span>
                    <span>{sec.category}</span>
                    {isActive && <span style={S.tabUnderline} />}
                  </button>
                );
              })}
            </div>

            {/* Right arrow */}
            <button
              onClick={() => scrollNav(1)}
              style={{ ...S.arrowBtn, opacity: canScrollRight ? 1 : 0, pointerEvents: canScrollRight ? 'auto' : 'none' }}
              aria-label="Cuộn phải"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* ── Spec Sections ── */}
      <div style={S.sectionsWrapper}>
        {visibleSections.map((sec, secIdx) => (
          <section key={sec.id} id={sec.id} style={{ ...S.section, scrollMarginTop: 140 }}>
            {/* Section header */}
            <div style={S.sectionHeader}>
              <span style={S.sectionIcon}>{ICONS[sec.category] || DEFAULT_ICON}</span>
              <div>
                <p style={S.sectionCounter}>{secIdx + 1} / {sections.length}</p>
                <h3 style={S.sectionTitle}>{sec.category}</h3>
              </div>
              <span style={S.sectionBadge}>{sec.items.length} thông số</span>
            </div>

            {/* 2-Column Table */}
            <div style={S.tableWrap}>
              <table style={S.table}>
                <tbody>
                  {sec.items.map((item, idx) => (
                    <SpecRow key={idx} item={item} isEven={idx % 2 === 0} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {/* ── Expand / Collapse button ── */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded((v) => !v)}
          style={S.expandBtn}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff0f0'; e.currentTarget.style.borderColor = '#fca5a5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
        >
          <span style={{ fontFamily: 'inherit' }}>
            {isExpanded
              ? `Thu gọn`
              : `Xem thêm ${sections.length - 3} nhóm thông số`}
          </span>
          <span style={{ ...S.expandChevron, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <ChevronDown />
          </span>
        </button>
      )}
    </div>
  );
};

/* ─── SpecRow ─────────────────────────────────────────────────────── */
const SpecRow = ({ item, isEven }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: '1px solid #f3f4f6',
        backgroundColor: hovered ? '#fff7f7' : isEven ? '#fafafa' : '#ffffff',
        transition: 'background-color 0.15s ease',
      }}
    >
      <td style={S.rowKey}>{item.key}</td>
      <td style={S.rowVal}>{item.value}</td>
    </tr>
  );
};

/* ─── Styles ─────────────────────────────────────────────────────── */
const S = {
  root: {
    borderRadius: 20,
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 18px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#fafafa',
  },
  headerIcon: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#fee2e2', color: '#ef4444', flexShrink: 0,
  },
  headerTitle: {
    margin: 0, fontSize: 14, fontWeight: 800, color: '#111827',
    letterSpacing: '-0.01em', textTransform: 'uppercase', flex: 1,
  },
  headerCount: {
    padding: '3px 10px', borderRadius: 999, backgroundColor: '#f3f4f6',
    color: '#6b7280', fontSize: 11, fontWeight: 700,
  },
  /* Nav */
  stickyNav: {
    position: 'sticky', top: 80, zIndex: 30,
    backgroundColor: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '2px solid #f3f4f6',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  navRow: {
    display: 'flex', alignItems: 'stretch',
  },
  arrowBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, flexShrink: 0,
    border: 'none', backgroundColor: 'transparent',
    color: '#6b7280', cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  tabTrack: {
    display: 'flex', flex: 1, gap: 2,
    padding: '6px 4px 0',
    overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
  },
  tab: {
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 12px 10px',
    borderRadius: '8px 8px 0 0',
    border: 'none', cursor: 'pointer',
    fontSize: 12.5, fontWeight: 700,
    whiteSpace: 'nowrap', transition: 'all 0.2s ease',
    outline: 'none', flexShrink: 0, fontFamily: 'inherit',
  },
  tabActive: { backgroundColor: '#fff0f0', color: '#dc2626' },
  tabInactive: { backgroundColor: 'transparent', color: '#6b7280' },
  tabIcon: { width: 14, height: 14, flexShrink: 0, color: '#9ca3af', transition: 'color 0.2s ease' },
  tabIconActive: { color: '#ef4444' },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
    backgroundColor: '#dc2626', borderRadius: '2px 2px 0 0',
  },
  /* Sections */
  sectionsWrapper: { backgroundColor: '#ffffff' },
  section: { padding: '18px 18px 22px', borderBottom: '1px solid #f3f4f6' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIcon: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 38, height: 38, borderRadius: 11, backgroundColor: '#fff0f0', color: '#ef4444',
    flexShrink: 0, padding: 8,
  },
  sectionCounter: {
    margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: '#9ca3af',
    letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1,
  },
  sectionTitle: {
    margin: 0, fontSize: 13, fontWeight: 800, color: '#111827',
    letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1,
  },
  sectionBadge: {
    marginLeft: 'auto', padding: '3px 10px', borderRadius: 999,
    backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
  },
  /* Table */
  tableWrap: { borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  rowKey: {
    width: '40%', minWidth: 110, padding: '9px 14px', fontSize: 12.5, fontWeight: 600,
    color: '#6b7280', verticalAlign: 'top', lineHeight: 1.5, borderRight: '1px solid #f3f4f6',
  },
  rowVal: {
    padding: '9px 14px', fontSize: 13, fontWeight: 500, color: '#111827',
    lineHeight: 1.6, whiteSpace: 'pre-line',
  },
  /* Expand button */
  expandBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    width: '100%', padding: '13px 16px',
    border: 'none', borderTop: '1px solid #e5e7eb',
    backgroundColor: '#ffffff', color: '#dc2626',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s ease', outline: 'none', fontFamily: 'inherit',
  },
  expandChevron: {
    display: 'flex', alignItems: 'center', transition: 'transform 0.3s ease',
    color: '#dc2626',
  },
  /* Empty */
  emptyWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 48, borderRadius: 20, border: '1px solid #f3f4f6', backgroundColor: '#ffffff', textAlign: 'center',
  },
};
