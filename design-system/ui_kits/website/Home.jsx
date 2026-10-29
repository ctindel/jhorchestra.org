const { Headline, Eyebrow, Button, StatTile, Chip, Card } = window.JacksonHeightsOrchestraDesignSystem_6e3e82;

function Hero({ onNavigate }) {
  return (
    <div style={{padding:'80px 60px 70px',display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:60,
                 alignItems:'center',background:'var(--jho-paper)'}}>
      <div>
        <Eyebrow style={{marginBottom:'14px',letterSpacing:'0.28em'}}>Community Orchestra · Queens, NY</Eyebrow>
        <Headline level="hero" style={{marginBottom:'18px',color:'var(--jho-ink)'}}>
          A neighborhood <em style={{fontStyle:'italic',fontWeight:500,color:'var(--jho-tandoor)'}}>chord</em>, played in Jackson Heights.
        </Headline>
        <p style={{fontSize:'17px',lineHeight:1.55,color:'var(--jho-muted)',maxWidth:'480px',margin:'0 0 26px'}}>
          Since 2013, a community orchestra of Queens neighbors has been performing for free, or pay-what-you-can,
          across some of the most beloved venues in the borough.
        </p>
        <div style={{display:'flex',gap:12}}>
          <Button variant="primary" href="#" onClick={e=>{e.preventDefault();onNavigate('schedule');}}>Upcoming Concert</Button>
          <Button variant="secondary" href="#">About the Orchestra</Button>
        </div>
      </div>
      <div style={{aspectRatio:'1/1',borderRadius:'var(--jho-radius-lg)',display:'grid',
                   gridTemplateColumns:'1fr 1fr 1fr',gridTemplateRows:'1fr 1fr 1fr',gap:6,padding:6,
                   background:'var(--jho-newsprint)'}}>
        <div style={{gridColumn:'span 2',gridRow:'span 2',borderRadius:'var(--jho-radius-sm)',overflow:'hidden'}}>
          <img src="../../assets/photos/orchestra.jpg" alt="The orchestra in performance"
               style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
        </div>
        <div style={{borderRadius:'var(--jho-radius-sm)',background:'var(--jho-saffron)'}} />
        <div style={{borderRadius:'var(--jho-radius-sm)',background:'var(--jho-cilantro)'}} />
        <div style={{borderRadius:'var(--jho-radius-sm)',background:'var(--jho-subway)'}} />
        <div style={{borderRadius:'var(--jho-radius-sm)',background:'var(--jho-tandoor)'}} />
        <div style={{borderRadius:'var(--jho-radius-sm)',background:'var(--jho-jacaranda)'}} />
      </div>
    </div>
  );
}

function NextConcert({ onNavigate }) {
  return (
    <div style={{padding:'70px 60px',background:'var(--jho-ink)',color:'var(--jho-paper)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:34}}>
        <div>
          <Eyebrow tone="saffron" size="sm" style={{marginBottom:'6px',letterSpacing:'0.3em'}}>Next up</Eyebrow>
          <Headline level="h2" italic>Wed · May 20 · 7:30 PM</Headline>
        </div>
        <a href="#" onClick={e=>{e.preventDefault();onNavigate('schedule');}}
           style={{color:'var(--jho-saffron)',fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.18em',
                   fontWeight:700,textDecoration:'none',borderBottom:'1px solid var(--jho-saffron)',paddingBottom:'2px'}}>
          All concerts →
        </a>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'140px 1fr auto',gap:40,alignItems:'center',padding:'30px 0',
                   borderTop:'1px solid var(--jho-border-invert)',borderBottom:'1px solid var(--jho-border-invert)'}}>
        <div>
          <div style={{fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.22em',color:'var(--jho-saffron)',fontWeight:700}}>May</div>
          <div style={{fontFamily:'var(--jho-font-display)',fontWeight:900,fontSize:'66px',lineHeight:0.9,letterSpacing:'-0.03em'}}>20</div>
          <div style={{fontSize:'11px',letterSpacing:'0.22em',color:'rgba(250,246,238,0.5)',fontWeight:600}}>2026</div>
        </div>
        <div>
          <Headline level="h3" style={{marginBottom:'4px'}}>100 Years of Trinity Lutheran</Headline>
          <p style={{fontSize:'13px',color:'rgba(250,246,238,0.75)',lineHeight:1.5,margin:0}}>
            Trinity Lutheran Church · 31-18 37th St, Astoria · Free admission, $20 suggested donation.
          </p>
          <div style={{marginTop:14,display:'flex',flexWrap:'wrap',gap:6}}>
            <Chip outline>Mendelssohn-Hensel — Overture in C</Chip>
            <Chip outline>Michael A. Lee — Cognōscent (Premiere)</Chip>
            <Chip outline>F. Mendelssohn — Sym. 5 "Reformation"</Chip>
          </div>
        </div>
        <Button variant="donate" arrow href="#">Learn more</Button>
      </div>
    </div>
  );
}

function AboutBand() {
  return (
    <div style={{padding:'70px 60px',background:'var(--jho-paper)'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:60,alignItems:'flex-end',marginBottom:34}}>
        <div>
          <Eyebrow style={{marginBottom:'10px',letterSpacing:'0.28em'}}>The Orchestra</Eyebrow>
          <Headline level="h1">Seven <em style={{fontStyle:'italic',fontWeight:500,color:'var(--jho-tandoor)'}}>voices</em>, one community.</Headline>
        </div>
        <p style={{fontSize:'15px',lineHeight:1.55,color:'var(--jho-muted)',margin:0}}>
          Jackson Heights is one of the most linguistically diverse places on earth. Our orchestra reflects that —
          amateurs, pros, first-chair students, retired pit musicians — everyone who wants to play.
        </p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
        <StatTile value="50+" label="Musicians" note="from across Queens & Brooklyn." color="tandoor" />
        <StatTile value="4" label="Concerts a year" note="always free or pay-what-you-can." color="subway" />
        <StatTile value="13" label="Years" note="making music in the neighborhood." color="cilantro" />
      </div>
    </div>
  );
}

function Home({ onNavigate }) {
  return (<div><Hero onNavigate={onNavigate} /><NextConcert onNavigate={onNavigate} /><AboutBand /></div>);
}

Object.assign(window, { Home, Hero, NextConcert, AboutBand });
