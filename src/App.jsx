import { useState, useEffect, useCallback } from "react";
import { getShared, setShared } from "./sharedStorage.js";

// ─── DATOS DEL MUNDIAL 2026 ───────────────────────────────────────────────────
// ✏️  EDITA AQUÍ los grupos y equipos
const GROUPS = {
  A: ["México", "Sudáfrica", "Corea del Sur", "Chequia"],
  B: ["Canadá", "Bosnia y Herzegovina", "Catar", "Suiza"],
  C: ["Brasil", "Marruecos", "Haití", "Escocia"],
  D: ["Estados Unidos", "Paraguay", "Australia", "Turquía"],
  E: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"],
  F: ["Paises Bajos", "Japón", "Suecia", "Túnez"],
  G: ["Bélgica", "Egipto", "Irán", "Nueva Zelanda"],
  H: ["España", "Cabo Verde", "Arabia Saudita", "Uruguay"],
  I: ["Francia", "Senegal", "Irak", "Noruega"],
  J: ["Argentina", "Argelia", "Austria", "Jordania"],
  K: ["Portugal", "RD Congo", "Uzbekistán", "Colombia"],
  L: ["Inglaterra", "Croacia", "Ghana", "Panamá"],
};

// ✏️  EDITA AQUÍ los cruces de ronda de 32
// Usa "1X" para 1er lugar grupo X, "2X" para 2do, "3X" para 3ro
const R32_SEEDS = [
  ["1A","2C"],["1C","2A"],["1B","2D"],["1D","2B"],
  ["1E","2G"],["1G","2E"],["1F","2H"],["1H","2F"],
  ["1I","2K"],["1K","2I"],["1J","2L"],["1L","2J"],
  ["3A","3B"],["3C","3D"],["3E","3F"],["3G","3H"],
];

// ✏️  Emojis de bandera por equipo
const FLAGS = {
  "Alemania": "🇩🇪",
  "Arabia Saudita": "🇸🇦",
  "Argelia": "🇩🇿",
  "Argentina": "🇦🇷",
  "Australia": "🇦🇺",
  "Austria": "🇦🇹",
  "Bélgica": "🇧🇪",
  "Brasil": "🇧🇷",
  "Cabo Verde": "🇨🇻",
  "Canadá": "🇨🇦",
  "Colombia": "🇨🇴",
  "Corea del Sur": "🇰🇷",
  "Costa de Marfil": "🇨🇮",
  "Costa Rica": "🇨🇷",
  "Croacia": "🇭🇷",
  "Curazao": "🇨🇼",
  "Ecuador": "🇪🇨",
  "Egipto": "🇪🇬",
  "Arabia Saudita": "🇦🇪",
  "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "España": "🇪🇸",
  "Estados Unidos": "🇺🇸",
  "Francia": "🇫🇷",
  "Ghana": "🇬🇭",
  "Haití": "🇭🇹",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Irán": "🇮🇷",
  "Japón": "🇯🇵",
  "Marruecos": "🇲🇦",
  "México": "🇲🇽",
  "Noruega": "🇳🇴",
  "Nueva Zelanda": "🇳🇿",
  "Países Bajos": "🇳🇱",
  "Panamá": "🇵🇦",
  "Paraguay": "🇵🇾",
  "Portugal": "🇵🇹",
  "Qatar": "🇶🇦",
  "Senegal": "🇸🇳",
  "Sudáfrica": "🇿🇦",
  "Túnez": "🇹🇳",
  "Uruguay": "🇺🇾",
  "Uzbekistán": "🇺🇿"
};
const flag = t => FLAGS[t] || "⚽";

const ADMIN_PIN = "1234";

// Partidos de cada grupo (round robin)
const GROUP_MATCHES = {};
Object.entries(GROUPS).forEach(([g, teams]) => {
  GROUP_MATCHES[g] = [
    [teams[0],teams[1]],[teams[2],teams[3]],
    [teams[0],teams[2]],[teams[1],teams[3]],
    [teams[0],teams[3]],[teams[1],teams[2]],
  ];
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function calcStandings(groupResults, group) {
  const teams = GROUPS[group];
  const s = {};
  teams.forEach(t => { s[t] = { team:t, pts:0, gf:0, ga:0, gd:0, pj:0 }; });
  (GROUP_MATCHES[group]||[]).forEach(([h,a], i) => {
    const r = groupResults?.[i];
    if (!r || r.h==null || r.h==="" || r.a==null || r.a==="") return;
    const hg=parseInt(r.h), ag=parseInt(r.a);
    if (isNaN(hg)||isNaN(ag)) return;
    s[h].pj++; s[a].pj++;
    s[h].gf+=hg; s[h].ga+=ag; s[h].gd+=(hg-ag);
    s[a].gf+=ag; s[a].ga+=hg; s[a].gd+=(ag-hg);
    if (hg>ag) s[h].pts+=3;
    else if (hg<ag) s[a].pts+=3;
    else { s[h].pts+=1; s[a].pts+=1; }
  });
  return Object.values(s).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
}

function getWinner(home, away, result) {
  if (!result||result.h==null||result.h===""||result.a==null||result.a==="") return "?";
  const hg=parseInt(result.h), ag=parseInt(result.a);
  if (isNaN(hg)||isNaN(ag)) return "?";
  if (hg>ag) return home;
  if (hg<ag) return away;
  const ph=parseInt(result.ph||0), pa=parseInt(result.pa||0);
  if (!isNaN(ph)&&!isNaN(pa)&&ph!==pa) return ph>pa?home:away;
  return "?";
}

function buildNextRound(pairs, results) {
  const winners = pairs.map(([h,a],i)=>getWinner(h,a,results?.[i]));
  const out=[];
  for(let i=0;i<winners.length;i+=2) out.push([winners[i]||"?",winners[i+1]||"?"]);
  return out;
}

function resolveR32(groupsData) {
  const cl = {};
  Object.keys(GROUPS).forEach(g => {
    const st = calcStandings(groupsData?.[g], g);
    cl[`1${g}`]=st[0]?.team||"?";
    cl[`2${g}`]=st[1]?.team||"?";
    cl[`3${g}`]=st[2]?.team||"?";
  });
  return R32_SEEDS.map(([h,a])=>[cl[h]||h, cl[a]||a]);
}

function buildBracket(pred) {
  const r32 = resolveR32(pred?.groups);
  const r16 = buildNextRound(r32, pred?.r32);
  const qf  = buildNextRound(r16, pred?.r16);
  const sf  = buildNextRound(qf,  pred?.qf);
  const fin = buildNextRound(sf,  pred?.sf);
  return { r32, r16, qf, sf, final:fin };
}

function calcScore(pred, actuals) {
  let score = 0;
  const ab = buildBracket(actuals);
  Object.keys(GROUPS).forEach(g => {
    (GROUP_MATCHES[g]||[]).forEach((_,i) => {
      const p=pred?.groups?.[g]?.[i], ac=actuals?.groups?.[g]?.[i];
      if (!p||!ac||p.h===""||ac.h==="") return;
      const ph=parseInt(p.h),pa=parseInt(p.a),ah=parseInt(ac.h),aa=parseInt(ac.a);
      if (isNaN(ph)||isNaN(pa)||isNaN(ah)||isNaN(aa)) return;
      if (ph===ah&&pa===aa) { score+=3; return; }
      const pr=ph>pa?"H":ph<pa?"A":"D", ar=ah>aa?"H":ah<aa?"A":"D";
      if (pr===ar) score+=1;
    });
  });
  const pb = buildBracket(pred);
  ["r32","r16","qf","sf","final"].forEach(rnd => {
    (pb[rnd]||[]).forEach(([th,ta],i) => {
      const p=pred?.[rnd]?.[i], ac=actuals?.[rnd]?.[i];
      const [ah2,aa2]=(ab[rnd]||[])[i]||["?","?"];
      if (!p||!ac||p.h===""||ac.h==="") return;
      const ph=parseInt(p.h),pa_=parseInt(p.a),ah=parseInt(ac.h),aa=parseInt(ac.a);
      if (isNaN(ph)||isNaN(pa_)||isNaN(ah)||isNaN(aa)) return;
      const pw=getWinner(th,ta,p), aw=getWinner(ah2,aa2,ac);
      if (pw!=="?"&&pw===aw) score+=2;
      if (ph===ah&&pa_===aa) score+=1;
    });
  });
  return score;
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────

async function sGet(key) {
  return await getShared(key);
}
async function sSet(key, val) {
  await setShared(key, val);
}

// ─── UI ───────────────────────────────────────────────────────────────────────

function NumInput({ val, onChange, disabled }) {
  return (
    <input type="number" min="0" max="30" value={val??""} disabled={disabled}
      onChange={e=>onChange(e.target.value)}
      style={{
        width:40,textAlign:"center",fontSize:17,fontWeight:700,
        padding:"5px 2px",borderRadius:8,
        border:disabled?"1px solid #e5e7eb":"1.5px solid #6ee7b7",
        background:disabled?"#f3f4f6":"#fff",
        color:disabled?"#9ca3af":"#111",outline:"none",
        MozAppearance:"textfield",appearance:"textfield",
      }}
    />
  );
}

function MatchCard({ home, away, result, onChange, readonly, showPen }) {
  const r = result||{h:"",a:"",ph:"",pa:""};
  const tied = !readonly&&showPen&&r.h!==""&&r.a!==""&&String(r.h)===String(r.a)&&r.h!=="";
  return (
    <div style={{marginBottom:9,background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",padding:"10px 10px"}}>
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <span style={{flex:1,textAlign:"right",fontSize:11.5,fontWeight:500,color:"#374151",lineHeight:1.3}}>
          {flag(home)} {home}
        </span>
        <NumInput val={r.h} onChange={v=>onChange({...r,h:v})} disabled={readonly}/>
        <span style={{color:"#d1d5db",fontWeight:700,fontSize:12,padding:"0 2px"}}>–</span>
        <NumInput val={r.a} onChange={v=>onChange({...r,a:v})} disabled={readonly}/>
        <span style={{flex:1,fontSize:11.5,fontWeight:500,color:"#374151",lineHeight:1.3}}>
          {flag(away)} {away}
        </span>
      </div>
      {tied&&(
        <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"center",marginTop:6}}>
          <span style={{fontSize:10,color:"#6b7280"}}>Penales:</span>
          <input type="number" min="0" max="20" value={r.ph||""} disabled={readonly}
            onChange={e=>onChange({...r,ph:e.target.value})}
            style={{width:34,textAlign:"center",fontSize:12,border:"1px solid #d1d5db",borderRadius:6,padding:"3px 1px"}}/>
          <span style={{color:"#d1d5db",fontSize:11}}>–</span>
          <input type="number" min="0" max="20" value={r.pa||""} disabled={readonly}
            onChange={e=>onChange({...r,pa:e.target.value})}
            style={{width:34,textAlign:"center",fontSize:12,border:"1px solid #d1d5db",borderRadius:6,padding:"3px 1px"}}/>
        </div>
      )}
    </div>
  );
}

function StandingsTable({ group, results }) {
  const st = calcStandings(results, group);
  return (
    <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 10px",marginTop:4}}>
      <div style={{fontSize:10,fontWeight:700,color:"#065f46",marginBottom:6,letterSpacing:.5}}>CLASIFICACIÓN</div>
      <table style={{width:"100%",fontSize:11.5,borderCollapse:"collapse"}}>
        <thead><tr style={{color:"#6b7280"}}>
          <th style={{textAlign:"left",paddingBottom:3,fontWeight:500}}></th>
          <th style={{width:20,fontWeight:500}}>PJ</th>
          <th style={{width:20,fontWeight:500}}>Pts</th>
          <th style={{width:20,fontWeight:500}}>GF</th>
          <th style={{width:20,fontWeight:500}}>GC</th>
          <th style={{width:26,fontWeight:500}}>DG</th>
        </tr></thead>
        <tbody>{st.map((s,i)=>(
          <tr key={s.team} style={{background:i<2?"rgba(22,163,74,.07)":"transparent"}}>
            <td style={{padding:"2.5px 0",fontWeight:i<2?600:400}}>
              {i<2&&<span style={{color:"#16a34a",marginRight:2,fontSize:8}}>▶</span>}
              {flag(s.team)} {s.team}
            </td>
            <td style={{textAlign:"center",color:"#6b7280"}}>{s.pj}</td>
            <td style={{textAlign:"center",fontWeight:700,color:i<2?"#16a34a":"#374151"}}>{s.pts}</td>
            <td style={{textAlign:"center"}}>{s.gf}</td>
            <td style={{textAlign:"center"}}>{s.ga}</td>
            <td style={{textAlign:"center",color:s.gd>0?"#16a34a":s.gd<0?"#dc2626":"#6b7280"}}>
              {s.gd>0?"+":""}{s.gd}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("login");
  const [myName, setMyName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [allData, setAllData] = useState({});
  const [actuals, setActuals] = useState({ groups:{} });
  const [tab, setTab] = useState("groups");
  const [grp, setGrp] = useState("A");
  const [viewingUser, setViewingUser] = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const syncAll = useCallback(async () => {
    setSyncing(true);
    const [ad, ac] = await Promise.all([sGet("m26:all"), sGet("m26:actuals")]);
    if (ad) setAllData(ad);
    if (ac) setActuals(ac);
    setLastSync(new Date());
    setSyncing(false);
  }, []);

  useEffect(() => {
    if (screen !== "login") {
      syncAll();
      const iv = setInterval(syncAll, 15000);
      return () => clearInterval(iv);
    }
  }, [screen, syncAll]);

  const myPred = allData[myName] || {};

  async function savePred(updated) {
    const next = { ...allData, [myName]: updated };
    setAllData(next);
    await sSet("m26:all", next);
  }

  async function saveActuals(updated) {
    setActuals(updated);
    await sSet("m26:actuals", updated);
  }

  function updateGroupPred(group, idx, val) {
    const g = { ...(myPred.groups||{}) };
    g[group] = [...(g[group]||Array(6).fill(null))];
    g[group][idx] = val;
    savePred({ ...myPred, groups: g });
  }

  function updateKnockPred(round, idx, val) {
    const arr = [...(myPred[round]||[])];
    arr[idx] = val;
    savePred({ ...myPred, [round]: arr });
  }

  function updateActualGroup(group, idx, val) {
    const g = { ...(actuals.groups||{}) };
    g[group] = [...(g[group]||Array(6).fill(null))];
    g[group][idx] = val;
    saveActuals({ ...actuals, groups: g });
  }

  function updateActualRound(round, idx, val) {
    const arr = [...(actuals[round]||[])];
    arr[idx] = val;
    saveActuals({ ...actuals, [round]: arr });
  }

  // ── LOGIN ──
  if (screen === "login") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0f172a 0%,#0f2027 40%,#1a3a2a 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"'Georgia',serif"}}>
      <div style={{fontSize:68,marginBottom:6}}>🏆</div>
      <h1 style={{color:"#f8fafc",fontSize:29,fontWeight:700,margin:"0 0 4px",letterSpacing:.5,textAlign:"center"}}>Quiniela</h1>
      <div style={{color:"#6ee7b7",fontSize:13,letterSpacing:4,marginBottom:36,fontFamily:"monospace",fontWeight:700}}>MUNDIAL 2026</div>
      <div style={{width:"100%",maxWidth:290}}>
        <input value={nameInput} onChange={e=>setNameInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&nameInput.trim()&&(setMyName(nameInput.trim()),setScreen("home"))}
          placeholder="Tu nombre..." autoFocus
          style={{width:"100%",boxSizing:"border-box",padding:"13px 16px",borderRadius:12,
            border:"1.5px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.08)",
            color:"#fff",fontSize:16,outline:"none",marginBottom:12}}/>
        <button disabled={!nameInput.trim()}
          onClick={()=>{setMyName(nameInput.trim());setScreen("home");}}
          style={{width:"100%",padding:"13px",borderRadius:12,border:"none",
            background:nameInput.trim()?"#059669":"#374151",
            color:"#fff",fontSize:16,fontWeight:700,cursor:nameInput.trim()?"pointer":"default",transition:"background .2s"}}>
          Entrar →
        </button>
        <p style={{color:"rgba(255,255,255,0.3)",fontSize:11,textAlign:"center",marginTop:16,lineHeight:1.7}}>
          Las quinielas son compartidas y visibles para todos.<br/>
          Tus cambios se guardan automáticamente.
        </p>
      </div>
    </div>
  );

  // ── HOME ──
  if (screen === "home") {
    const scores = Object.entries(allData)
      .map(([name, pred]) => ({ name, score: calcScore(pred, actuals) }))
      .sort((a,b) => b.score - a.score);
    const others = Object.keys(allData).filter(n => n !== myName);

    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0f172a,#0f2027,#1a3a2a)",fontFamily:"system-ui,sans-serif",padding:"22px 16px 40px"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
          <div>
            <div style={{color:"#6ee7b7",fontSize:10,letterSpacing:2,fontWeight:700}}>MUNDIAL 2026</div>
            <div style={{color:"#f8fafc",fontSize:21,fontWeight:700}}>⚽ {myName}</div>
          </div>
          <button onClick={()=>{setMyName("");setScreen("login");}}
            style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:9,padding:"7px 13px",color:"rgba(255,255,255,0.55)",fontSize:12,cursor:"pointer"}}>
            Salir
          </button>
        </div>

        {/* Scoreboard */}
        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:16,border:"1px solid rgba(255,255,255,0.1)",padding:16,marginBottom:14}}>
          <div style={{color:"#6ee7b7",fontSize:11,fontWeight:700,letterSpacing:1.5,marginBottom:12}}>MARCADOR</div>
          {scores.length === 0
            ? <div style={{color:"rgba(255,255,255,0.35)",fontSize:13,textAlign:"center",padding:"6px 0"}}>
                Aún no hay quinielas
              </div>
            : scores.map((s,i) => (
              <div key={s.name} style={{display:"flex",alignItems:"center",gap:10,marginBottom:7,
                background:s.name===myName?"rgba(5,150,105,.2)":"rgba(255,255,255,0.03)",
                borderRadius:10,padding:"9px 12px",
                border:s.name===myName?"1px solid rgba(110,231,183,.25)":"1px solid transparent"}}>
                <span style={{fontSize:18}}>{["🥇","🥈","🥉"][i]||"·"}</span>
                <span style={{flex:1,color:"#f8fafc",fontWeight:s.name===myName?700:400,fontSize:14}}>{s.name}</span>
                <span style={{color:s.name===myName?"#6ee7b7":"#f8fafc",fontWeight:800,fontSize:22}}>{s.score}</span>
                <span style={{color:"rgba(255,255,255,0.35)",fontSize:10}}>pts</span>
              </div>
            ))
          }
        </div>

        {/* My quinela button */}
        <button onClick={()=>{setViewingUser(null);setTab("groups");setScreen("predict");}}
          style={{width:"100%",padding:"13px",borderRadius:12,border:"none",background:"#059669",
            color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:10,display:"block"}}>
          ✏️ Mi quiniela
        </button>

        {/* Others */}
        {others.length > 0 && (
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:16,border:"1px solid rgba(255,255,255,0.1)",padding:16,marginBottom:14}}>
            <div style={{color:"#93c5fd",fontSize:11,fontWeight:700,letterSpacing:1.5,marginBottom:10}}>VER QUINIELAS</div>
            {others.map(name => (
              <button key={name} onClick={()=>{setViewingUser(name);setTab("groups");setScreen("predict");}}
                style={{width:"100%",marginBottom:8,background:"rgba(255,255,255,0.07)",
                  border:"1px solid rgba(255,255,255,0.13)",borderRadius:10,
                  padding:"11px 14px",color:"#f8fafc",fontSize:14,cursor:"pointer",
                  display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                <span style={{fontSize:18}}>👁</span>
                <span style={{flex:1}}>{name}</span>
                <span style={{color:"rgba(255,255,255,0.35)",fontSize:11}}>solo lectura</span>
              </button>
            ))}
          </div>
        )}

        {/* Admin + sync */}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setTab("groups");setScreen("admin");}}
            style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:10,padding:"10px",color:"rgba(255,255,255,0.65)",fontSize:13,cursor:"pointer"}}>
            🔧 Admin
          </button>
          <button onClick={syncAll} disabled={syncing}
            style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",
              borderRadius:10,padding:"10px",color:"rgba(255,255,255,0.65)",fontSize:13,cursor:"pointer",opacity: syncing ? .6 : 1}}>
            {syncing?"⏳":"🔄"} Sincronizar
          </button>
        </div>
        {lastSync && (
          <div style={{color:"rgba(255,255,255,0.22)",fontSize:10,textAlign:"center",marginTop:8}}>
            Última sync: {lastSync.toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  }

  // ── PREDICT / VIEW ──
  if (screen === "predict") {
    const readonly = viewingUser !== null;
    const targetName = readonly ? viewingUser : myName;
    const targetPred = allData[targetName] || {};
    const bracket = buildBracket({ ...targetPred, groups: targetPred.groups });
    const color = readonly ? "#1e3a5f" : "#064e3b";
    const accent = readonly ? "#93c5fd" : "#6ee7b7";

    const roundTabs = [
      {id:"groups",label:"Grupos"},
      {id:"r32",label:"R32"},
      {id:"r16",label:"Octavos"},
      {id:"qf",label:"Cuartos"},
      {id:"sf",label:"Semis"},
      {id:"final",label:"Final"},
    ];
    const roundLabels = {r32:"Ronda de 32",r16:"Octavos de Final",qf:"Cuartos de Final",sf:"Semifinales",final:"Final 🏆"};

    function getTR(round,idx) { return targetPred[round]?.[idx]||{h:"",a:"",ph:"",pa:""}; }
    function setTR(round,idx,val) { if(!readonly) updateKnockPred(round,idx,val); }

    return (
      <div style={{minHeight:"100vh",background:"#f9fafb",fontFamily:"system-ui,sans-serif"}}>
        <div style={{background:`linear-gradient(135deg,${color},${color}dd)`,padding:"13px 14px",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>{setViewingUser(null);setScreen("home");}}
            style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:8,padding:"6px 11px",cursor:"pointer",fontSize:14}}>
            ←
          </button>
          <div>
            <div style={{color:accent,fontSize:10,letterSpacing:1.5,fontWeight:700}}>
              {readonly?"SOLO LECTURA":"MI QUINIELA"}
            </div>
            <div style={{color:"#fff",fontWeight:700,fontSize:16}}>
              {readonly?"👁 ":""}{targetName}
            </div>
          </div>
          {!readonly&&<div style={{marginLeft:"auto",color:"rgba(255,255,255,0.45)",fontSize:11}}>auto-guardado ✓</div>}
        </div>

        <div style={{display:"flex",overflowX:"auto",gap:3,padding:"9px 10px",background:"#fff",borderBottom:"1px solid #e5e7eb"}}>
          {roundTabs.map(r=>(
            <button key={r.id} onClick={()=>setTab(r.id)}
              style={{whiteSpace:"nowrap",padding:"6px 12px",borderRadius:20,flexShrink:0,
                border:tab===r.id?"none":"1px solid #e5e7eb",
                background:tab===r.id?color:"#fff",
                color:tab===r.id?"#fff":"#374151",
                fontSize:12,fontWeight:600,cursor:"pointer"}}>
              {r.label}
            </button>
          ))}
        </div>

        <div style={{padding:"13px 13px 40px"}}>
          {tab==="groups"&&(
            <div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
                {Object.keys(GROUPS).map(g=>(
                  <button key={g} onClick={()=>setGrp(g)}
                    style={{padding:"5px 11px",borderRadius:20,
                      border:grp===g?"none":"1px solid #d1d5db",
                      background:grp===g?color:"#fff",
                      color:grp===g?"#fff":"#374151",
                      fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {g}
                  </button>
                ))}
              </div>
              <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",padding:"13px 11px",marginBottom:11}}>
                <div style={{fontWeight:700,fontSize:14,color:color,marginBottom:11}}>Grupo {grp}</div>
                {(GROUP_MATCHES[grp]||[]).map(([h,a],i)=>{
                  const r=targetPred?.groups?.[grp]?.[i]||{h:"",a:""};
                  return <MatchCard key={i} home={h} away={a} result={r}
                    onChange={v=>updateGroupPred(grp,i,v)} readonly={readonly} showPen={false}/>;
                })}
              </div>
              <StandingsTable group={grp} results={targetPred?.groups?.[grp]}/>
            </div>
          )}

          {["r32","r16","qf","sf","final"].includes(tab)&&(()=>{
            const matches = bracket[tab]||[];
            return (
              <div>
                {!readonly&&(
                  <div style={{background:"#fef9c3",borderRadius:8,padding:"7px 11px",marginBottom:11,fontSize:11.5,color:"#713f12"}}>
                    ⚠️ Los cruces se generan según tus predicciones previas
                  </div>
                )}
                <div style={{fontWeight:700,fontSize:16,color:color,marginBottom:11}}>{roundLabels[tab]}</div>
                {matches.map(([h,a],i)=>{
                  const unavail = h==="?"||a==="?";
                  return (
                    <div key={i}>
                      <MatchCard home={h||"?"} away={a||"?"} result={getTR(tab,i)}
                        onChange={v=>setTR(tab,i,v)} readonly={readonly||unavail} showPen={true}/>
                      {unavail&&!readonly&&(
                        <div style={{textAlign:"center",fontSize:11,color:"#9ca3af",marginTop:-6,marginBottom:8}}>
                          Completa la ronda anterior primero
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ── ADMIN ──
  if (screen === "admin") {
    const ab = buildBracket({ ...actuals, groups: actuals.groups });
    const roundTabs=[{id:"groups",label:"Grupos"},{id:"r32",label:"R32"},{id:"r16",label:"Octavos"},{id:"qf",label:"Cuartos"},{id:"sf",label:"Semis"},{id:"final",label:"Final"}];
    const roundLabels={r32:"Ronda de 32",r16:"Octavos de Final",qf:"Cuartos de Final",sf:"Semifinales",final:"Final 🏆"};

    return (
      <div style={{minHeight:"100vh",background:"#f9fafb",fontFamily:"system-ui,sans-serif"}}>
        <div style={{background:"#0f172a",padding:"13px 14px",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setScreen("home")}
            style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",borderRadius:8,padding:"6px 11px",cursor:"pointer",fontSize:14}}>
            ←
          </button>
          <div style={{color:"#fff",fontWeight:700,fontSize:16}}>🔧 Resultados Reales</div>
        </div>

        {!adminUnlocked ? (
          <div style={{padding:40,display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
            <div style={{fontSize:44}}>🔒</div>
            <div style={{color:"#374151",fontWeight:600,fontSize:16}}>PIN de administrador</div>
            <input type="password" value={adminInput} onChange={e=>setAdminInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&(adminInput===ADMIN_PIN?setAdminUnlocked(true):setAdminInput(""))}
              placeholder="PIN..."
              style={{padding:"10px 16px",borderRadius:10,border:"1.5px solid #d1d5db",fontSize:22,textAlign:"center",width:110,outline:"none"}}/>
            <button onClick={()=>adminInput===ADMIN_PIN?setAdminUnlocked(true):setAdminInput("")}
              style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:10,padding:"10px 28px",fontWeight:700,cursor:"pointer",fontSize:15}}>
              Entrar
            </button>
            <div style={{color:"#9ca3af",fontSize:12}}>PIN por defecto: 1234</div>
          </div>
        ) : (
          <>
            <div style={{display:"flex",overflowX:"auto",gap:3,padding:"9px 10px",background:"#fff",borderBottom:"1px solid #e5e7eb"}}>
              {roundTabs.map(r=>(
                <button key={r.id} onClick={()=>setTab(r.id)}
                  style={{whiteSpace:"nowrap",padding:"6px 12px",borderRadius:20,flexShrink:0,
                    border:tab===r.id?"none":"1px solid #e5e7eb",
                    background:tab===r.id?"#0f172a":"#fff",
                    color:tab===r.id?"#fff":"#374151",
                    fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  {r.label}
                </button>
              ))}
            </div>
            <div style={{padding:"13px 13px 40px"}}>
              {tab==="groups"&&(
                <div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
                    {Object.keys(GROUPS).map(g=>(
                      <button key={g} onClick={()=>setGrp(g)}
                        style={{padding:"5px 11px",borderRadius:20,border:grp===g?"none":"1px solid #d1d5db",
                          background:grp===g?"#0f172a":"#fff",color:grp===g?"#fff":"#374151",
                          fontSize:12,fontWeight:600,cursor:"pointer"}}>
                        {g}
                      </button>
                    ))}
                  </div>
                  <div style={{background:"#fff",borderRadius:14,border:"1px solid #e5e7eb",padding:"13px 11px",marginBottom:11}}>
                    <div style={{fontWeight:700,fontSize:14,color:"#0f172a",marginBottom:11}}>Grupo {grp}</div>
                    {(GROUP_MATCHES[grp]||[]).map(([h,a],i)=>{
                      const r=actuals?.groups?.[grp]?.[i]||{h:"",a:""};
                      return <MatchCard key={i} home={h} away={a} result={r}
                        onChange={v=>updateActualGroup(grp,i,v)} readonly={false} showPen={false}/>;
                    })}
                  </div>
                  <StandingsTable group={grp} results={actuals?.groups?.[grp]}/>
                </div>
              )}
              {["r32","r16","qf","sf","final"].includes(tab)&&(()=>{
                const matches = ab[tab]||[];
                return (
                  <div>
                    <div style={{fontWeight:700,fontSize:16,color:"#0f172a",marginBottom:11}}>{roundLabels[tab]}</div>
                    {matches.map(([h,a],i)=>{
                      const r=actuals?.[tab]?.[i]||{h:"",a:""};
                      return <MatchCard key={i} home={h||"?"} away={a||"?"} result={r}
                        onChange={v=>updateActualRound(tab,i,v)}
                        readonly={h==="?"||a==="?"} showPen={true}/>;
                    })}
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}
