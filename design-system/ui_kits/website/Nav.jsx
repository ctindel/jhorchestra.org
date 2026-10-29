const { Wordmark, SocialIcons, Button, MosaicRule } = window.JacksonHeightsOrchestraDesignSystem_6e3e82;

function Nav({ active, onNavigate }) {
  const links = ['About','Join','Schedule','Media','Contact'];
  return (
    <div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 60px',
                 background:'var(--jho-white)',borderBottom:'1px solid rgba(0,0,0,0.08)',gap:24}}>
      <a href="#" onClick={e=>{e.preventDefault();onNavigate('home');}}
         style={{display:'flex',alignItems:'center',gap:10,flexShrink:0,textDecoration:'none'}}>
        <MosaicRule variant="bar" height={22} gap={2} style={{width:'34px',borderRadius:'1px'}} />
        <span style={{fontFamily:'var(--jho-font-display)',fontWeight:900,fontSize:'22px',
                      letterSpacing:'-0.01em',color:'var(--jho-ink)'}}>JHO</span>
      </a>
      <div style={{display:'flex',gap:22,alignItems:'center'}}>
        {links.map(l=>(
          <a key={l} href="#" onClick={e=>{e.preventDefault();onNavigate(l==='Schedule'?'schedule':'home');}}
             style={{fontFamily:'var(--jho-font-text)',fontSize:'12px',fontWeight:600,textDecoration:'none',
                     textTransform:'uppercase',letterSpacing:'0.16em',
                     color: (l==='Schedule'&&active==='schedule') ? 'var(--jho-tandoor)' : 'var(--jho-ink)'}}>{l}</a>
        ))}
        <Button variant="donate" size="sm" href="#">Donate</Button>
      </div>
      <SocialIcons />
    </div>
    <MosaicRule />
    </div>
  );
}

function Footer() {
  return (
    <div style={{background:'var(--jho-ink)',color:'var(--jho-paper)',padding:'44px 60px'}}>
      <MosaicRule style={{marginBottom:'28px'}} />
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:40,flexWrap:'wrap'}}>
        <div style={{fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'22px',letterSpacing:'-0.01em'}}>
          Jackson Heights Orchestra
          <small style={{display:'block',fontFamily:'var(--jho-font-text)',fontWeight:500,fontSize:'11px',
                         letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(250,246,238,0.6)',marginTop:'6px'}}>
            Queens, New York · 501(c)(3)
          </small>
        </div>
        <SocialIcons tone="dark" />
        <div style={{fontFamily:'var(--jho-font-text)',fontSize:'12px',color:'rgba(250,246,238,0.6)'}}>
          © 2026 Jackson Heights Orchestra · jhorchestra.org · @jhorchestra
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Nav, Footer });
