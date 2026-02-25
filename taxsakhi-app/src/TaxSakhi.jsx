import { useState, useMemo, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// TAX ENGINE — FY 2025-26 (AY 2026-27) — Finance Act 2025
// ═══════════════════════════════════════════════════════════════════════════════

const OLD_SLABS = [
  { min: 0, max: 250000, rate: 0, label: "Up to ₹2.5L" },
  { min: 250000, max: 500000, rate: 0.05, label: "₹2.5L – ₹5L" },
  { min: 500000, max: 1000000, rate: 0.20, label: "₹5L – ₹10L" },
  { min: 1000000, max: Infinity, rate: 0.30, label: "Above ₹10L" },
];

const NEW_SLABS = [
  { min: 0, max: 400000, rate: 0, label: "Up to ₹4L" },
  { min: 400000, max: 800000, rate: 0.05, label: "₹4L – ₹8L" },
  { min: 800000, max: 1200000, rate: 0.10, label: "₹8L – ₹12L" },
  { min: 1200000, max: 1600000, rate: 0.15, label: "₹12L – ₹16L" },
  { min: 1600000, max: 2000000, rate: 0.20, label: "₹16L – ₹20L" },
  { min: 2000000, max: 2400000, rate: 0.25, label: "₹20L – ₹24L" },
  { min: 2400000, max: Infinity, rate: 0.30, label: "Above ₹24L" },
];

function slabTax(income, slabs) {
  let tax = 0;
  for (const s of slabs) {
    if (income <= s.min) break;
    tax += (Math.min(income, s.max) - s.min) * s.rate;
  }
  return Math.round(tax);
}

function surcharge(taxableIncome, tax, isNew) {
  if (taxableIncome <= 5000000) return 0;
  let rate = 0;
  if (isNew) {
    if (taxableIncome > 20000000) rate = 0.25;
    else if (taxableIncome > 10000000) rate = 0.15;
    else rate = 0.10;
  } else {
    if (taxableIncome > 50000000) rate = 0.37;
    else if (taxableIncome > 20000000) rate = 0.25;
    else if (taxableIncome > 10000000) rate = 0.15;
    else rate = 0.10;
  }
  return Math.round(tax * rate);
}

function calcHRA(basic, hraReceived, monthlyRent, isMetro) {
  if (!basic || !hraReceived || !monthlyRent) return 0;
  const annualRent = monthlyRent * 12;
  const a = hraReceived;
  const b = basic * (isMetro ? 0.5 : 0.4);
  const c = Math.max(0, annualRent - basic * 0.1);
  return Math.round(Math.min(a, b, c));
}

function computeTax(data) {
  const gross = data.grossSalary + data.otherIncome;
  const basic = data.basicSalary;
  const epfEmployee = Math.round(basic * 0.12);

  const hraExempt = calcHRA(basic, data.hraReceived, data.monthlyRent, data.isMetro);

  // Old Regime
  const old80C = Math.min(150000, (data.epfIncluded ? epfEmployee : 0) + data.ppf + data.elss + data.lic + data.others80C + data.homeLoanPrincipal + data.tuitionFees);
  const old80CCD1B = Math.min(50000, data.nps80CCD1B);
  const old80CCD2 = data.employerNPS;
  const old80D = Math.min(100000, data.healthInsuranceSelf + data.healthInsuranceParents);
  const old24b = Math.min(200000, data.homeLoanInterest);
  const old80E = data.educationLoanInterest;
  const old80TTA = Math.min(10000, data.savingsInterest);
  const oldProfTax = Math.min(2500, data.profTax);
  const oldLTA = data.lta;

  const oldTotalDed = 50000 + hraExempt + oldLTA + old80C + old80CCD1B + old80CCD2 + old80D + old24b + old80E + old80TTA + oldProfTax;
  const oldTaxable = Math.max(0, gross - oldTotalDed);
  let oldTax = slabTax(oldTaxable, OLD_SLABS);
  const oldRebate = oldTaxable <= 500000 ? Math.min(oldTax, 12500) : 0;
  oldTax -= oldRebate;
  const oldSC = surcharge(oldTaxable, oldTax, false);
  const oldCess = Math.round((oldTax + oldSC) * 0.04);
  const oldTotal = oldTax + oldSC + oldCess;

  // New Regime
  const new80CCD2 = data.employerNPS;
  const newTotalDed = 75000 + new80CCD2;
  const newTaxable = Math.max(0, gross - newTotalDed);
  let newTax = slabTax(newTaxable, NEW_SLABS);
  const newRebate = newTaxable <= 1200000 ? Math.min(newTax, 60000) : 0;
  newTax -= newRebate;
  const newSC = surcharge(newTaxable, newTax, true);
  const newCess = Math.round((newTax + newSC) * 0.04);
  const newTotal = newTax + newSC + newCess;

  const winner = oldTotal <= newTotal ? "old" : "new";
  const savings = Math.abs(oldTotal - newTotal);

  return {
    gross,
    epfEmployee,
    old: {
      standardDeduction: 50000, hra: hraExempt, lta: oldLTA,
      sec80C: old80C, sec80CCD1B: old80CCD1B, sec80CCD2: old80CCD2,
      sec80D: old80D, sec24b: old24b, sec80E: old80E, sec80TTA: old80TTA,
      profTax: oldProfTax, totalDeductions: oldTotalDed,
      taxableIncome: oldTaxable,
      slabTax: slabTax(oldTaxable, OLD_SLABS),
      rebate87A: oldRebate, surcharge: oldSC, cess: oldCess, totalTax: oldTotal,
    },
    new: {
      standardDeduction: 75000, sec80CCD2: new80CCD2,
      totalDeductions: newTotalDed, taxableIncome: newTaxable,
      slabTax: slabTax(newTaxable, NEW_SLABS),
      rebate87A: newRebate, surcharge: newSC, cess: newCess, totalTax: newTotal,
    },
    winner, savings,
    effectiveRateOld: gross > 0 ? ((oldTotal / gross) * 100).toFixed(1) : "0.0",
    effectiveRateNew: gross > 0 ? ((newTotal / gross) * 100).toFixed(1) : "0.0",
    gap80C: Math.max(0, 150000 - old80C),
    gap80CCD1B: Math.max(0, 50000 - old80CCD1B),
    gap80D: Math.max(0, 25000 - data.healthInsuranceSelf),
    marginalRate: oldTaxable > 1000000 ? 0.312 : oldTaxable > 500000 ? 0.208 : oldTaxable > 250000 ? 0.052 : 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
const fmt = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const fmtShort = (n) => {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(1) + "Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(0) + "K";
  return "₹" + n;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const C = { bg: "#FAFAF9", card: "#FFFFFF", border: "#E7E5E4", focus: "#D97706", text: "#1C1917", muted: "#78716C", light: "#A8A29E", amber: "#D97706", amberBg: "#FFFBEB", amberLight: "#FEF3C7", green: "#15803D", greenBg: "#DCFCE7", indigo: "#4F46E5", indigoBg: "#EEF2FF", dark: "#1C1917" };

function MoneyInput({ label, value, onChange, placeholder, hint, max, suffix, autoFocus, disabled }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(value > 0 ? value.toLocaleString("en-IN") : "");

  useEffect(() => {
    const current = parseInt((raw || "0").replace(/,/g, ""), 10);
    if (current !== value) setRaw(value > 0 ? value.toLocaleString("en-IN") : "");
  }, [value]);

  const handle = (e) => {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    if (!digits) { setRaw(""); onChange(0); return; }
    let n = parseInt(digits, 10);
    if (max && n > max) n = max;
    setRaw(n.toLocaleString("en-IN"));
    onChange(n);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: C.light }}>{hint}</span>}
      </div>
      <div style={{
        display: "flex", alignItems: "center",
        border: `1.5px solid ${focused ? C.focus : C.border}`,
        borderRadius: 10, background: disabled ? "#F5F5F4" : focused ? C.amberBg : "#fff",
        transition: "all 0.2s", padding: "0 12px",
        boxShadow: focused ? `0 0 0 3px ${C.amberLight}` : "none",
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.light, marginRight: 2 }}>₹</span>
        <input type="text" inputMode="numeric" value={raw} onChange={handle}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder || "0"} disabled={disabled} autoFocus={autoFocus}
          style={{
            flex: 1, padding: "11px 0", fontSize: 15, fontWeight: 600, border: "none",
            outline: "none", background: "transparent", color: C.text,
            fontFamily: "'JetBrains Mono', monospace",
          }} />
        {suffix && <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{suffix}</span>}
      </div>
      {max && value > 0 && (
        <div style={{ marginTop: 5, height: 4, background: "#F5F5F4", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 2, transition: "width 0.4s ease",
            width: `${Math.min(100, (value / max) * 100)}%`,
            background: value >= max ? C.green : `linear-gradient(90deg, ${C.amber}, #F59E0B)`,
          }} />
        </div>
      )}
    </div>
  );
}

function Checkbox({ label, checked, onChange, desc }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      display: "flex", gap: 10, padding: "10px 12px", marginBottom: 8, borderRadius: 10, cursor: "pointer",
      border: `1.5px solid ${checked ? C.amber : C.border}`, background: checked ? C.amberBg : "#fff",
      transition: "all 0.2s", alignItems: "flex-start",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
        border: `2px solid ${checked ? C.amber : C.border}`, background: checked ? C.amber : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
      }}>{checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div onClick={() => onChange(!checked)} style={{
        width: 42, height: 24, borderRadius: 12, cursor: "pointer", padding: 2,
        background: checked ? C.amber : "#D6D3D1", transition: "background 0.3s",
        display: "flex", alignItems: "center",
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>{label}</span>
    </div>
  );
}

function Card({ title, subtitle, step, active, children }) {
  return (
    <div style={{
      background: C.card, borderRadius: 16, marginBottom: 16,
      border: `1.5px solid ${active ? C.amber : C.border}`, overflow: "hidden",
      boxShadow: active ? `0 0 0 3px ${C.amberLight}, 0 4px 12px rgba(0,0,0,0.04)` : "0 1px 3px rgba(0,0,0,0.03)",
      transition: "all 0.3s",
    }}>
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8, fontSize: 12, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: active ? C.amber : "#E7E5E4", color: active ? "#fff" : C.muted,
          }}>{step}</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</span>
        </div>
        {subtitle && <div style={{ fontSize: 12, color: C.muted, marginLeft: 36, marginBottom: 4 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: "12px 20px 20px" }}>{children}</div>
    </div>
  );
}

function RegimeCard({ label, res, isWinner, savings, rate }) {
  const color = label === "Old" ? C.indigo : C.amber;
  const slabs = label === "Old" ? OLD_SLABS : NEW_SLABS;
  return (
    <div style={{
      flex: 1, minWidth: 0,
      border: `2px solid ${isWinner ? color : C.border}`,
      borderRadius: 14, overflow: "hidden", background: C.card,
      boxShadow: isWinner ? `0 4px 16px ${color}18` : "none",
    }}>
      {isWinner && (
        <div style={{ background: color, color: "#fff", textAlign: "center", padding: "5px 0", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          ★ BETTER — SAVES {fmt(savings)}
        </div>
      )}
      <div style={{ padding: "14px 14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label} Regime</div>
            <div style={{ fontSize: 10, color: C.light }}>FY 2025-26</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{fmt(res.totalTax)}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{fmt(Math.round(res.totalTax / 12))}/mo · {rate}%</div>
          </div>
        </div>
        {slabs.map((s, i) => {
          const applicable = Math.max(0, Math.min(res.taxableIncome, s.max) - s.min);
          const t = Math.round(applicable * s.rate);
          const mx = s.max === Infinity ? 2400000 : (s.max - s.min);
          const pct = Math.min(100, (applicable / mx) * 100);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <div style={{ width: 38, fontSize: 9, color: C.muted, fontFamily: "monospace", textAlign: "right" }}>{s.rate === 0 ? "NIL" : (s.rate * 100) + "%"}</div>
              <div style={{ flex: 1, height: 5, background: "#F5F5F4", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: applicable > 0 ? color : "transparent", opacity: 0.3 + (s.rate * 2.2), transition: "width 0.5s" }} />
              </div>
              <div style={{ width: 45, fontSize: 9, fontWeight: 600, color: C.muted, fontFamily: "monospace", textAlign: "right" }}>{t > 0 ? fmtShort(t) : "—"}</div>
            </div>
          );
        })}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
          {[
            { l: "Deductions", v: res.totalDeductions, g: true },
            { l: "Taxable", v: res.taxableIncome, b: true },
            { l: "Slab Tax", v: res.slabTax },
            res.rebate87A > 0 && { l: "Rebate 87A", v: res.rebate87A, g: true },
            res.surcharge > 0 && { l: "Surcharge", v: res.surcharge },
            { l: "Cess 4%", v: res.cess },
          ].filter(Boolean).map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 11, color: r.g ? C.green : C.muted, fontWeight: r.b ? 700 : 400 }}>
              <span>{r.l}</span>
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{r.g ? "−" : ""}{fmt(Math.abs(r.v))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
const INIT = {
  grossSalary: 0, basicSalary: 0, hraReceived: 0, monthlyRent: 0, isMetro: true,
  epfIncluded: true, ppf: 0, elss: 0, lic: 0, others80C: 0, homeLoanPrincipal: 0,
  tuitionFees: 0, nps80CCD1B: 0, employerNPS: 0, healthInsuranceSelf: 0,
  healthInsuranceParents: 0, homeLoanInterest: 0, educationLoanInterest: 0,
  savingsInterest: 0, profTax: 2500, lta: 0, otherIncome: 0, fdInterest: 0, rentalIncome: 0,
  paysRent: false, hasInvestments: false, hasHomeLoan: false, hasHealthInsurance: false,
  hasNPS: false, hasOtherIncome: false,
};

export default function TaxSakhi() {
  const [d, setD] = useState(INIT);
  const set = (k) => (v) => setD(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (d.grossSalary > 0 && d.basicSalary === 0) {
      setD(p => ({ ...p, basicSalary: Math.round(p.grossSalary * 0.4) }));
    }
  }, [d.grossSalary]);

  const dataFinal = useMemo(() => ({ ...d, otherIncome: d.fdInterest + d.rentalIncome }), [d]);
  const result = useMemo(() => computeTax(dataFinal), [dataFinal]);

  const applyPreset = (s) => {
    const b = Math.round(s * 0.4);
    setD({ ...INIT, grossSalary: s, basicSalary: b, hraReceived: Math.round(b * 0.5), epfIncluded: true, profTax: 2500 });
  };

  const bestTax = result.winner === "old" ? result.old.totalTax : result.new.totalTax;
  const takeHome = result.gross - bestTax;

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, sans-serif; }
        input::placeholder { color: #D6D3D1; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Sticky live banner */}
      {d.grossSalary > 0 && (
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "linear-gradient(135deg, #1C1917, #292524)",
          padding: "8px 16px", color: "#fff",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: `2px solid ${C.amber}`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}>
          <div>
            <div style={{ fontSize: 9, color: "#78716C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Take-Home</div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(takeHome)}<span style={{ fontSize: 10, color: "#78716C" }}>/yr</span></div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.amber, background: "rgba(217,119,6,0.15)", padding: "2px 10px", borderRadius: 6 }}>
              {result.winner === "old" ? "OLD" : "NEW"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#78716C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tax</div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(bestTax)}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.dark}, #44403C)`, padding: "28px 20px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: `linear-gradient(135deg, ${C.amber}, #F59E0B)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 800, boxShadow: "0 2px 8px rgba(217,119,6,0.4)",
            }}>₹</div>
            <span style={{ fontSize: 20, fontWeight: 800 }}>TaxSakhi</span>
            <span style={{ fontSize: 10, background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 6, color: "#A8A29E", fontWeight: 600 }}>FY 2025-26</span>
          </div>
          <p style={{ fontSize: 13, color: "#A8A29E", lineHeight: 1.5 }}>
            Smart tax planning for salaried Indians. Tax is calculated <strong style={{ color: "#fff" }}>live as you type</strong>. No buttons needed.
          </p>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, color: "#78716C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Quick start — pick your salary</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[500000, 750000, 1000000, 1200000, 1500000, 2000000, 2500000].map(s => (
                <button key={s} onClick={() => applyPreset(s)} style={{
                  padding: "6px 12px", borderRadius: 8, border: d.grossSalary === s ? `1.5px solid ${C.amber}` : "1px solid #57534E",
                  background: d.grossSalary === s ? C.amber : "rgba(255,255,255,0.05)",
                  color: d.grossSalary === s ? "#fff" : "#A8A29E",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                  transition: "all 0.2s",
                }}>
                  {fmtShort(s)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 80px" }}>

        <Card title="Your Salary" subtitle="From offer letter or Form 16" step={1} active={true}>
          <MoneyInput label="Gross Annual Salary" value={d.grossSalary} onChange={set("grossSalary")} placeholder="e.g. 12,00,000" autoFocus />
          <MoneyInput label="Basic Salary (Annual)" value={d.basicSalary} onChange={set("basicSalary")}
            hint={d.grossSalary > 0 ? `${Math.round((d.basicSalary / d.grossSalary) * 100)}% of CTC` : "Usually 40-50% of CTC"} />
          {d.basicSalary > 0 && (
            <div style={{ background: "#F5F5F4", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.muted }}>
              <strong style={{ color: C.text }}>Auto-calculated:</strong> EPF = {fmt(Math.round(d.basicSalary * 0.12))}/yr
              <span style={{ color: C.light }}> (12% of Basic — counted in 80C)</span>
            </div>
          )}
        </Card>

        <Card title="What applies to you?" subtitle="Only selected sections will show — keeps things simple" step={2} active={false}>
          <Checkbox label="I pay rent" checked={d.paysRent} onChange={set("paysRent")} desc="HRA exemption in old regime" />
          <Checkbox label="I have tax-saving investments" checked={d.hasInvestments} onChange={set("hasInvestments")} desc="PPF, ELSS, LIC, NSC, FDs, tuition fees" />
          <Checkbox label="I have health insurance" checked={d.hasHealthInsurance} onChange={set("hasHealthInsurance")} desc="Self/family or parents — 80D" />
          <Checkbox label="I have NPS" checked={d.hasNPS} onChange={set("hasNPS")} desc="National Pension System — extra ₹50K" />
          <Checkbox label="I have a home loan" checked={d.hasHomeLoan} onChange={set("hasHomeLoan")} desc="Interest 24(b) + principal in 80C" />
          <Checkbox label="I have other income" checked={d.hasOtherIncome} onChange={set("hasOtherIncome")} desc="FD interest, rental income, etc." />
        </Card>

        {d.paysRent && (
          <Card title="Rent & HRA" step="2a" active={false}>
            <MoneyInput label="HRA Received (Annual)" value={d.hraReceived} onChange={set("hraReceived")} hint={d.basicSalary > 0 ? `${Math.round((d.hraReceived / d.basicSalary) * 100)}% of Basic` : ""} />
            <MoneyInput label="Monthly Rent Paid" value={d.monthlyRent} onChange={set("monthlyRent")} suffix="/month" />
            <Toggle label="Metro city (Delhi, Mumbai, Chennai, Kolkata)" checked={d.isMetro} onChange={set("isMetro")} />
            {result.old.hra > 0 && (
              <div style={{ background: C.greenBg, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: C.green, fontWeight: 600 }}>
                ✅ HRA Exemption: {fmt(result.old.hra)}
                <span style={{ fontWeight: 400, fontSize: 11, display: "block", marginTop: 2 }}>
                  Min of: HRA received ({fmt(d.hraReceived)}) | {d.isMetro ? "50" : "40"}% Basic ({fmt(d.basicSalary * (d.isMetro ? 0.5 : 0.4))}) | Rent−10% Basic ({fmt(Math.max(0, d.monthlyRent * 12 - d.basicSalary * 0.1))})
                </span>
              </div>
            )}
          </Card>
        )}

        {d.hasInvestments && (
          <Card title="80C Investments" subtitle={`${fmt(result.old.sec80C)} / ₹1,50,000 used`} step="3" active={false}>
            {d.basicSalary > 0 && (
              <div style={{ background: "#F5F5F4", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: C.muted }}>
                <strong style={{ color: C.text }}>EPF (auto):</strong> {fmt(result.epfEmployee)} — already counted
              </div>
            )}
            <MoneyInput label="PPF" value={d.ppf} onChange={set("ppf")} />
            <MoneyInput label="ELSS Mutual Funds" value={d.elss} onChange={set("elss")} hint="3yr lock-in" />
            <MoneyInput label="Life Insurance" value={d.lic} onChange={set("lic")} />
            <MoneyInput label="Tuition Fees (2 kids)" value={d.tuitionFees} onChange={set("tuitionFees")} />
            <MoneyInput label="Others (NSC, SCSS, FD)" value={d.others80C} onChange={set("others80C")} />
            <div style={{ height: 5, background: "#F5F5F4", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (result.old.sec80C / 150000) * 100)}%`, height: "100%", borderRadius: 2, transition: "width 0.4s", background: result.old.sec80C >= 150000 ? C.green : C.amber }} />
            </div>
            <div style={{ fontSize: 11, color: result.old.sec80C >= 150000 ? C.green : C.muted, marginTop: 4, fontWeight: 600 }}>
              {result.old.sec80C >= 150000 ? "✅ 80C maxed!" : `${fmt(result.gap80C)} remaining`}
            </div>
          </Card>
        )}

        {d.hasHealthInsurance && (
          <Card title="Health Insurance (80D)" step="4" active={false}>
            <MoneyInput label="Self & Family" value={d.healthInsuranceSelf} onChange={set("healthInsuranceSelf")} hint="Max ₹25K / ₹50K senior" max={50000} />
            <MoneyInput label="Parents" value={d.healthInsuranceParents} onChange={set("healthInsuranceParents")} hint="Max ₹25K / ₹50K senior" max={50000} />
          </Card>
        )}

        {d.hasNPS && (
          <Card title="NPS" step="5" active={false} subtitle="Extra deductions beyond 80C">
            <MoneyInput label="Your NPS (80CCD(1B))" value={d.nps80CCD1B} onChange={set("nps80CCD1B")} hint="Max ₹50K" max={50000} />
            <MoneyInput label="Employer NPS (80CCD(2))" value={d.employerNPS} onChange={set("employerNPS")} hint="Both regimes" />
          </Card>
        )}

        {d.hasHomeLoan && (
          <Card title="Home Loan" step="6" active={false}>
            <MoneyInput label="Interest Paid (Annual)" value={d.homeLoanInterest} onChange={set("homeLoanInterest")} hint="Max ₹2L" max={200000} />
            <MoneyInput label="Principal Repaid" value={d.homeLoanPrincipal} onChange={set("homeLoanPrincipal")} hint="Counted in 80C" />
          </Card>
        )}

        {d.hasOtherIncome && (
          <Card title="Other Income" step="7" active={false} subtitle="Taxed in both regimes">
            <MoneyInput label="FD / RD Interest" value={d.fdInterest} onChange={set("fdInterest")} hint="From 26AS/AIS" />
            <MoneyInput label="Rental Income" value={d.rentalIncome} onChange={set("rentalIncome")} />
            <MoneyInput label="Savings A/c Interest" value={d.savingsInterest} onChange={set("savingsInterest")} hint="₹10K exempt (80TTA)" max={10000} />
          </Card>
        )}

        {/* ═══ RESULTS — Live, always visible ═══ */}
        {d.grossSalary > 0 && (
          <div style={{ animation: "fadeUp 0.4s ease", marginTop: 8 }}>
            <div style={{
              background: `linear-gradient(135deg, ${C.dark}, #44403C)`,
              borderRadius: 16, padding: 22, color: "#fff", marginBottom: 16,
            }}>
              <div style={{ fontSize: 10, color: "#78716C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                Tax Comparison — FY 2025-26
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#A8A29E" }}>ANNUAL TAKE-HOME ({result.winner === "old" ? "Old" : "New"})</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.1 }}>{fmt(takeHome)}</div>
                  <div style={{ fontSize: 12, color: "#A8A29E" }}>{fmt(Math.round(takeHome / 12))}/month</div>
                </div>
                <div style={{ background: "rgba(217,119,6,0.15)", border: "1px solid rgba(217,119,6,0.3)", borderRadius: 12, padding: "8px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: C.amber, fontWeight: 700, textTransform: "uppercase" }}>{result.savings > 0 ? "You save" : "Same"}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.amber, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(result.savings)}</div>
                  <div style={{ fontSize: 11, color: C.amber }}>with {result.winner === "old" ? "Old" : "New"}</div>
                </div>
              </div>
            </div>

            {/* Regime cards — responsive */}
            <div style={{ display: "flex", gap: 12, marginBottom: 0, flexWrap: "wrap" }}>
              <RegimeCard label="Old" res={result.old} isWinner={result.winner === "old"} savings={result.savings} rate={result.effectiveRateOld} />
              <RegimeCard label="New" res={result.new} isWinner={result.winner === "new"} savings={result.savings} rate={result.effectiveRateNew} />
            </div>

            {/* Old regime deductions */}
            <div style={{ background: C.indigoBg, border: "1px solid #C7D2FE", borderRadius: 12, padding: 16, marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.indigo, marginBottom: 8 }}>📋 Old Regime Deductions</div>
              {[
                { l: "Standard Deduction", v: 50000 },
                result.old.hra > 0 && { l: "HRA Exemption", v: result.old.hra },
                result.old.lta > 0 && { l: "LTA", v: result.old.lta },
                result.old.sec80C > 0 && { l: "80C (EPF+PPF+ELSS+LIC…)", v: result.old.sec80C },
                result.old.sec80CCD1B > 0 && { l: "80CCD(1B) NPS", v: result.old.sec80CCD1B },
                result.old.sec80CCD2 > 0 && { l: "80CCD(2) Employer NPS", v: result.old.sec80CCD2 },
                result.old.sec80D > 0 && { l: "80D Health Insurance", v: result.old.sec80D },
                result.old.sec24b > 0 && { l: "24(b) Home Loan", v: result.old.sec24b },
                result.old.sec80E > 0 && { l: "80E Education Loan", v: result.old.sec80E },
                result.old.sec80TTA > 0 && { l: "80TTA", v: result.old.sec80TTA },
                result.old.profTax > 0 && { l: "Professional Tax", v: result.old.profTax },
              ].filter(Boolean).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0", color: "#4338CA" }}>
                  <span>{r.l}</span><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{fmt(r.v)}</span>
                </div>
              ))}
              <div style={{ borderTop: "2px solid #A5B4FC", marginTop: 8, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: C.indigo }}>
                <span>Total</span><span style={{ fontFamily: "monospace" }}>{fmt(result.old.totalDeductions)}</span>
              </div>
            </div>

            {/* Suggestions */}
            {result.marginalRate > 0 && (result.gap80C > 0 || result.gap80CCD1B > 0 || result.gap80D > 0) && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  💡 Tax Saving Tips
                  <span style={{ fontSize: 10, background: C.indigoBg, color: C.indigo, padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>OLD REGIME</span>
                </div>
                {result.winner === "new" && result.savings > 15000 && (
                  <div style={{ fontSize: 11, color: C.amber, background: C.amberBg, padding: "6px 10px", borderRadius: 8, marginBottom: 8, border: `1px solid ${C.amberLight}` }}>
                    ⚠️ New Regime saves you {fmt(result.savings)} more right now. These tips apply only if you switch to Old Regime.
                  </div>
                )}
                {[
                  result.gap80C > 0 && { icon: "💰", title: `Invest ${fmt(result.gap80C)} more in 80C`, desc: `EPF auto-deducts ${fmt(result.epfEmployee)}. Fill gap with PPF/ELSS/LIC.`, save: Math.round(result.gap80C * result.marginalRate) },
                  result.gap80CCD1B > 0 && { icon: "🏦", title: `Add ${fmt(result.gap80CCD1B)} to NPS`, desc: "Additional ₹50K over 80C. Market-linked returns.", save: Math.round(result.gap80CCD1B * result.marginalRate) },
                  result.gap80D > 0 && { icon: "🏥", title: `Get health insurance`, desc: `₹25K self + ₹25-50K parents under 80D.`, save: Math.round(Math.min(25000, result.gap80D) * result.marginalRate) },
                ].filter(Boolean).map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: "#FAFAF9", marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t.desc}</div>
                    </div>
                    {t.save > 0 && (
                      <div style={{ background: C.greenBg, color: C.green, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, fontFamily: "monospace", alignSelf: "center", whiteSpace: "nowrap" }}>↓{fmt(t.save)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 10, color: C.light, lineHeight: 1.6, padding: "10px 14px", background: "#F5F5F4", borderRadius: 10, border: `1px solid ${C.border}` }}>
              <strong>Disclaimer:</strong> TaxSakhi provides estimates for FY 2025-26 (IT Act 1961, Finance Act 2025). Not professional tax advice. Doesn't cover all edge cases (marginal relief, capital gains, Sec 10 exemptions). Consult a CA before filing.
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>TaxSakhi</div>
          <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>Smart tax planning for salaried Indians · FY 2025-26 · v2.0</div>
        </div>
      </div>
    </div>
  );
}
