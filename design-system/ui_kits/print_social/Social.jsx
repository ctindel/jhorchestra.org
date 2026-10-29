const { Wordmark, MosaicRule, Portrait, Chip } = window.JacksonHeightsOrchestraDesignSystem_6e3e82;

const C = () => window.JHO_CONCERT;

/* Instagram square 1:1 — concert announcement */
function IGConcert({ scale = 1 }) {
  const c = C();
  return (
    <div style={{width:700*scale+'px',height:700*scale+'px',transform:scale!==1?undefined:undefined,
                 position:'relative',overflow:'hidden',borderRadius:'var(--jho-radius-xs)',
                 boxShadow:'var(--jho-shadow-tile)',fontFamily:'var(--jho-font-text)',color:'var(--jho-ink)',
                 background:'var(--jho-paper)',padding:'34px 40px 26px',display:'grid',
                 gridTemplateRows:'auto minmax(0,1fr) auto auto',gap:12,boxSizing:'border-box'}}>
      <div>
        <div style={{fontSize:'15px',color:'var(--jho-muted)',lineHeight:1.3,fontWeight:600,marginBottom:14,
                     textTransform:'uppercase',letterSpacing:'0.23em',whiteSpace:'nowrap'}}>{c.presents}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:24,alignItems:'center'}}>
          <Wordmark color="subway" height={190} style={{margin:'0 auto',alignItems:'center'}} />
          <Portrait {...c.people[0]} size={145} layout="stacked"
                    style={{height:'190px',justifyContent:'space-between',gap:0}} />
        </div>
        <MosaicRule variant="bar" style={{marginTop:10}} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:18,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.22em',color:'var(--jho-tandoor)',
                       fontWeight:700,lineHeight:1.5}}>{c.title}</div>
          {c.works.map(w=>(
            <div key={w.work} style={{display:'flex',flexDirection:'column',gap:'1px',paddingTop:6,
                                      borderTop:'1px solid rgba(20,26,42,0.12)'}}>
              <strong style={{fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'18px'}}>{w.composer}</strong>
              <span style={{fontFamily:'var(--jho-font-display)',fontStyle:'italic',fontSize:'15px',
                            color:'var(--jho-muted)',lineHeight:1.3}}>{w.work}
                {w.tag ? <em style={{fontStyle:'normal',color:'var(--jho-tandoor)',fontWeight:600,
                                     letterSpacing:'0.02em'}}> · {w.tag}</em> : null}</span>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12,alignSelf:'center'}}>
          {c.people.slice(1,2).map(p=><Portrait key={p.name} {...p} size={145} layout="stacked" />)}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:28,paddingTop:12,borderTop:'2px solid var(--jho-ink)'}}>
        {[['When',c.dayname+' · '+c.date,c.time],['Where',c.venue,c.address]].map(([h,a,b])=>(
          <div key={h}>
            <h5 style={{margin:'0 0 4px',fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.22em',
                        color:'var(--jho-tandoor)',fontWeight:700}}>{h}</h5>
            <strong style={{display:'block',fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:'18px',
                            letterSpacing:'-0.01em',lineHeight:1.1}}>{a}</strong>
            <p style={{margin:'3px 0 0',fontSize:'11px',color:'var(--jho-muted)',lineHeight:1.3}}>{b}</p>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:20,paddingTop:10,
                   borderTop:'1px solid var(--jho-border)'}}>
        <div style={{fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:'20px',letterSpacing:'-0.01em'}}>
          jhorchestra.org
          <small style={{display:'block',fontFamily:'var(--jho-font-text)',fontWeight:500,fontSize:'11px',
                         letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--jho-muted)',marginTop:'3px'}}>@jhorchestra</small>
        </div>
        <window.DonateQR size={58} />
        <div style={{textAlign:'right'}}>
          <strong style={{display:'block',fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:'20px',
                          letterSpacing:'-0.01em',color:'var(--jho-tandoor)',lineHeight:1.1}}>{c.admission}</strong>
          <span style={{display:'block',fontFamily:'var(--jho-font-text)',fontWeight:600,fontSize:'11px',
                        letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--jho-muted)',marginTop:'3px'}}>{c.suggested}</span>
        </div>
      </div>
    </div>
  );
}

/* Instagram square — brand / season card, reversed */
function IGBrand() {
  const season = [
    ['Dec 9','Wed · 2026','Season Opener','Queens · 7:30 PM'],
    ['Mar 7 & 10','2027','Winter Concert','Mar 7 Manhattan · Mar 10 Queens'],
    ['May 19','Wed · 2027','Spring Concert','Queens · 7:30 PM'],
    ['Jul 11','Sun · 2027','Summer Pops','Travers Park · Outdoor · 6pm']
  ];
  return (
    <div style={{width:'700px',height:'700px',background:'var(--jho-ink)',color:'var(--jho-paper)',
                 padding:'34px 48px',display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto',position:'relative',
                 overflow:'hidden',gap:20,borderRadius:'var(--jho-radius-xs)',boxShadow:'var(--jho-shadow-tile)',
                 fontFamily:'var(--jho-font-text)',boxSizing:'border-box'}}>
      <div style={{position:'absolute',top:0,right:0,display:'grid',
                   gridTemplateColumns:'54px 54px 54px',gridTemplateRows:'54px 54px 54px',opacity:0.9}}>
        {['tandoor','saffron','cilantro','subway','jacaranda','hibiscus','roosevelt','tandoor','subway']
          .map((c,i)=><div key={i} style={{width:'54px',height:'54px',background:'var(--jho-'+c+')'}} />)}
      </div>
      <div>
        <div style={{fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.22em',fontWeight:600,
                     color:'rgba(250,246,238,0.6)',maxWidth:'400px'}}>Community Orchestra · Queens, New York</div>
        <Wordmark color="tandoor" height={180} style={{marginTop:'12px',alignItems:'center'}} />
        <div style={{fontFamily:'var(--jho-font-display)',fontStyle:'italic',fontSize:'20px',lineHeight:1.35,
                     maxWidth:'480px',fontWeight:400,marginTop:'14px'}}>
          An orchestra as many voices — tuned to the rhythm of Jackson Heights.
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',paddingTop:14,borderTop:'1px solid var(--jho-border-invert)'}}>
        {season.map(([d,meta,t,v],i)=>(
          <div key={t} style={{display:'grid',gridTemplateColumns:'152px 1fr',gap:16,alignItems:'baseline',
                               padding:'7px 0',borderBottom:i<season.length-1?'1px solid rgba(250,246,238,0.14)':'none'}}>
            <div style={{fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:'19px',letterSpacing:'-0.01em',
                         color:'var(--jho-saffron)',lineHeight:1.1}}>{d}
              <span style={{display:'block',fontFamily:'var(--jho-font-text)',fontWeight:600,fontSize:'9px',
                            letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(250,246,238,0.5)',marginTop:'2px'}}>{meta}</span>
            </div>
            <div style={{fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'16px',lineHeight:1.2}}>{t}
              <span style={{display:'block',fontFamily:'var(--jho-font-text)',fontWeight:500,fontSize:'11px',
                            letterSpacing:'0.04em',color:'rgba(250,246,238,0.65)',marginTop:'2px'}}>{v}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:20,paddingTop:14,
                   borderTop:'1px solid var(--jho-border-invert)'}}>
        <div style={{fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'18px'}}>jhorchestra.org</div>
        <window.DonateQR tone="dark" size={50} />
        <div style={{fontSize:'14px',color:'var(--jho-saffron)',fontWeight:600,textAlign:'right'}}>@jhorchestra</div>
      </div>
    </div>
  );
}

/* 9:16 stories */
const storyBase = { width:'340px',height:'604px',borderRadius:'var(--jho-radius-sm)',overflow:'hidden',
  boxShadow:'var(--jho-shadow-tile)',position:'relative',padding:'36px 28px',display:'grid',
  gridTemplateRows:'auto 1fr auto',gap:16,fontFamily:'var(--jho-font-text)',boxSizing:'border-box' };

function StoryConcert() {
  const c = C();
  return (
    <div style={{...storyBase,background:'var(--jho-paper)',color:'var(--jho-ink)'}}>
      <div>
        <div style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.25em',color:'var(--jho-muted)',fontWeight:600}}>Next concert</div>
        <Wordmark color="subway" height={132} style={{marginTop:'14px'}} />
      </div>
      <div>
        <div style={{fontFamily:'var(--jho-font-display)',fontStyle:'italic',fontWeight:500,fontSize:'22px',
                     lineHeight:1.2,letterSpacing:'-0.01em',marginTop:'18px'}}>{c.title}</div>
        <div style={{marginTop:14,display:'flex',flexDirection:'column',gap:5,paddingTop:12,
                     borderTop:'1px solid rgba(20,26,42,0.2)'}}>
          {c.works.map(w=>(
            <div key={w.work} style={{fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'14px',lineHeight:1.35}}>
              {w.composer} <em style={{fontStyle:'italic',fontWeight:400,color:'var(--jho-muted)'}}>{w.work}</em>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{borderTop:'1.5px solid var(--jho-ink)',paddingTop:10}}>
          <p style={{margin:0,fontSize:'12px',lineHeight:1.4}}>
            <strong style={{fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:'16px',display:'block',marginBottom:'2px'}}>
              {c.dayname} · {c.date} · {c.time}</strong>
            {c.venue} · {c.address}<br/>{c.admission}, {c.suggested}
          </p>
        </div>
        <span style={{display:'inline-block',marginTop:14,background:'var(--jho-tandoor)',color:'var(--jho-paper)',
                      fontSize:'11px',fontWeight:700,padding:'9px 16px',borderRadius:'var(--jho-radius-pill)',
                      textTransform:'uppercase',letterSpacing:'0.15em'}}>Learn more</span>
      </div>
    </div>
  );
}

function StoryArtistSpotlight() {
  const p = C().people[1];
  return (
    <div style={{...storyBase,background:'var(--jho-newsprint)',color:'var(--jho-ink)'}}>
      <div style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.25em',color:'var(--jho-muted)',fontWeight:600}}>World premiere</div>
      <div>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
          <span style={{width:'88px',height:'88px',borderRadius:'50%',overflow:'hidden',flexShrink:0,display:'block'}}>
            <img src={p.src} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
          </span>
          <span style={{display:'flex',flexDirection:'column',gap:2}}>
            <strong style={{fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:'22px',lineHeight:1.1,letterSpacing:'-0.01em'}}>{p.name}</strong>
            <span style={{fontSize:'10px',fontWeight:600,letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--jho-tandoor)'}}>{p.role}</span>
          </span>
        </div>
        <div style={{fontFamily:'var(--jho-font-display)',fontWeight:900,fontSize:'44px',lineHeight:0.98,letterSpacing:'-0.03em'}}>
          A new work, <em style={{fontStyle:'italic',fontWeight:500,color:'var(--jho-tandoor)'}}>Cognōscent</em>, premieres May 20.
        </div>
      </div>
      <div>
        <div style={{borderTop:'1.5px solid var(--jho-ink)',paddingTop:10}}>
          <p style={{margin:0,fontSize:'12px',lineHeight:1.4}}>
            <strong style={{fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:'16px',display:'block',marginBottom:'2px'}}>Wed · May 20 · 7:30 PM</strong>
            Trinity Lutheran Church, Astoria
          </p>
        </div>
        <span style={{display:'inline-block',marginTop:14,background:'var(--jho-tandoor)',color:'var(--jho-paper)',
                      fontSize:'11px',fontWeight:700,padding:'9px 16px',borderRadius:'var(--jho-radius-pill)',
                      textTransform:'uppercase',letterSpacing:'0.15em'}}>Read the notes</span>
      </div>
    </div>
  );
}

function StorySeason() {
  const rows = [['May 20','2026','100 Years of Trinity Lutheran','Astoria'],
                ['Jul 05','2026','Summer Pops','Travers Park'],
                ['Dec 09','2026','Winter Dreams','East Elmhurst'],
                ['Mar 17','2027','Spring in Forest Hills','Forest Hills']];
  return (
    <div style={{...storyBase,background:'var(--jho-ink)',color:'var(--jho-paper)'}}>
      <div>
        <div style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.25em',color:'rgba(250,246,238,0.6)',fontWeight:600}}>Season 26–27</div>
        <Wordmark color="saffron" height={132} style={{marginTop:'14px'}} />
      </div>
      <div style={{display:'flex',flexDirection:'column',marginTop:14,paddingTop:12,borderTop:'1px solid var(--jho-border-invert)'}}>
        {rows.map(([d,y,t,v],i)=>(
          <div key={t} style={{display:'grid',gridTemplateColumns:'78px 1fr',gap:10,alignItems:'baseline',padding:'7px 0',
                               borderBottom:i<rows.length-1?'1px solid rgba(250,246,238,0.12)':'none'}}>
            <div style={{fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:'15px',color:'var(--jho-saffron)',lineHeight:1.15}}>{d}
              <span style={{display:'block',fontFamily:'var(--jho-font-text)',fontWeight:600,fontSize:'8px',
                            letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(250,246,238,0.45)',marginTop:'1px'}}>{y}</span>
            </div>
            <div style={{fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'13px',lineHeight:1.2}}>{t}
              <span style={{display:'block',fontFamily:'var(--jho-font-text)',fontWeight:500,fontSize:'9px',
                            color:'rgba(250,246,238,0.6)',marginTop:'1px'}}>{v}</span>
            </div>
          </div>
        ))}
      </div>
      <div>
        <div style={{borderTop:'1.5px solid rgba(250,246,238,0.4)',paddingTop:10}}>
          <p style={{margin:0,fontSize:'12px',lineHeight:1.4,color:'rgba(250,246,238,0.85)'}}>
            Four concerts. Always free, pay what you can.
          </p>
        </div>
        <span style={{display:'inline-block',marginTop:14,background:'var(--jho-saffron)',color:'var(--jho-ink)',
                      fontSize:'11px',fontWeight:700,padding:'9px 16px',borderRadius:'var(--jho-radius-pill)',
                      textTransform:'uppercase',letterSpacing:'0.15em'}}>See the season</span>
      </div>
    </div>
  );
}

Object.assign(window, { IGConcert, IGBrand, StoryConcert, StoryArtistSpotlight, StorySeason });
