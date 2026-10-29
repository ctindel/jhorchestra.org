const { Headline, Eyebrow, Button, Chip, ConcertRow } = window.JacksonHeightsOrchestraDesignSystem_6e3e82;

const PAST = [
  { day:'18', month:'Mar', year:'2026', title:'Spring in Forest Hills',
    venue:'Wed · 7:30 PM · Our Lady Queen of Martyrs, Forest Hills',
    works:'Mozart, Concerto for Flute & Harp · Brahms, Symphony No. 2',
    media:[{glyph:'▦',tone:'subway',label:'Poster'},{glyph:'⛁',tone:'tandoor',label:'Program (PDF)'},
           {glyph:'▶',tone:'hibiscus',label:'2 videos'},{glyph:'◉',tone:'jacaranda',label:'Photos (28)'}] },
  { day:'10', month:'Dec', year:'2025', title:'Winter Dreams',
    venue:'Wed · 7:30 PM · Lexington School, East Elmhurst',
    works:'Haydn No. 26 · Tchaikovsky "Winter Dreams" · Handel "Hallelujah"',
    media:[{glyph:'▦',tone:'subway',label:'Poster'},{glyph:'⛁',tone:'tandoor',label:'Program'},
           {glyph:'✎',tone:'roosevelt',label:'Program notes'}] },
  { day:'06', month:'Jul', year:'2025', title:'Summer Pops · Travers Park',
    venue:'Sun · 6:00 PM · 76-09 34th Ave, Jackson Heights · Outdoor',
    works:'Movie themes, pops classics, neighborhood favorites',
    media:[{glyph:'◉',tone:'jacaranda',label:'Photos (54)'},{muted:true,label:'no recording'}] },
  { day:'21', month:'May', year:'2025', title:'Bernstein & Beethoven',
    venue:'Wed · 7:30 PM · Trinity Lutheran Church, Astoria',
    works:'Bernstein, Candide Overture · Beethoven, Symphony No. 7',
    media:[{glyph:'⛁',tone:'tandoor',label:'Program'},{glyph:'♪',tone:'cilantro',label:'Audio (3)'}] },
  { day:'12', month:'Mar', year:'2025', title:'French Connections',
    venue:'Wed · 7:30 PM · Trinity Lutheran Church, Astoria',
    works:"Debussy, Petite Suite · Ravel, Pavane · Bizet, L'Arlésienne",
    media:[{glyph:'▦',tone:'subway',label:'Poster'},{glyph:'⛁',tone:'tandoor',label:'Program'},
           {glyph:'▶',tone:'hibiscus',label:'4 videos'},{glyph:'◉',tone:'jacaranda',label:'Photos'}] },
  { day:'11', month:'Dec', year:'2024', title:'Mostly Brahms',
    venue:'Wed · 7:30 PM · Our Lady Queen of Martyrs, Forest Hills',
    works:'Brahms, Academic Festival Overture · Sym. No. 1', media:[] }
];

const TABS = ['Upcoming','Season 25–26','Season 24–25','Season 23–24','2022 & earlier'];

function SectionLabel({ children, style }) {
  return <div style={{fontFamily:'var(--jho-font-text)',fontSize:'11px',fontWeight:700,letterSpacing:'0.22em',
                      textTransform:'uppercase',color:'var(--jho-muted)',margin:'0 0 14px',...style}}>{children}</div>;
}

function Schedule() {
  const [tab, setTab] = React.useState('Upcoming');
  return (
    <div>
      <div style={{padding:'60px 60px 28px',background:'var(--jho-paper)',borderBottom:'1px solid rgba(0,0,0,0.08)'}}>
        <Eyebrow style={{marginBottom:'8px',letterSpacing:'0.28em'}}>Schedule · Concerts</Eyebrow>
        <Headline level="display" style={{margin:'0 0 14px'}}>
          Every concert, <em style={{fontStyle:'italic',fontWeight:500,color:'var(--jho-tandoor)'}}>past &amp; present</em>.
        </Headline>
        <p style={{margin:'0 0 22px',fontSize:'16px',lineHeight:1.55,color:'var(--jho-muted)',maxWidth:'640px'}}>
          Four concerts a year across Queens. Free admission, $20 suggested donation. Each past concert keeps an archive
          of whatever was recorded — programs, photos, video, audio — when we have them.
        </p>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',borderTop:'1px solid rgba(0,0,0,0.08)',paddingTop:14}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{fontFamily:'var(--jho-font-text)',fontSize:'12px',fontWeight:600,letterSpacing:'0.12em',
                      textTransform:'uppercase',padding:'9px 16px',borderRadius:'var(--jho-radius-pill)',
                      cursor:'pointer',transition:'background var(--jho-dur-base) var(--jho-ease)',
                      border:'1px solid '+(tab===t?'var(--jho-subway)':'rgba(0,0,0,0.15)'),
                      background:tab===t?'var(--jho-subway)':'transparent',
                      color:tab===t?'var(--jho-paper)':'var(--jho-ink)'}}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{padding:'36px 60px 60px',background:'var(--jho-paper)'}}>
        <SectionLabel>Next on the calendar</SectionLabel>
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:40,padding:28,background:'var(--jho-ink)',
                     color:'var(--jho-paper)',borderRadius:'14px',alignItems:'center',marginBottom:36}}>
          <div style={{background:'var(--jho-paper)',aspectRatio:'8.5/11',borderRadius:'var(--jho-radius-sm)',
                       overflow:'hidden',boxShadow:'var(--jho-shadow-thumb)'}}>
            <img src="../../assets/reference/20260520-poster-color.png" alt="May 20 concert poster"
                 style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
          </div>
          <div>
            <Eyebrow tone="saffron" size="sm" style={{marginBottom:'6px',letterSpacing:'0.28em'}}>Wed · May 20, 2026 · 7:30 PM</Eyebrow>
            <Headline level="h3" style={{margin:'0 0 4px'}}>100 Years of Trinity Lutheran</Headline>
            <p style={{fontSize:'13px',color:'rgba(250,246,238,0.75)',lineHeight:1.5,margin:0}}>
              Trinity Lutheran Church · 31-18 37th St, Astoria · Free, $20 suggested donation
            </p>
            <div style={{display:'flex',gap:10,margin:'14px 0'}}>
              <Button variant="donate" size="sm" arrow href="#">Help sponsor</Button>
              <Button variant="ghostDark" size="sm" href="#">Directions</Button>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              <Chip outline>Mendelssohn-Hensel — Overture in C</Chip>
              <Chip outline>Michael A. Lee — Cognōscent (Premiere)</Chip>
              <Chip outline>F. Mendelssohn — Sym. 5 "Reformation"</Chip>
            </div>
          </div>
        </div>

        <SectionLabel style={{marginTop:8}}>Recent concerts</SectionLabel>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {PAST.map(c=><ConcertRow key={c.title} {...c} />)}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Schedule });
