import { useState, useRef, useEffect } from "react";
import { BarChart3, AlertCircle, VolumeX, Scale, ShieldAlert, HeartPulse, MessageSquare, MapPin } from 'lucide-react';

// ─── Google Fonts ────────────────────────────────────────────────────────────
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', system-ui, sans-serif; background: #0D1117; color: #F5F0FA; height: 100vh; overflow: hidden; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes breathe { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:.8; transform:scale(1.12); } }
  @keyframes dotPulse { 0%,80%,100% { transform:scale(.6); opacity:.4; } 40% { transform:scale(1); opacity:1; } }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
  ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#2A1F3D;border-radius:4px}
`;

const C = {
  bg:"#0D1117", sidebar:"#10151E", border:"#1C2333",
  mauve:"#C9A7E3", mauveDeep:"#8B5DBF", blush:"#F2A7B8",
  sage:"#7FB5A0", userBubble:"#1A2340", userBdr:"#2A3A6A",
  aiBubble:"#160E24", aiBdr:"#3D2560", surface:"#161B27",
  inputBg:"#111827", inputBdr:"#2A3350",
  textMuted:"#7B7A9E", textDim:"#4A4870",
  emergency:"#2D1219", emergencyBdr:"#8B2A3A",
  success:"#1a3a2a", successBdr:"#4ADE80",
  error:"#3a1a1a", errorBdr:"#F87171",
  warning:"#3a2a1a", warningBdr:"#FBBF24",
};

const ADMIN_USER = "admin";
const ADMIN_PASS = "kiki2025";

const MOCK_INTERACTIONS = [
  { id:1, time:"09:14", question:"What is the VAPP Act?", status:"Answered" },
  { id:2, time:"10:02", question:"What should a rape survivor do immediately?", status:"Answered" },
  { id:3, time:"11:30", question:"Where can survivors get help in Nigeria?", status:"Answered" },
  { id:4, time:"13:45", question:"What services do SARCs provide?", status:"Answered" },
  { id:5, time:"14:20", question:"What are the legal rights of GBV survivors?", status:"Answered" },
  { id:6, time:"15:05", question:"How do I report domestic violence?", status:"Answered" },
  { id:7, time:"16:10", question:"Is there free legal aid available?", status:"Answered" },
  { id:8, time:"17:00", question:"What is emotional abuse under VAPP?", status:"Answered" },
];

const DEMO_QS = [
  "What is the VAPP Act?",
  "What should a rape survivor do immediately?",
  "Where can survivors get help in Nigeria?",
  "What services do SARCs provide?",
  "What are the legal rights of GBV survivors?",
  "How can I report gender-based violence?",
];

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const colors = {
    success: { bg: C.success, border: C.successBdr, icon: "✅" },
    error:   { bg: C.error,   border: C.errorBdr,   icon: "❌" },
    warning: { bg: C.warning, border: C.warningBdr, icon: "⚠️" },
  }[type] || { bg: C.surface, border: C.border, icon: "ℹ️" };
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:9999, background:colors.bg, border:`1px solid ${colors.border}`, borderRadius:10, padding:"12px 18px", display:"flex", alignItems:"center", gap:10, animation:"fadeIn .3s ease", boxShadow:"0 4px 20px #0008", maxWidth:340 }}>
      <span>{colors.icon}</span>
      <span style={{ fontSize:13, color:"#F5F0FA", flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:16 }}>x</button>
    </div>
  );
}

function ValidationMsg({ msg }) {
  if (!msg) return null;
  return <div style={{ background:C.error, border:`1px solid ${C.errorBdr}`, borderRadius:6, padding:"7px 12px", fontSize:12, color:"#FCA5A5", marginTop:4, animation:"fadeIn .2s ease" }}>x {msg}</div>;
}

function Badge({ label, color }) {
  const map = { green:[C.success,C.successBdr,"#4ADE80"], red:[C.error,C.errorBdr,"#F87171"], purple:[C.aiBubble,C.aiBdr,C.mauve] };
  const [bg,bdr,txt] = map[color] || map.purple;
  return <span style={{ background:bg, border:`1px solid ${bdr}`, color:txt, borderRadius:20, fontSize:11, padding:"2px 9px", fontWeight:500 }}>{label}</span>;
}

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onGoChat }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors]     = useState({});
  const [shake, setShake]       = useState(false);
  const [loading, setLoading]   = useState(false);

  function validate() {
    const e = {};
    if (!username.trim())       e.username = "Username is required.";
    if (!password)              e.password = "Password is required.";
    else if (password.length<4) e.password = "Password must be at least 4 characters.";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); setShake(true); setTimeout(()=>setShake(false),500); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,800));
    if (username===ADMIN_USER && password===ADMIN_PASS) {
      onLogin();
    } else {
      setErrors({ form:"Invalid username or password. Please try again." });
      setShake(true); setTimeout(()=>setShake(false),500);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, padding:20 }}>
      <div style={{ width:"100%", maxWidth:420, animation:"fadeIn .4s ease" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", margin:"0 auto 16px", background:`linear-gradient(135deg,${C.mauveDeep},${C.blush})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, boxShadow:`0 0 30px ${C.mauveDeep}50` }}>🌸</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.mauve }}>Kiki Support System</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:4 }}>Administrator Login</div>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:32, animation:shake?"shake .4s ease":"none" }}>
          {errors.form && <div style={{ background:C.error, border:`1px solid ${C.errorBdr}`, borderRadius:8, padding:"10px 14px", marginBottom:20, fontSize:13, color:"#FCA5A5" }}>🔒 {errors.form}</div>}
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:12, color:C.textMuted, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em" }}>Username</label>
            <input value={username} onChange={e=>{ setUsername(e.target.value); setErrors({}); }} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="Enter your username"
              style={{ width:"100%", background:C.inputBg, border:`1px solid ${errors.username?C.errorBdr:C.inputBdr}`, borderRadius:8, padding:"11px 14px", color:"#F5F0FA", fontSize:14, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
            <ValidationMsg msg={errors.username} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:12, color:C.textMuted, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em" }}>Password</label>
            <input type="password" value={password} onChange={e=>{ setPassword(e.target.value); setErrors({}); }} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="Enter your password"
              style={{ width:"100%", background:C.inputBg, border:`1px solid ${errors.password?C.errorBdr:C.inputBdr}`, borderRadius:8, padding:"11px 14px", color:"#F5F0FA", fontSize:14, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
            <ValidationMsg msg={errors.password} />
          </div>
          <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:"12px", borderRadius:10, border:"none", cursor:loading?"not-allowed":"pointer", background:`linear-gradient(135deg,${C.mauveDeep},${C.blush})`, color:"white", fontSize:14, fontWeight:600, fontFamily:"'DM Sans',sans-serif", opacity:loading?0.7:1, boxShadow:`0 0 20px ${C.mauveDeep}40` }}>
            {loading?"Verifying…":"Sign in to Dashboard"}
          </button>
          <div style={{ textAlign:"center", marginTop:20 }}>
            <button onClick={onGoChat} style={{ background:"none", border:"none", color:C.textMuted, fontSize:12, cursor:"pointer", textDecoration:"underline" }}>← Return to Kiki chat</button>
          </div>
        </div>
        <div style={{ textAlign:"center", fontSize:11, color:C.textDim, marginTop:16 }}>Demo credentials: admin / kiki2025</div>
      </div>
    </div>
  );
}

// ── ADMIN SHELL ───────────────────────────────────────────────────────────────
function AdminShell({ onLogout, onGoChat }) {
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const showToast = (msg,type="success") => setToast({msg,type});

  const tabs = [
    { id:"dashboard", icon:"📊", label:"Dashboard" },
    { id:"dataentry", icon:"➕", label:"Data Entry" },
    { id:"reports",   icon:"📋", label:"Reports" },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
      <aside style={{ width:220, background:C.sidebar, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"24px 16px", flexShrink:0 }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:C.mauve }}>Kiki Admin</div>
          <div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>System Management</div>
        </div>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ width:"100%", textAlign:"left", background:tab===t.id?`${C.mauveDeep}30`:"transparent", border:tab===t.id?`1px solid ${C.mauveDeep}60`:"1px solid transparent", borderRadius:8, padding:"9px 12px", color:tab===t.id?C.mauve:C.textMuted, fontSize:13, cursor:"pointer", marginBottom:4, display:"flex", alignItems:"center", gap:9 }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
        <div style={{ marginTop:"auto" }}>
          <button onClick={onGoChat} style={{ width:"100%", textAlign:"left", background:"transparent", border:"1px solid transparent", borderRadius:8, padding:"9px 12px", color:C.textMuted, fontSize:13, cursor:"pointer", marginBottom:4, display:"flex", alignItems:"center", gap:9 }}>💬 Open Chat</button>
          <button onClick={onLogout} style={{ width:"100%", textAlign:"left", background:C.emergency, border:`1px solid ${C.emergencyBdr}`, borderRadius:8, padding:"9px 12px", color:"#F2A7B8", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:9 }}>🚪 Sign out</button>
        </div>
      </aside>
      <main style={{ flex:1, overflowY:"auto", padding:"28px 32px", background:C.bg }}>
        {tab==="dashboard" && <DashboardTab />}
        {tab==="dataentry" && <DataEntryTab showToast={showToast} />}
        {tab==="reports"   && <ReportsTab />}
      </main>
    </div>
  );
}

// ── DASHBOARD TAB ─────────────────────────────────────────────────────────────
function DashboardTab() {
  const stats = [
  { value: "1 in 3", label: "Nigerian women experience physical or sexual violence in their lifetime", icon: <BarChart3 size={24} color="#F2A7B8" /> },
  { value: "30%", label: "of girls experience sexual violence before age 18", icon: <AlertCircle size={24} color="#F2A7B8" /> },
  { value: "56%", label: "of GBV cases go unreported due to stigma and fear", icon: <VolumeX size={24} color="#F2A7B8" /> },
  { value: "36 States", label: "covered by the Violence Against Persons Prohibition Act 2015", icon: <Scale size={24} color="#F2A7B8" /> }
];
  return (
    <div style={{ animation:"fadeIn .3s ease" }}>
      <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.mauve, marginBottom:4 }}>Dashboard</h1>
      <p style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>System overview — today's activity</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, marginBottom:28 }}>
        {stats.map(s=>(
          <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 20px" }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:26, fontWeight:700, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:C.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
        <div style={{ fontSize:14, fontWeight:600, color:"#F5F0FA", marginBottom:16 }}>Recent Interactions</div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["#","Time","Question","Status"].map(h=>(
                <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_INTERACTIONS.map(row=>(
              <tr key={row.id} style={{ borderBottom:`1px solid ${C.border}20` }}>
                <td style={{ padding:"10px 12px", fontSize:12, color:C.textDim }}>{row.id}</td>
                <td style={{ padding:"10px 12px", fontSize:12, color:C.textMuted }}>{row.time}</td>
                <td style={{ padding:"10px 12px", fontSize:13, color:"#EDE8F8" }}>{row.question}</td>
                <td style={{ padding:"10px 12px" }}><Badge label={row.status} color="green" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── DATA ENTRY TAB ────────────────────────────────────────────────────────────
function DataEntryTab({ showToast }) {
  const [centres, setCentres] = useState([
    { id:1, name:"WARIF Centre Lagos", state:"Lagos", phone:"0809-210-0009", type:"SARC" },
    { id:2, name:"Mirabel Centre", state:"Lagos", phone:"0818-787-0000", type:"SARC" },
    { id:3, name:"NAPTIP Office Abuja", state:"FCT", phone:"0800-NAPTIP", type:"Government" },
  ]);
  const [form, setForm]     = useState({ name:"", state:"", phone:"", type:"SARC" });
  const [errors, setErrors] = useState({});
  const [editId, setEditId] = useState(null);

  const STATES = ["Lagos","FCT","Kano","Rivers","Oyo","Enugu","Kaduna","Anambra","Delta","Imo"];
  const TYPES  = ["SARC","Hospital","Government","NGO","Police"];

  function validate() {
    const e = {};
    if (!form.name.trim())  e.name  = "Centre name is required.";
    if (!form.state)        e.state = "Please select a state.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    else if (!/^[\d\-\+\s]{7,}$/.test(form.phone)) e.phone = "Enter a valid phone number.";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editId) {
      setCentres(prev=>prev.map(c=>c.id===editId?{...c,...form}:c));
      showToast("Support centre updated successfully.","success");
      setEditId(null);
    } else {
      setCentres(prev=>[...prev,{id:Date.now(),...form}]);
      showToast("Support centre added successfully.","success");
    }
    setForm({ name:"", state:"", phone:"", type:"SARC" });
    setErrors({});
  }

  function handleEdit(c) { setForm({name:c.name,state:c.state,phone:c.phone,type:c.type}); setEditId(c.id); setErrors({}); }
  function handleDelete(id) { setCentres(prev=>prev.filter(c=>c.id!==id)); showToast("Centre removed.","warning"); }

  return (
    <div style={{ animation:"fadeIn .3s ease" }}>
      <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.mauve, marginBottom:4 }}>Data Entry</h1>
      <p style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>Add or update support centres and emergency contacts</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.5fr", gap:24, alignItems:"start" }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontSize:14, fontWeight:600, color:"#F5F0FA", marginBottom:20 }}>{editId?"Edit Centre":"Add New Centre"}</div>

          {[["Centre Name","name","e.g. WARIF Centre Lagos"],["Phone Number","phone","e.g. 0809-210-0009"]].map(([label,key,ph])=>(
            <div key={key} style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, color:C.textMuted, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</label>
              <input value={form[key]} placeholder={ph} onChange={e=>{ setForm(p=>({...p,[key]:e.target.value})); setErrors(p=>({...p,[key]:undefined})); }}
                style={{ width:"100%", background:C.inputBg, border:`1px solid ${errors[key]?C.errorBdr:C.inputBdr}`, borderRadius:8, padding:"10px 13px", color:"#F5F0FA", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
              <ValidationMsg msg={errors[key]} />
            </div>
          ))}

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:11, color:C.textMuted, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.08em" }}>State</label>
            <select value={form.state} onChange={e=>{ setForm(p=>({...p,state:e.target.value})); setErrors(p=>({...p,state:undefined})); }}
              style={{ width:"100%", background:C.inputBg, border:`1px solid ${errors.state?C.errorBdr:C.inputBdr}`, borderRadius:8, padding:"10px 13px", color:form.state?"#F5F0FA":C.textDim, fontSize:13, outline:"none" }}>
              <option value="">Select state…</option>
              {STATES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <ValidationMsg msg={errors.state} />
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, color:C.textMuted, display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>Centre Type</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {TYPES.map(t=>(
                <button key={t} onClick={()=>setForm(p=>({...p,type:t}))} style={{ padding:"6px 14px", borderRadius:20, fontSize:12, cursor:"pointer", background:form.type===t?`${C.mauveDeep}40`:"transparent", border:form.type===t?`1px solid ${C.mauve}`:`1px solid ${C.border}`, color:form.type===t?C.mauve:C.textMuted }}>{t}</button>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handleSave} style={{ flex:1, padding:"11px", borderRadius:9, border:"none", cursor:"pointer", background:`linear-gradient(135deg,${C.mauveDeep},${C.blush})`, color:"white", fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
              {editId?"Save Changes":"Add Centre"}
            </button>
            {editId && <button onClick={()=>{ setEditId(null); setForm({name:"",state:"",phone:"",type:"SARC"}); setErrors({}); }} style={{ padding:"11px 16px", borderRadius:9, border:`1px solid ${C.border}`, cursor:"pointer", background:"transparent", color:C.textMuted, fontSize:13 }}>Cancel</button>}
          </div>
        </div>

        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontSize:14, fontWeight:600, color:"#F5F0FA", marginBottom:16 }}>Registered Support Centres</div>
          {centres.map(c=>(
            <div key={c.id} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#EDE8F8", marginBottom:3 }}>{c.name}</div>
                  <div style={{ fontSize:12, color:C.textMuted }}>{c.state} · {c.phone}</div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <Badge label={c.type} color="purple" />
                  <button onClick={()=>handleEdit(c)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 10px", color:C.textMuted, fontSize:11, cursor:"pointer" }}>Edit</button>
                  <button onClick={()=>handleDelete(c.id)} style={{ background:C.emergency, border:`1px solid ${C.emergencyBdr}`, borderRadius:6, padding:"4px 10px", color:"#F2A7B8", fontSize:11, cursor:"pointer" }}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── REPORTS TAB ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const hourly = [{h:"08:00",q:3},{h:"09:00",q:7},{h:"10:00",q:12},{h:"11:00",q:9},{h:"12:00",q:5},{h:"13:00",q:8},{h:"14:00",q:11},{h:"15:00",q:6},{h:"16:00",q:4},{h:"17:00",q:2}];
  const maxQ = Math.max(...hourly.map(h=>h.q));
  const topics = [
    { label:"Legal rights & VAPP Act", pct:34 },
    { label:"Immediate steps after assault", pct:27 },
    { label:"Support centre locations", pct:19 },
    { label:"SARC services", pct:12 },
    { label:"Reporting GBV", pct:8 },
  ];
  return (
    <div style={{ animation:"fadeIn .3s ease" }}>
      <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.mauve, marginBottom:4 }}>Reports</h1>
      <p style={{ fontSize:13, color:C.textMuted, marginBottom:24 }}>System usage and interaction statistics</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#F5F0FA", marginBottom:16 }}>Queries by Hour (Today)</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:130, paddingBottom:20 }}>
            {hourly.map(h=>(
              <div key={h.h} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ fontSize:10, color:C.textDim }}>{h.q}</div>
                <div style={{ width:"100%", borderRadius:"4px 4px 0 0", height:`${(h.q/maxQ)*90}px`, background:`linear-gradient(to top,${C.mauveDeep},${C.blush})` }} />
                <div style={{ fontSize:9, color:C.textDim }}>{h.h.slice(0,5)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#F5F0FA", marginBottom:16 }}>Top Query Topics</div>
          {topics.map(t=>(
            <div key={t.label} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, color:"#EDE8F8" }}>{t.label}</span>
                <span style={{ fontSize:12, color:C.mauve, fontWeight:600 }}>{t.pct}%</span>
              </div>
              <div style={{ height:6, background:C.border, borderRadius:3 }}>
                <div style={{ height:"100%", width:`${t.pct}%`, background:`linear-gradient(to right,${C.mauveDeep},${C.blush})`, borderRadius:3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#F5F0FA", marginBottom:16 }}>Full Interaction Log</div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["ID","Timestamp","User Query","RAG Status"].map(h=>(
                <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_INTERACTIONS.map(row=>(
              <tr key={row.id} style={{ borderBottom:`1px solid ${C.border}20` }}>
                <td style={{ padding:"10px 12px", fontSize:12, color:C.textDim }}>{String(row.id).padStart(3,"0")}</td>
                <td style={{ padding:"10px 12px", fontSize:12, color:C.textMuted }}>2026-07-11 {row.time}</td>
                <td style={{ padding:"10px 12px", fontSize:13, color:"#EDE8F8" }}>{row.question}</td>
                <td style={{ padding:"10px 12px" }}><Badge label="Retrieved" color="green" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CHAT PAGE ─────────────────────────────────────────────────────────────────
// ── CHAT PAGE ─────────────────────────────────────────────────────────────────
function ChatPage({ onGoAdmin }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [inputError, setInputError] = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendMessage(text) {
    const question = (text || input).trim();
    if (!question) { setInputError("Please type a question before sending."); return; }
    if (question.length < 3) { setInputError("Your message is too short. Please describe your question."); return; }
    setInputError("");
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8001/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question }) });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.answer, sources: data.sources || [] }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I am having trouble connecting to my local legal database right now. Please ensure the backend server is active.", sources: [] }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  }

  function handleKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* SIDEBAR PANEL */}
      <aside style={{ width: 260, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: "24px 16px", overflowY: "auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: C.mauve, marginBottom: 3 }}>Kiki Support</div>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Nigeria · RAG System</div>
        </div>
        <div style={{ background: C.emergency, border: `1px solid ${C.emergencyBdr}`, borderRadius: 10, padding: "10px 13px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#F2A7B8", marginBottom: 6 }}>Emergency</div>
          {[["Emergency", "112"], ["WARIF Line", "0809-210-0009"], ["NAPTIP", "0800-NAPTIP"]].map(([l, n]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: C.textMuted }}>{l}</span>
              <span style={{ color: "#F5C0C8", fontWeight: 600 }}>{n}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: C.textDim, marginBottom: 10 }}>Try asking</div>
        {DEMO_QS.map(q => (
          <button key={q} onClick={() => sendMessage(q)} style={{ width: "100%", textAlign: "left", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 11px", color: C.textMuted, fontSize: 12, cursor: pointer, marginBottom: 6, lineHeight: 1.4 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1C2333"; e.currentTarget.style.color = C.mauve; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}
          >{q}</button>
        ))}
        <div style={{ marginTop: "auto" }}>
          <button onClick={onGoAdmin} style={{ width: "100%", textAlign: "left", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.textMuted, fontSize: 12, cursor: pointer, display: "flex", alignItems: "center", gap: 8 }}>
            Admin Dashboard
          </button>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bgChat || "#0B0F19" }}>
        <div style={{ flex: 1, padding: "24px 24px 0", overflowY: "auto" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 10, marginBottom: 20, animation: "fadeIn .3s ease" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: msg.role === "user" ? `linear-gradient(135deg,${C.userBdr},#3A5080)` : `linear-gradient(135deg,${C.mauveDeep},${C.blush})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                {msg.role === "user" ? "👤" : "🌸"}
              </div>
              <div style={{ maxWidth: "72%" }}>
                <div style={{ background: msg.role === "user" ? C.userBubble : C.aiBubble, border: `1px solid ${msg.role === "user" ? C.userBdr : C.aiBdr}`, borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.65, color: "#EDE8F8", whiteSpace: "pre-wrap" }}>
                  
                  {/* ─── ENHANCED TEXT FORMATTING ENGINE ─── */}
                  {msg.role === "user" 
                    ? msg.content 
                    : msg.content.split("\n").map((line, lineIdx) => {
                        // Function to convert **text** inside paragraphs to actual bold elements
                        const renderBoldText = (textStr) => {
                          const parts = textStr.split(/\*\*([\s\S]*?)\*\*/g);
                          return parts.map((part, index) => 
                            index % 2 === 1 ? <strong key={index} style={{ fontWeight: 700, color: C.mauve || "#F2A7B8" }}>{part}</strong> : part
                          );
                        };

                        const trimmedLine = line.trim();
                        if (!trimmedLine) return <div key={lineIdx} style={{ height: "8px" }} />;

                        // Detect if this line should act as an explicit heading
                        const isHeading = (trimmedLine.startsWith("**") && trimmedLine.endsWith("**")) || trimmedLine.endsWith(":");
                        
                        if (isHeading) {
                          // Strip header tokens and render nicely
                          const cleanHeading = trimmedLine.replace(/\*\*|\*/g, "");
                          return (
                            <div key={lineIdx} style={{ fontWeight: 600, color: C.mauve || "#F2A7B8", marginTop: lineIdx > 0 ? "14px" : "0px", marginBottom: "6px", fontSize: "14.5px" }}>
                              {cleanHeading}
                            </div>
                          );
                        }

                        // Style clean bullet points
                        const isListItem = trimmedLine.startsWith("*") || trimmedLine.startsWith("-");
                        if (isListItem) {
                          const cleanListLine = trimmedLine.replace(/^[\*\-]\s*/, "");
                          return (
                            <div key={lineIdx} style={{ paddingLeft: "16px", marginBottom: "4px" }}>
                              • {renderBoldText(cleanListLine)}
                            </div>
                          );
                        }

                        // Normal paragraph lines
                        return (
                          <div key={lineIdx} style={{ marginBottom: "6px" }}>
                            {renderBoldText(line)}
                          </div>
                        );
                      })
                  }
                </div>
                
                {msg.sources?.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {msg.sources.map((s, j) => (
                      <span key={j} style={{ display: "inline-block", background: `${C.sage}20`, color: C.sage, border: `1px solid ${C.sage}40`, borderRadius: 20, fontSize: 11, padding: "2px 9px", margin: "2px 3px" }}>📄 {s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${C.mauveDeep},${C.blush})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, animation: "breathe 1.8s ease-in-out infinite" }}>🌸</div>
              <div style={{ background: C.aiBubble, border: `1px solid ${C.aiBdr}`, borderRadius: "4px 16px 16px 16px", padding: "14px 18px", display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.mauve, display: "inline-block", animation: `dotPulse 1.2s ease-in-out ${i * .2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* BOTTOM INPUT CONTAINER */}
        <div style={{ padding: "12px 24px 18px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          {inputError && <div style={{ background: C.error, border: `1px solid ${C.errorBdr}`, borderRadius: 7, padding: "7px 12px", fontSize: 12, color: "#FCA5A5", marginBottom: 8, animation: "fadeIn .2s ease" }}>⚠️ {inputError}</div>}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: C.inputBg, border: `1px solid ${C.inputBdr}`, borderRadius: 14, padding: "10px 14px" }}>
            <textarea ref={inputRef} rows={1} value={input}
              onChange={e => { setInput(e.target.value); setInputError(""); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
              onKeyDown={handleKey} placeholder="Ask about your rights, support services, or next steps…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#F5F0FA", fontSize: 14, resize: "none", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, maxHeight: 120 }} />
            <button onClick={() => sendMessage()} disabled={loading} style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, border: "none", cursor: loading ? "not-allowed" : "pointer", background: loading ? C.textDim : `linear-gradient(135deg,${C.mauveDeep},${C.blush})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>➤</button>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: C.textDim, marginTop: 7 }}>Answers grounded in official documents · Not a substitute for professional legal or medical advice</div>
        </div>
      </main>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]   = useState("chat");
  const [authed, setAuthed] = useState(false);

  function goAdmin() { authed ? setPage("admin") : setPage("login"); }
  function handleLogin() { setAuthed(true); setPage("admin"); }
  function handleLogout() { setAuthed(false); setPage("chat"); }

  return (
    <>
      <style>{FONTS}</style>
      {page==="chat"  && <ChatPage onGoAdmin={goAdmin} />}
      {page==="login" && <LoginPage onLogin={handleLogin} onGoChat={()=>setPage("chat")} />}
      {page==="admin" && authed && <AdminShell onLogout={handleLogout} onGoChat={()=>setPage("chat")} />}
    </>
  );
}
