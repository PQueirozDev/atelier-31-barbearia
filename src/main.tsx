import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronLeft, Clock3, Instagram, MapPin, Menu, Phone, Scissors, Star, UserRound, X,
} from 'lucide-react'
import './styles.css'
import { supabase } from './lib/supabase'

type Service = { name: string; description: string; price: string; duration: string; image: string }
type Relation = { nome: string }[] | { nome: string } | null
type Appointment = {
  id: string
  cliente_nome: string | null
  cliente_telefone: string | null
  data: string
  horario: string
  status: string
  services?: Relation
  barbers?: Relation
}

// Os nomes precisam ser iguais aos cadastrados no Supabase (services.nome / barbers.nome).
const services: Service[] = [
  { name: 'Corte clássico', description: 'Tesoura e máquina, acabamento preciso e finalização com produto.', price: 'R$ 75', duration: '45 min', image: '/images/servico-corte.jpg' },
  { name: 'Corte + barba', description: 'O ritual completo para sair renovado da cadeira.', price: 'R$ 125', duration: '75 min', image: '/images/servico-combo.jpg' },
  { name: 'Barba premium', description: 'Toalha quente, desenho na navalha e produtos de alta performance.', price: 'R$ 65', duration: '35 min', image: '/images/servico-barba.jpg' },
  { name: 'Combo Atelier', description: 'Corte, barba e tratamento facial em uma experiência só.', price: 'R$ 165', duration: '100 min', image: '/images/servico-premium.jpg' },
]

const barbers = [
  { name: 'Caio Martins', role: 'Especialista em tesoura', since: 'Na casa desde 2014', image: '/images/barbeiro-caio.jpg' },
  { name: 'Rafael Nunes', role: 'Barbas e visagismo', since: 'Na casa desde 2017', image: '/images/barbeiro-rafael.jpg' },
  { name: 'Léo Sampaio', role: 'Cortes contemporâneos', since: 'Na casa desde 2020', image: '/images/barbeiro-leo.jpg' },
]

const testimonials = [
  { name: 'Gustavo R.', text: 'Melhor barbearia que já frequentei em São Paulo. O Caio entende o que você quer antes de você terminar de explicar.' },
  { name: 'Marcelo T.', text: 'Toalha quente, conversa boa e uma barba impecável. Virou meu ritual de toda sexta.' },
  { name: 'André L.', text: 'Agendei pelo site em um minuto e fui atendido no horário. Ambiente incrível, atendimento de outro nível.' },
]

const hours = [
  ['Terça a sexta', '10h — 21h'],
  ['Sábado', '09h — 19h'],
  ['Domingo e segunda', 'Fechado'],
]

const TIMES = ['10:00', '10:45', '11:30', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30', '18:15', '19:00', '19:45']

const pad = (n: number) => String(n).padStart(2, '0')
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/** Horário de hoje que já passou (com 30 min de antecedência). */
const isPast = (date: string, time: string) => {
  const now = new Date()
  if (date !== isoDate(now)) return false
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m < now.getHours() * 60 + now.getMinutes() + 30
}
const relationName = (value: Relation | undefined) => (Array.isArray(value) ? value[0]?.nome : value?.nome)

/** Próximos dias em que a casa abre (fecha domingo e segunda). */
function nextOpenDays(count: number) {
  const days: Date[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 1) days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

/** Anima a entrada dos elementos com a classe .reveal quando entram na tela. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function App() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [staffOpen, setStaffOpen] = useState(false)
  const [staffDashboardOpen, setStaffDashboardOpen] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [staffLoading, setStaffLoading] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(services[0].name)
  const [selectedBarber, setSelectedBarber] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  const [preview, setPreview] = useState<{ image: string; x: number; y: number } | null>(null)
  const servicesRef = useRef<HTMLDivElement>(null)
  const days = useMemo(() => nextOpenDays(10), [])

  useReveal()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = bookingOpen || staffOpen || staffDashboardOpen || mobileOpen ? 'hidden' : ''
  }, [bookingOpen, staffOpen, staffDashboardOpen, mobileOpen])

  const openBooking = (serviceName = selectedService, barber = '') => {
    setSelectedService(serviceName)
    setSelectedBarber(barber)
    setSelectedDate('')
    setSelectedTime('')
    setStep(1)
    setSubmitted(false)
    setBookingError('')
    setBookingOpen(true)
    setMobileOpen(false)
  }

  const loadAppointments = async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('appointments')
      .select('id, cliente_nome, cliente_telefone, data, horario, status, services(nome), barbers(nome)')
      .order('data', { ascending: true })
      .order('horario', { ascending: true })
    if (error) { setStaffError(error.message); return }
    setAppointments((data || []) as Appointment[])
  }

  const submitStaffLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStaffError('')
    if (!supabase) { setStaffError('Configure as variáveis do Supabase no Vercel.'); return }
    const form = new FormData(event.currentTarget)
    setStaffLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) })
    if (error || !data.user) {
      const message = error?.message.toLowerCase() || ''
      setStaffError(
        message.includes('email not confirmed')
          ? 'Confirme o e-mail do funcionário no Supabase antes de entrar.'
          : message.includes('invalid api key') || message.includes('fetch')
            ? 'A conexão com o Supabase está inválida. Confira as variáveis no Vercel.'
            : 'Não foi possível entrar. Use o e-mail e a senha criados em Authentication → Users.',
      )
      setStaffLoading(false)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('tipo_usuario').eq('id', data.user.id).single()
    if (profile?.tipo_usuario !== 'admin') {
      await supabase.auth.signOut()
      setStaffError('Este acesso é exclusivo para a equipe da barbearia.')
      setStaffLoading(false)
      return
    }
    await loadAppointments()
    setStaffLoading(false)
    setStaffOpen(false)
    setStaffDashboardOpen(true)
  }

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBookingError('')
    if (!supabase) { setBookingError('A conexão com o Supabase ainda não está disponível neste deploy.'); return }
    const form = new FormData(event.currentTarget)
    const nome = String(form.get('nome') || '').trim()
    const telefone = String(form.get('telefone') || '').trim()
    if (!nome || !telefone || !selectedDate || !selectedTime) { setBookingError('Preencha todos os campos para confirmar seu horário.'); return }
    setBookingLoading(true)
    let barberQuery = supabase.from('barbers').select('id').eq('ativo', true)
    if (selectedBarber) barberQuery = barberQuery.eq('nome', selectedBarber)
    const { data: barber, error: barberError } = await barberQuery.limit(1).single()
    const { data: serviceRow, error: serviceError } = await supabase.from('services').select('id').eq('nome', selectedService).eq('ativo', true).single()
    if (barberError || serviceError || !barber || !serviceRow) {
      setBookingError(`Erro ao carregar opções: ${barberError?.message || serviceError?.message || 'nenhum serviço ou barbeiro ativo encontrado'}`)
      setBookingLoading(false)
      return
    }
    const { error } = await supabase.rpc('create_guest_appointment', {
      p_nome: nome, p_telefone: telefone, p_barbeiro_id: barber.id, p_servico_id: serviceRow.id, p_data: selectedDate, p_horario: selectedTime,
    })
    setBookingLoading(false)
    if (error) { setBookingError(error.code === '23505' ? 'Esse horário já foi reservado. Escolha outro.' : error.message); return }
    setSubmitted(true)
  }

  const service = services.find(s => s.name === selectedService) ?? services[0]
  const dateLabel = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    : ''

  return (
    <div className="app-shell">
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
        <a className="brand" href="#inicio"><span>ATELIER</span><b>31</b></a>
        <nav className={mobileOpen ? 'main-nav is-open' : 'main-nav'}>
          <a href="#atelier" onClick={() => setMobileOpen(false)}>A casa</a>
          <a href="#servicos" onClick={() => setMobileOpen(false)}>Serviços</a>
          <a href="#barbeiros" onClick={() => setMobileOpen(false)}>Barbeiros</a>
          <a href="#galeria" onClick={() => setMobileOpen(false)}>Galeria</a>
          <a href="#contato" onClick={() => setMobileOpen(false)}>Onde estamos</a>
          <button className="nav-cta" onClick={() => openBooking()}>Agendar horário <ArrowUpRight size={16} /></button>
        </nav>
        <div className="header-actions">
          <button className="account-link" onClick={() => setStaffOpen(true)}><UserRound size={15} /> Área da equipe</button>
          <button className="header-cta" onClick={() => openBooking()}>Agendar <ArrowUpRight size={15} /></button>
        </div>
        <button className="menu-toggle" aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
      </header>

      <main>
        {/* ---------------- HERO ---------------- */}
        <section className="hero" id="inicio">
          <div className="hero-media" aria-hidden="true"><img src="/images/hero.jpg" alt="" /></div>
          <div className="hero-grain" aria-hidden="true" />
          <div className="hero-content">
            <p className="eyebrow hero-in" style={{ animationDelay: '.1s' }}><span className="eyebrow-line" /> Vila Madalena · São Paulo</p>
            <h1 className="hero-in" style={{ animationDelay: '.25s' }}>Seu estilo.<br /><em>Nossa precisão.</em></h1>
            <p className="hero-text hero-in" style={{ animationDelay: '.4s' }}>Mais do que um corte. Um ritual urbano feito com calma, técnica e intenção — para quem sabe que presença se constrói nos detalhes.</p>
            <div className="hero-actions hero-in" style={{ animationDelay: '.55s' }}>
              <button className="button button-brass" onClick={() => openBooking()}>Agendar horário <ArrowUpRight size={18} /></button>
              <a className="text-link" href="#servicos">Ver o menu <ArrowRight size={16} /></a>
            </div>
            <dl className="hero-stats hero-in" style={{ animationDelay: '.7s' }}>
              <div><dt>10+</dt><dd>anos de casa</dd></div>
              <div><dt>4,9 <Star size={16} fill="currentColor" /></dt><dd>no Google</dd></div>
              <div><dt>12 mil</dt><dd>cortes por ano</dd></div>
            </dl>
          </div>
          <div className="hero-badge" aria-hidden="true">
            <svg viewBox="0 0 120 120"><defs><path id="circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs><text><textPath href="#circle">ATELIER 31 · BARBEARIA · DESDE 2014 · </textPath></text></svg>
            <span>31</span>
          </div>
          <a className="scroll-hint" href="#atelier" aria-label="Rolar para a próxima seção"><span /></a>
        </section>

        <section className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>PRECISÃO <span>✦</span> PRESENÇA <span>✦</span> PERSONALIDADE <span>✦</span> TOALHA QUENTE <span>✦</span> NAVALHA <span>✦</span> RITUAL <span>✦</span></div>
            ))}
          </div>
        </section>

        {/* ---------------- A CASA ---------------- */}
        <section className="intro-section section-pad" id="atelier">
          <div className="intro-grid">
            <div className="intro-copy reveal">
              <div className="section-kicker">01 / A casa</div>
              <h2>Um lugar para<br /><em>voltar a si.</em></h2>
              <p className="large-copy">No Atelier 31, cada visita é uma pausa na pressa. Uma conversa boa, uma toalha quente, uma lâmina afiada e o tempo necessário para fazer direito.</p>
              <p>Nosso trabalho começa antes da primeira tesourada: entendemos seu rosto, sua rotina e o que você quer comunicar ao mundo.</p>
              <ul className="check-list">
                <li><Check size={16} /> Consultoria de visagismo em todo atendimento</li>
                <li><Check size={16} /> Café, cerveja artesanal ou whisky da casa</li>
                <li><Check size={16} /> Produtos profissionais à venda no balcão</li>
              </ul>
            </div>
            <div className="intro-images">
              <figure className="img-a reveal"><img src="/images/casa-1.jpg" alt="Barbeiro finalizando uma barba com navalha" loading="lazy" /></figure>
              <figure className="img-b reveal"><img src="/images/casa-2.jpg" alt="Detalhe de um degradê feito na máquina" loading="lazy" /><figcaption>O detalhe<br />é o corte.</figcaption></figure>
            </div>
          </div>
        </section>

        {/* ---------------- SERVIÇOS ---------------- */}
        <section className="services-section section-pad" id="servicos">
          <div className="section-heading reveal">
            <div><div className="section-kicker">02 / O menu</div><h2>Escolha seu<br /><em>ritual.</em></h2></div>
            <p>Serviços pensados para a sua rotina, executados com calma e intenção. Clique em um serviço para agendar.</p>
          </div>
          <div className="service-list reveal" ref={servicesRef} onMouseLeave={() => setPreview(null)}>
            {services.map((s, index) => (
              <button
                className="service-row"
                key={s.name}
                onClick={() => openBooking(s.name)}
                onMouseMove={e => {
                  const rect = servicesRef.current?.getBoundingClientRect()
                  if (rect) setPreview({ image: s.image, x: e.clientX - rect.left, y: e.clientY - rect.top })
                }}
              >
                <span className="service-number">0{index + 1}</span>
                <span className="service-name">{s.name}<small>{s.description}</small></span>
                <span className="service-meta"><Clock3 size={14} /> {s.duration}</span>
                <span className="service-price">{s.price}</span>
                <span className="service-arrow"><ArrowUpRight size={20} /></span>
                <img className="service-thumb" src={s.image} alt="" loading="lazy" />
              </button>
            ))}
            {preview && (
              <div className="service-preview" style={{ transform: `translate(${preview.x}px, ${preview.y}px)` }}>
                <img src={preview.image} alt="" />
              </div>
            )}
          </div>
        </section>

        {/* ---------------- BARBEIROS ---------------- */}
        <section className="barbers-section section-pad" id="barbeiros">
          <div className="section-heading reveal">
            <div><div className="section-kicker">03 / O time</div><h2>Mãos que<br /><em>entendem.</em></h2></div>
            <p>Três histórias, um mesmo compromisso: fazer você sair da cadeira no seu melhor.</p>
          </div>
          <div className="barber-grid">
            {barbers.map((b, index) => (
              <article className="barber-card reveal" key={b.name} style={{ transitionDelay: `${index * 0.1}s` }}>
                <div className="barber-image"><img src={b.image} alt={`${b.name}, ${b.role}`} loading="lazy" /><span>0{index + 1}</span></div>
                <div className="barber-info">
                  <div><h3>{b.name}</h3><p>{b.role}</p><small>{b.since}</small></div>
                  <button className="round-button" onClick={() => openBooking(selectedService, b.name)} aria-label={`Agendar com ${b.name}`}><ArrowUpRight size={18} /></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------- GALERIA ---------------- */}
        <section className="gallery-section section-pad" id="galeria">
          <div className="section-heading reveal">
            <div><div className="section-kicker">04 / Galeria</div><h2>Feito<br /><em>à mão.</em></h2></div>
            <a className="text-link" href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={16} /> @atelier31</a>
          </div>
          <div className="gallery-grid">
            {['galeria-1', 'galeria-2', 'galeria-3', 'galeria-4', 'casa-2'].map((g, i) => (
              <figure className={`g-${i + 1} reveal`} key={g}><img src={`/images/${g}.jpg`} alt="Trabalho do Atelier 31" loading="lazy" /></figure>
            ))}
          </div>
        </section>

        {/* ---------------- DEPOIMENTOS ---------------- */}
        <section className="quote-section section-pad">
          <div className="section-kicker reveal">05 / Quem senta na cadeira</div>
          <div className="testimonial-grid">
            {testimonials.map((t, i) => (
              <figure className="testimonial reveal" key={t.name} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="stars">{Array.from({ length: 5 }).map((_, s) => <Star key={s} size={14} fill="currentColor" />)}</div>
                <blockquote>“{t.text}”</blockquote>
                <figcaption>{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ---------------- CONTATO ---------------- */}
        <section className="contact-section section-pad" id="contato">
          <div className="contact-card reveal">
            <div>
              <div className="section-kicker">06 / A visita</div>
              <h2>Seu próximo<br /><em>ritual começa aqui.</em></h2>
              <button className="button button-brass" onClick={() => openBooking()}>Agendar horário <ArrowUpRight size={18} /></button>
            </div>
            <div className="contact-details">
              <div className="detail"><MapPin size={18} /><div><small>Onde estamos</small><p>Rua Harmonia, 31 · Vila Madalena<br />São Paulo · SP</p><a href="https://maps.google.com/?q=Rua+Harmonia+31+Sao+Paulo" target="_blank" rel="noreferrer">Abrir no mapa ↗</a></div></div>
              <div className="detail"><Clock3 size={18} /><div><small>Horários</small>{hours.map(([d, h]) => <p className="hour-row" key={d}><span>{d}</span><span>{h}</span></p>)}</div></div>
              <div className="detail"><Phone size={18} /><div><small>Contato</small><p>(11) 99999-9999</p><a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">Chamar no WhatsApp ↗</a></div></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand" href="#inicio"><span>ATELIER</span><b>31</b></a>
        <p>Precisão, presença e personalidade.</p>
        <span>© {new Date().getFullYear()} Atelier 31 · Projeto de portfólio</span>
      </footer>

      <a className="whatsapp" href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os." target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">
        <img src="https://cdn.simpleicons.org/whatsapp/ffffff" alt="" />
      </a>

      {/* ---------------- ÁREA DA EQUIPE ---------------- */}
      {staffOpen && (
        <div className="modal-backdrop" onClick={() => setStaffOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setStaffOpen(false)} aria-label="Fechar"><X size={19} /></button>
            <div className="section-kicker">Acesso restrito</div>
            <h2>Área da<br /><em>equipe.</em></h2>
            <p className="modal-copy">Entre para acompanhar os clientes e os horários reservados.</p>
            <form onSubmit={submitStaffLogin} className="modal-form">
              <label>E-mail profissional<input name="email" type="email" placeholder="equipe@atelier31.com" required /></label>
              <label>Senha<input name="password" type="password" placeholder="••••••••" required /></label>
              {staffError && <p className="form-error">{staffError}</p>}
              <button className="button button-brass full" disabled={staffLoading}>{staffLoading ? 'Entrando…' : 'Entrar'} <ArrowUpRight size={18} /></button>
            </form>
          </div>
        </div>
      )}

      {staffDashboardOpen && (
        <div className="modal-backdrop" onClick={() => setStaffDashboardOpen(false)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setStaffDashboardOpen(false)} aria-label="Fechar"><X size={19} /></button>
            <div className="section-kicker">Painel interno</div>
            <h2>Agenda da <em>casa.</em></h2>
            <div className="dashboard-summary">
              <strong>{appointments.length}</strong><span>agendamentos<br />registrados</span>
              <button className="button button-ghost" onClick={loadAppointments}>Atualizar</button>
            </div>
            {staffError && <p className="form-error">{staffError}</p>}
            <div className="appointments-table">
              <div className="table-row table-head"><span>Cliente</span><span>Serviço</span><span>Barbeiro</span><span>Data e hora</span><span>Status</span></div>
              {appointments.length === 0 ? (
                <p className="empty-state">Nenhum agendamento encontrado.</p>
              ) : (
                appointments.map(a => (
                  <div className="table-row" key={a.id}>
                    <span><strong>{a.cliente_nome || 'Cliente'}</strong><small>{a.cliente_telefone || 'Sem WhatsApp'}</small></span>
                    <span>{relationName(a.services) || 'Serviço'}</span>
                    <span>{relationName(a.barbers) || '—'}</span>
                    <span>{new Date(`${a.data}T${a.horario}`).toLocaleDateString('pt-BR')} · {a.horario.slice(0, 5)}</span>
                    <span className="status-pill">{a.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- AGENDAMENTO ---------------- */}
      {bookingOpen && (
        <div className="modal-backdrop" onClick={() => setBookingOpen(false)}>
          <div className="modal booking" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setBookingOpen(false)} aria-label="Fechar"><X size={19} /></button>
            {submitted ? (
              <div className="success-state">
                <div className="success-icon"><Check /></div>
                <div className="section-kicker">Tudo certo</div>
                <h2>Horário<br /><em>reservado.</em></h2>
                <p><strong>{selectedService}</strong>{selectedBarber ? ` com ${selectedBarber}` : ''} — {dateLabel}, às {selectedTime}. Nossa equipe confirma pelo WhatsApp.</p>
                <button className="button button-brass" onClick={() => setBookingOpen(false)}>Voltar ao site</button>
              </div>
            ) : (
              <>
                <div className="steps" aria-label={`Etapa ${step} de 3`}>
                  {['Serviço', 'Data e hora', 'Seus dados'].map((label, i) => (
                    <span key={label} className={step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}>{step > i + 1 ? <Check size={12} /> : i + 1} {label}</span>
                  ))}
                </div>

                {step === 1 && (
                  <div className="step-body">
                    <h2>Escolha seu<br /><em>ritual.</em></h2>
                    <div className="option-list">
                      {services.map(s => (
                        <button key={s.name} className={`option${selectedService === s.name ? ' selected' : ''}`} onClick={() => setSelectedService(s.name)}>
                          <img src={s.image} alt="" />
                          <span><strong>{s.name}</strong><small>{s.duration}</small></span>
                          <b>{s.price}</b>
                        </button>
                      ))}
                    </div>
                    <p className="label-text">Com quem?</p>
                    <div className="chip-row">
                      <button className={`chip${selectedBarber === '' ? ' selected' : ''}`} onClick={() => setSelectedBarber('')}>Sem preferência</button>
                      {barbers.map(b => (
                        <button key={b.name} className={`chip${selectedBarber === b.name ? ' selected' : ''}`} onClick={() => setSelectedBarber(b.name)}>{b.name.split(' ')[0]}</button>
                      ))}
                    </div>
                    <button className="button button-brass full" onClick={() => setStep(2)}>Continuar <ArrowRight size={18} /></button>
                  </div>
                )}

                {step === 2 && (
                  <div className="step-body">
                    <h2>Quando<br /><em>fica bom?</em></h2>
                    <p className="label-text"><CalendarDays size={14} /> Dia</p>
                    <div className="day-row">
                      {days.map(d => {
                        const v = isoDate(d)
                        return (
                          <button key={v} className={`day${selectedDate === v ? ' selected' : ''}`} onClick={() => { setSelectedDate(v); if (selectedTime && isPast(v, selectedTime)) setSelectedTime('') }}>
                            <small>{d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</small>
                            <strong>{d.getDate()}</strong>
                            <small>{d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small>
                          </button>
                        )
                      })}
                    </div>
                    <p className="label-text"><Clock3 size={14} /> Horário</p>
                    <div className="chip-row times">
                      {TIMES.map(t => (
                        <button key={t} className={`chip${selectedTime === t ? ' selected' : ''}`} onClick={() => setSelectedTime(t)} disabled={!selectedDate || isPast(selectedDate, t)}>{t}</button>
                      ))}
                    </div>
                    <div className="step-actions">
                      <button className="button button-ghost" onClick={() => setStep(1)}><ChevronLeft size={18} /> Voltar</button>
                      <button className="button button-brass" disabled={!selectedDate || !selectedTime} onClick={() => setStep(3)}>Continuar <ArrowRight size={18} /></button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <form className="step-body modal-form" onSubmit={submitBooking}>
                    <h2>Quase<br /><em>lá.</em></h2>
                    <div className="summary">
                      <img src={service.image} alt="" />
                      <div><strong>{selectedService}</strong><small>{selectedBarber || 'Sem preferência de barbeiro'} · {dateLabel} · {selectedTime}</small></div>
                      <b>{service.price}</b>
                    </div>
                    <label>Seu nome<input name="nome" placeholder="Como devemos te chamar?" autoComplete="name" required /></label>
                    <label>WhatsApp<input name="telefone" type="tel" placeholder="(11) 90000-0000" autoComplete="tel" required /></label>
                    {bookingError && <p className="form-error">{bookingError}</p>}
                    <div className="step-actions">
                      <button type="button" className="button button-ghost" onClick={() => setStep(2)}><ChevronLeft size={18} /> Voltar</button>
                      <button className="button button-brass" disabled={bookingLoading}>{bookingLoading ? 'Reservando…' : 'Confirmar horário'} <Scissors size={16} /></button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {mobileOpen && <div className="nav-backdrop" onClick={() => setMobileOpen(false)} />}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
