const { Wordmark, MosaicRule, WorkListing, Portrait, Headline } = window.JacksonHeightsOrchestraDesignSystem_6e3e82;

const CONCERT = {
  presents: 'The Jackson Heights Beautification Group Presents',
  title: '100 Years of Trinity Lutheran',
  dayname: 'Wednesday',
  date: 'May 20',
  year: '2026',
  iso: '2026-05-20',        /* sortable stamp for generated file names */
  time: '7:30 PM',
  doors: 'Doors 7:00 PM',
  venue: 'Trinity Lutheran Church',
  address: '31-18 37th St, Astoria (parking available)',
  admission: 'Free admission',
  suggested: '$20 suggested donation',
  works: [
    { composer: 'Fanny Mendelssohn-Hensel', work: 'Overture in C' },
    { composer: 'Michael A. Lee', work: 'Cognōscent', tag: 'World Premiere' },
    { composer: 'Felix Mendelssohn', work: 'Symphony No. 5 "Reformation"' }
  ],
  people: [
    { src: '../../assets/photos/alex-wen.jpg', name: 'Alex Wen', role: 'Conductor' },
    { src: '../../assets/photos/michael-lee.jpg', name: 'Michael A. Lee', role: 'Composer' },
    { src: '../../assets/photos/nicholas-pappone.jpeg', name: 'Nicholas Pappone', role: 'Violin' }
  ]
};

/* ── Poster geometry, single source of truth ───────────────────────────────
   The wordmark is sized as a FRACTION OF SHEET WIDTH, not absolute px, so the
   560px kit preview and the 816px print templates (templates/concert-poster/,
   templates/concert-poster-duo/) stay visually identical.
     0.1176 × 816 ≈ 96px  ·  0.1176 × 560 ≈ 66px
   Solo and Duo share the masthead — the conductor sits beside the wordmark in
   both — so there is only one ratio. A second artist goes beside the PROGRAMME,
   not the masthead. */
const SHEET_W = 560;
const MARK_RATIO = 0.1176;
const markSize = () => Math.round(SHEET_W * MARK_RATIO);

const sheet = { width: SHEET_W + 'px', height: '725px', boxSizing: 'border-box', flexShrink: 0, background: 'var(--jho-paper)', position: 'relative',
  overflow: 'hidden', fontFamily: 'var(--jho-font-text)', color: 'var(--jho-ink)',
  boxShadow: 'var(--jho-shadow-sheet)', borderRadius: 'var(--jho-radius-paper)' };

/* ── Finishes ───────────────────────────────────────────────────────────────
   One artwork, three outputs. Because every element in Layout A paints from a
   CSS custom property, a finish is just a token override on the sheet root —
   no forked markup, so the three can never drift apart.

     online       Paper ground (#FAF6EE). Web, email, social. The default.
     print-color  White ground. Same color artwork, for a commercial printer.
     print-bw     White ground, every text token forced to pure black, photos
                  and the mosaic bar desaturated. For newspaper listings.

   print-bw leaves NO grey text: ink, muted, tandoor and subway all collapse to
   #000, so captions and role labels print solid black rather than as a screen. */
const FINISH = {
  online:        { label: 'Online',        note: 'Paper ground · web, email, social', qr: 'paper', vars: null },
  'print-color': { label: 'Print · Color', note: 'White ground · commercial print',   qr: 'paper',
                   vars: { '--jho-paper': '#FFFFFF', '--jho-newsprint': '#FFFFFF' } },
  'print-bw':    { label: 'Print · B&W',    note: 'White ground · newspaper listings',  qr: 'bw',
                   vars: { '--jho-paper': '#FFFFFF', '--jho-newsprint': '#FFFFFF',
                           '--jho-ink': '#000000', '--jho-muted': '#000000',
                           '--jho-tandoor': '#000000', '--jho-subway': '#000000',
                           '--jho-border': 'rgba(0,0,0,0.35)', '--jho-tint-tandoor': 'rgba(0,0,0,0.08)' } }
};

/* Descendant filters can't be written inline, so the one class the finishes need
   is injected once. Photos and the mosaic bar carry hue no token override can
   reach — grayscale() takes each to its own luminance, which is what a
   newspaper's press would do anyway. */
function FinishStyles() {
  return <style>{`
.jho-bw img{filter:grayscale(1) contrast(1.08)}
.jho-bw .jho-mosaic{background:#000!important;height:4px}
.jho-bw .jho-mosaic > *{display:none!important}
`}</style>;
}

/* Export filename for a rendered poster, e.g.
     JHO_2026-05-20_Poster-Duo_Print-BW.png
   Purpose lives in the name so an online JPEG and a newsprint file can't be
   confused in a shared folder or sent to the wrong vendor. */
function posterFileName(variant, finish, ext = 'png') {
  const slug = { online: 'Online', 'print-color': 'Print-Color', 'print-bw': 'Print-BW' }[finish];
  return 'JHO_' + CONCERT.iso + '_Poster-' + variant + '_' + slug + '.' + ext;
}

/* Donate QR — real scannable code for jhorchestra.org/donate. Online uses the
   ink-on-paper code; both print finishes use the pure black-on-white one. */
function DonateQR({ tone = 'light', finish = 'online', size = 53.5, style }) {
  const file = finish === 'online'
    ? 'donate-on-' + (tone === 'dark' ? 'ink' : 'paper')
    : 'donate-print-bw';
  const dark = tone === 'dark';
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',...style}}>
      <img src={'../../assets/qr/' + file + '.png'} alt="Scan to donate"
           style={{width:size+'px',height:size+'px',display:'block',imageRendering:'pixelated'}} />
      <div style={{fontFamily:'var(--jho-font-text)',fontWeight:700,fontSize:'8.9px',letterSpacing:'0.2em',
                   textTransform:'uppercase',whiteSpace:'nowrap',
                   color:dark?'rgba(250,246,238,0.8)':'var(--jho-muted)'}}>Donate →</div>
    </div>
  );
}

/* Footer: URL + handle left, donate QR centre, admission terms + griffin right. */
function Footer({ finish = 'online' }) {
  return (
    <div style={{padding:'11.7px 32.3px 15.1px',borderTop:'1px solid var(--jho-border)',display:'grid',
                 gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:'16.5px',flexShrink:0}}>
      <div style={{fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'17.2px',letterSpacing:'-0.01em'}}>
        jhorchestra.org
        <small style={{display:'block',fontFamily:'var(--jho-font-text)',fontWeight:500,fontSize:'8.9px',
                       letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--jho-muted)',marginTop:'2px'}}>@jhorchestra</small>
      </div>
      <DonateQR finish={finish} />
      <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'11px'}}>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'15.1px',
                       color:'var(--jho-tandoor)',lineHeight:1.1}}>Free Admission</div>
          <div style={{fontFamily:'var(--jho-font-text)',fontWeight:600,fontSize:'8.9px',letterSpacing:'0.15em',
                       textTransform:'uppercase',color:'var(--jho-muted)',marginTop:'2px',whiteSpace:'nowrap'}}>$20 Suggested Donation</div>
        </div>
        <img className="jho-seal" src="../../assets/logos/griffin-seal.webp"
             alt="Jackson Heights Orchestra griffin seal"
             style={{width:'42.5px',height:'42.5px',objectFit:'contain',flexShrink:0}} />
      </div>
    </div>
  );
}

/* Layout A — Big Type. A true scale model of templates/concert-poster*: every
   size is the template's value × 560/816, so this contact sheet and the print
   artwork are the same design at two resolutions. */
function PosterA({ soloists = 1, finish = 'online' }) {
  const c = CONCERT;
  const guests = c.people.slice(1, soloists);
  const solo = guests.length === 0;
  const f = FINISH[finish];
  return (
    <div className={finish === 'print-bw' ? 'jho-bw' : undefined}
         style={{...sheet, ...(f.vars || {}),
                 boxShadow: finish === 'online' ? sheet.boxShadow : '0 0 0 1px rgba(0,0,0,0.18)',
                 borderRadius: finish === 'online' ? sheet.borderRadius : 0,
                 display:'flex',flexDirection:'column'}}>
      <FinishStyles />
      <div style={{padding:'8.9px 32.3px',textAlign:'center',borderBottom:'1px solid var(--jho-ink)',
                   flexShrink:0,fontFamily:'var(--jho-font-text)',fontWeight:600,fontSize:'11px',
                   lineHeight:1.2,letterSpacing:'0.1em',textTransform:'uppercase',
                   color:'var(--jho-muted)',whiteSpace:'nowrap'}}>{c.presents}</div>

      <div style={{padding:'17.8px 32.3px',display:'grid',gridTemplateColumns:'1fr auto',gap:'20.6px',
                   alignItems:'center',justifyItems:'center',flexShrink:0}}>
        <Wordmark color="subway" align="center" size={60.4} />
        <Portrait {...c.people[0]} size={137.3} layout="stacked" nameSize={18.5} roleSize={9.6} />
      </div>

      <MosaicRule variant="bar" className="jho-mosaic" style={{margin:'0 32.3px',flexShrink:0}} />

      <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'15.1px 39.8px',
                   padding:'13px 32.3px 11.7px',
                   borderBottom:'1px solid var(--jho-border)',flexShrink:0}}>
        <div>
          <h5 style={{margin:'0 0 4.1px',fontSize:'8.9px',textTransform:'uppercase',letterSpacing:'0.2em',
                      color:'var(--jho-muted)',fontWeight:600}}>When</h5>
          <strong style={{display:'block',fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:'17.2px',
                          letterSpacing:'-0.01em',color:'var(--jho-ink)',marginBottom:'2px',lineHeight:1.2,
                          whiteSpace:'nowrap'}}>{c.dayname} · {c.date}</strong>
          <p style={{margin:0,fontFamily:'var(--jho-font-text)',fontSize:'11px',fontWeight:500,
                     lineHeight:1.3,color:'var(--jho-muted)',whiteSpace:'nowrap'}}>{c.time} · {c.doors}</p>
        </div>
        <div>
          <h5 style={{margin:'0 0 4.1px',fontSize:'8.9px',textTransform:'uppercase',letterSpacing:'0.2em',
                      color:'var(--jho-muted)',fontWeight:600}}>Where</h5>
          <strong style={{display:'block',fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:'17.2px',
                          letterSpacing:'-0.01em',color:'var(--jho-ink)',marginBottom:'2px',lineHeight:1.2,
                          whiteSpace:'nowrap'}}>{c.venue}</strong>
          <p style={{margin:0,fontFamily:'var(--jho-font-text)',fontSize:'10.6px',fontWeight:500,
                     lineHeight:1.3,color:'var(--jho-muted)',whiteSpace:'nowrap'}}>{c.address}</p>
        </div>
      </div>

      <div style={{padding:'12.4px 32.3px',display:'grid',gridTemplateColumns:solo?'1fr':'1fr auto',
                   gap:'24.7px',flex:'1 1 auto',minHeight:0,alignItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'10.3px',minWidth:0,justifyContent:'center'}}>
          <div>
            <div style={{fontFamily:'var(--jho-font-display)',fontWeight:800,fontSize:solo?'22px':'19.9px',
                         letterSpacing:'-0.02em',color:'var(--jho-tandoor)',lineHeight:1.05}}>{c.title}</div>
            <div style={{fontFamily:'var(--jho-font-display)',fontStyle:'italic',fontWeight:400,
                         fontSize:solo?'13px':'11.7px',color:'var(--jho-muted)',lineHeight:1.3,
                         marginTop:'4.1px'}}>A centennial concert for the church on 37th Street.</div>
          </div>
          {c.works.map(w=><WorkListing key={w.work} {...w} size={solo?'md':'sm'} />)}
        </div>
        {guests.length ? (
          <div style={{display:'flex',flexDirection:'column',gap:'17.8px',alignSelf:'center',flexShrink:0}}>
            {guests.map(g=><Portrait key={g.name} {...g} size={102.9} layout="inline" nameSize={13} roleSize={8.2} />)}
          </div>
        ) : null}
      </div>
      <Footer finish={finish} />
    </div>
  );
}

/* Layout B — Color block */
function PosterB() {
  const c = CONCERT;
  return (
    <div style={{...sheet,display:'grid',gridTemplateRows:'330px 1fr'}}>
      <div style={{background:'var(--jho-subway)',color:'var(--jho-paper)',padding:36,display:'flex',
                   flexDirection:'column',justifyContent:'space-between',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:'-60px',top:'-60px',width:'260px',height:'260px',borderRadius:'50%',
                     background:'var(--jho-tandoor)',opacity:0.7}} />
        <div style={{position:'absolute',right:'20px',top:'60px',width:'120px',height:'120px',borderRadius:'50%',
                     background:'var(--jho-saffron)',opacity:0.9}} />
        <div style={{fontSize:'10px',lineHeight:1.5,color:'rgba(250,246,238,0.8)',textTransform:'uppercase',
                     letterSpacing:'0.15em',fontWeight:500,maxWidth:'340px',position:'relative',zIndex:2}}>{c.presents}</div>
        <div style={{position:'relative',zIndex:2}}>
          <Wordmark color="white" height={150} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginTop:20,position:'relative',zIndex:2}}>
          {[['When',c.dayname+' · '+c.date],['Time',c.time],['Where',c.venue]].map(([h,v])=>(
            <div key={h}>
              <h5 style={{margin:'0 0 2px',fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.18em',
                          color:'rgba(250,246,238,0.7)',fontWeight:600}}>{h}</h5>
              <p style={{margin:0,fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'15px',
                         letterSpacing:'-0.01em',lineHeight:1.2}}>{v}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:'30px 36px',display:'grid',gridTemplateRows:'auto 1fr auto',gap:18}}>
        <div>
          <div style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.22em',color:'var(--jho-tandoor)',
                       fontWeight:700,marginBottom:10}}>{c.title}</div>
          {c.works.map((w,i)=>(
            <div key={w.work} style={{padding:'12px 0',borderTop:'1px solid rgba(20,26,42,0.2)',
                                      borderBottom:i===c.works.length-1?'1px solid rgba(20,26,42,0.2)':'none'}}>
              <WorkListing number={'0'+(i+1)} composer={w.composer} work={w.work} size="sm" />
            </div>
          ))}
        </div>
        <div />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <img src="../../assets/logos/griffin-seal.webp" alt="Jackson Heights Orchestra griffin seal" style={{width:'56px',height:'56px',objectFit:'contain'}} />
            <div style={{fontSize:'9px',lineHeight:1.35,color:'var(--jho-muted)',maxWidth:'160px'}}>
              <strong style={{display:'block',fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'14px',
                              color:'var(--jho-tandoor)',marginBottom:'2px'}}>Free Admission</strong>
              $20 Suggested Donation
            </div>
          </div>
          <div style={{fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'16px',letterSpacing:'-0.01em',textAlign:'right'}}>
            jhorchestra.org
            <small style={{display:'block',fontFamily:'var(--jho-font-text)',fontWeight:500,fontSize:'9px',
                           letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--jho-muted)',marginTop:'2px'}}>@jhorchestra</small>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Layout C — Editorial */
function PosterC() {
  const c = CONCERT;
  return (
    <div style={{...sheet,padding:'26px 36px',display:'grid',gridTemplateRows:'auto auto auto minmax(0,1fr) auto',gap:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:20}}>
        <div style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.18em',color:'var(--jho-muted)',
                     fontWeight:600,lineHeight:1.35,maxWidth:'280px'}}>{c.presents}</div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.22em',color:'var(--jho-tandoor)',fontWeight:700}}>{c.dayname}</div>
          <div style={{fontFamily:'var(--jho-font-display)',fontWeight:900,fontSize:'34px',lineHeight:0.9,letterSpacing:'-0.02em'}}>{c.date}</div>
          <div style={{fontSize:'11px',letterSpacing:'0.2em',marginTop:'2px',color:'var(--jho-muted)',fontWeight:600}}>{c.year}</div>
        </div>
      </div>
      <div style={{textAlign:'center',padding:'8px 0',borderTop:'2px solid var(--jho-ink)',borderBottom:'2px solid var(--jho-ink)'}}>
        <div style={{fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.3em',color:'var(--jho-muted)',
                     fontWeight:600,marginBottom:4}}>Presenting</div>
        <Wordmark color="tandoor" height={96} style={{margin:'0 auto'}} />
      </div>
      <div style={{textAlign:'center',fontFamily:'var(--jho-font-display)',fontStyle:'italic',fontWeight:400,
                   fontSize:'15px',lineHeight:1.3,padding:'2px 40px'}}>
        <span style={{fontSize:'22px',color:'var(--jho-tandoor)',marginRight:'2px'}}>“</span>
        {c.title}
        <span style={{fontSize:'22px',color:'var(--jho-tandoor)',marginLeft:'2px'}}>”</span>
      </div>
      <div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,padding:'9px 0',
                     borderTop:'1px solid rgba(20,26,42,0.25)',borderBottom:'1px solid rgba(20,26,42,0.25)',marginBottom:10}}>
          {[['Where',c.venue,c.address],['When',c.time,c.admission+', '+c.suggested]].map(([h,a,b])=>(
            <div key={h}>
              <h5 style={{margin:'0 0 4px',fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.22em',
                          color:'var(--jho-tandoor)',fontWeight:700}}>{h}</h5>
              <p style={{margin:0,fontFamily:'var(--jho-font-display)',fontSize:'13px',lineHeight:1.35}}>
                <strong style={{display:'block',fontWeight:800,fontSize:'15px',marginBottom:'2px'}}>{a}</strong>{b}
              </p>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          <div style={{fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.3em',color:'var(--jho-muted)',
                       fontWeight:600,textAlign:'center'}}>The programme</div>
          {c.works.map(w=>(
            <div key={w.work} style={{textAlign:'center',padding:'2px 0'}}>
              <h4 style={{margin:'0 0 2px',fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'13px',
                          letterSpacing:'0.02em',textTransform:'uppercase'}}>{w.composer}</h4>
              <p style={{margin:0,fontFamily:'var(--jho-font-display)',fontStyle:'italic',fontSize:'12px',
                         color:'var(--jho-muted)',fontWeight:400}}>{w.work}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:10,
                   borderTop:'1px solid var(--jho-ink)'}}>
        <div style={{fontFamily:'var(--jho-font-display)',fontWeight:700,fontSize:'15px',letterSpacing:'-0.01em'}}>
          jhorchestra.org
          <small style={{display:'block',fontFamily:'var(--jho-font-text)',fontWeight:500,fontSize:'9px',
                         letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--jho-muted)',marginTop:'2px'}}>@jhorchestra</small>
        </div>
        <img src="../../assets/logos/griffin-seal.webp" alt="Jackson Heights Orchestra griffin seal" style={{width:'56px',height:'56px',objectFit:'contain'}} />
      </div>
    </div>
  );
}

/* Named templates off the same layout — pick by how many artists front the concert,
   then by where the file is going. Finish never forks the markup. */
function PosterSolo({ finish }){ return <PosterA soloists={1} finish={finish} />; }
function PosterDuo({ finish }){ return <PosterA soloists={2} finish={finish} />; }
function PosterTrio({ finish }){ return <PosterA soloists={3} finish={finish} />; }

Object.assign(window, { PosterA, PosterSolo, PosterDuo, PosterTrio, PosterB, PosterC, DonateQR,
                        JHO_FINISH: FINISH, jhoPosterFileName: posterFileName, JHO_CONCERT: CONCERT });
