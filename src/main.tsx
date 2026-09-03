import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, CalendarDays, Check, ChevronDown, Clock3, Instagram, MapPin, Menu, Scissors, Star, UserRound, X } from 'lucide-react'
import './styles.css'
import { supabase } from './lib/supabase'

type Service = { name: string; description: string; price: string; duration: string; tone: string }

const services: Service[] = [
  { name: 'Corte clássico', description: 'Tesoura e máquina, acabamento preciso e finalização.', price: 'R$ 75', duration: '45 min', tone: 'olive' },
  { name: 'Corte + barba', description: 'O ritual completo para sair renovado da cadeira.', price: 'R$ 125', duration: '75 min', tone: 'rust' },
  { name: 'Barba premium', description: 'Toalha quente, desenho e produtos de alta performance.', price: 'R$ 65', duration: '35 min', tone: 'sand' },
  { name: 'Combo Atelier', description: 'Corte, barba e tratamento facial em uma experiência só.', price: 'R$ 165', duration: '100 min', tone: 'charcoal' },
]

const barbers = [
  { name: 'Caio Martins', role: 'Especialista em tesoura', image: 'https://images.unsplash.com/photo-1582296967860-9f7d1a9d1f0f?auto=format&fit=crop&w=900&q=85' },
  { name: 'Rafael Nunes', role: 'Barbas e visagismo', image: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=900&q=85' },
  { name: 'Léo Sampaio', role: 'Cortes contemporâneos', image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85' },
]

function App() {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedService, setSelectedService] = useState('Corte clássico')
  const [submitted, setSubmitted] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  const openBooking = (service = selectedService) => { setSelectedService(service); setSubmitted(false); setBookingError(''); setBookingOpen(true) }

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBookingError('')
    if (!supabase) { setBookingError('A conexão com o Supabase ainda não está disponível neste deploy.'); return }
    const form = new FormData(event.currentTarget)
    const nome = String(form.get('nome') || '')
    const telefone = String(form.get('telefone') || '')
    const data = String(form.get('data') || '')
    const horario = String(form.get('horario') || '')
    if (!nome || !telefone || !data || !horario) { setBookingError('Preencha todos os campos para confirmar seu horário.'); return }
    setBookingLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
    if (authError || !authData.user) { setBookingError('Ative o login anônimo em Supabase → Authentication → Providers → Anonymous.'); setBookingLoading(false); return }
    const user = authData.user
    await supabase.from('profiles').upsert({ id: user.id, nome, telefone, email: `anonimo-${user.id}@atelier31.local` })
    const { data: barber } = await supabase.from('barbers').select('id').eq('ativo', true).limit(1).single()
    const { data: service } = await supabase.from('services').select('id').eq('nome', selectedService).eq('ativo', true).single()
    if (!barber || !service) { setBookingError('Cadastre os serviços e barbeiros iniciais no Supabase antes de agendar.'); setBookingLoading(false); return }
    const { error } = await supabase.from('appointments').insert({ cliente_id: user.id, barbeiro_id: barber.id, servico_id: service.id, data, horario, status: 'pendente' })
    setBookingLoading(false)
    if (error) { setBookingError(error.code === '23505' ? 'Esse horário já foi reservado. Escolha outro.' : error.message); return }
    setSubmitted(true)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#inicio"><span>ATELIER</span><b>31</b></a>
        <nav className={mobileOpen ? 'main-nav is-open' : 'main-nav'}>
          <a href="#atelier" onClick={() => setMobileOpen(false)}>A casa</a>
          <a href="#servicos" onClick={() => setMobileOpen(false)}>Serviços</a>
          <a href="#barbeiros" onClick={() => setMobileOpen(false)}>Barbeiros</a>
          <a href="#contato" onClick={() => setMobileOpen(false)}>Onde estamos</a>
        </nav>
        <div className="header-actions"><button className="account-link account-button" onClick={() => openBooking()}><CalendarDays size={16} /> Meu horário</button><button className="header-cta" onClick={() => openBooking()}>Agendar <ArrowUpRight size={16} /></button></div>
        <button className="menu-toggle" aria-label="Abrir menu" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy reveal"><p className="eyebrow"><span className="eyebrow-line" /> Vila Madalena · São Paulo</p><h1>Seu estilo.<br /><em>Nossa precisão.</em></h1><p className="hero-text">Mais do que um corte. Um ritual urbano feito para quem sabe que presença também se constrói nos detalhes.</p><div className="hero-actions"><button className="button button-gold" onClick={() => openBooking()}>Agendar horário <ArrowUpRight size={18} /></button><a className="text-link" href="#atelier">Conhecer a casa <span>↓</span></a></div></div>
          <div className="hero-visual"><div className="hero-image" /><div className="hero-label"><span>01</span><div><strong>Precisão em cada detalhe</strong><small>Est. 2014 · São Paulo</small></div></div><div className="hero-stamp">A<span>31</span></div></div>
          <div className="hero-side-note">Barbearia contemporânea <span>↗</span></div>
        </section>

        <section className="marquee"><div>PRECISÃO <span>✦</span> PRESENÇA <span>✦</span> PERSONALIDADE <span>✦</span> PRECISÃO <span>✦</span> PRESENÇA <span>✦</span></div></section>

        <section className="intro-section section-pad" id="atelier"><div className="section-kicker">01 / A casa</div><div className="intro-grid"><div><h2>Um lugar para<br /><em>voltar a si.</em></h2></div><div className="intro-copy"><p className="large-copy">No Atelier 31, cada visita é uma pausa na pressa. Uma conversa boa, uma toalha quente, uma lâmina afiada e o tempo necessário para fazer direito.</p><p>Nosso trabalho começa antes da primeira tesourada: entendemos seu rosto, seu momento e o que você quer comunicar ao mundo.</p><a className="text-link" href="#barbeiros">Conheça nossos barbeiros <ArrowUpRight size={15} /></a></div></div><div className="editorial-images"><div className="image-tall" /><div className="image-small"><span>O detalhe<br />é o corte.</span></div><div className="number-mark">31</div></div></section>

        <section className="services-section section-pad" id="servicos"><div className="section-heading"><div><div className="section-kicker">02 / O menu</div><h2>Escolha seu<br /><em>ritual.</em></h2></div><p>Serviços pensados para a sua rotina,<br />executados com calma e intenção.</p></div><div className="service-list">{services.map((service, index) => <article className={`service-card ${service.tone}`} key={service.name}><div className="service-number">0{index + 1}</div><div className="service-icon"><Scissors size={22} /></div><h3>{service.name}</h3><p>{service.description}</p><div className="service-meta"><span>{service.price}</span><span><Clock3 size={14} /> {service.duration}</span></div><button className="service-book" onClick={() => openBooking(service.name)}>Agendar <ArrowUpRight size={16} /></button></article>)}</div></section>

        <section className="barbers-section section-pad" id="barbeiros"><div className="section-heading"><div><div className="section-kicker">03 / O time</div><h2>Mãos que<br /><em>entendem.</em></h2></div><p>Três histórias, um mesmo compromisso:<br />fazer você se sentir no seu melhor.</p></div><div className="barber-grid">{barbers.map((barber, index) => <article className="barber-card" key={barber.name}><div className="barber-image"><img src={barber.image} alt={barber.name} /><span>0{index + 1}</span></div><div className="barber-info"><div><h3>{barber.name}</h3><p>{barber.role}</p></div><ArrowUpRight size={18} /></div></article>)}</div></section>

        <section className="quote-section"><div className="quote-mark">“</div><blockquote>Não é sobre parecer<br /><em>outra pessoa.</em><br />É sobre parecer você.</blockquote><div className="quote-author"><span /> Atelier 31 · desde 2014</div></section>

        <section className="contact-section section-pad" id="contato"><div className="contact-card"><div><div className="section-kicker">04 / A visita</div><h2>Seu próximo<br /><em>ritual começa aqui.</em></h2><button className="button button-gold" onClick={() => openBooking()}>Agendar horário <ArrowUpRight size={18} /></button></div><div className="contact-details"><div className="detail"><MapPin size={18} /><div><small>Onde estamos</small><p>Rua Harmonia, 31 · Vila Madalena<br />São Paulo · SP</p><a href="https://maps.google.com" target="_blank" rel="noreferrer">Abrir no mapa ↗</a></div></div><div className="detail"><Clock3 size={18} /><div><small>Horários</small><p>Ter — Sex · 10h às 20h<br />Sáb · 9h às 18h</p></div></div><div className="detail"><Instagram size={18} /><div><small>Instagram</small><p>@atelier31.sp</p></div></div></div></div></section>
      </main>

      <footer className="site-footer"><a className="brand" href="#inicio"><span>ATELIER</span><b>31</b></a><p>Precisão, presença e personalidade.</p><span>© 2024 Atelier 31</span></footer>
      <a className="whatsapp" href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20os%20servi%C3%A7os." target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp">WA</a>

      {bookingOpen && <div className="modal-backdrop" onClick={() => setBookingOpen(false)}><div className="booking-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setBookingOpen(false)}><X size={19} /></button>{submitted ? <div className="success-state"><div className="success-icon"><Check /></div><div className="section-kicker">Tudo certo</div><h2>Seu horário está<br /><em>confirmado.</em></h2><p>Seu pedido para <strong>{selectedService}</strong> foi salvo. Nossa equipe confirma pelo WhatsApp.</p><button className="button button-dark" onClick={() => setBookingOpen(false)}>Voltar para o site</button></div> : <form onSubmit={submitBooking}><div className="section-kicker">Agendamento online</div><h2>Reserve seu<br /><em>momento.</em></h2><div className="step-row"><span className="active">01 Serviço</span><span>02 Data e hora</span><span>03 Seus dados</span></div><label>Escolha o serviço<select name="service" value={selectedService} onChange={event => setSelectedService(event.target.value)}>{services.map(service => <option key={service.name}>{service.name}</option>)}</select></label><div className="form-row"><label>Data<input name="data" type="date" required /></label><label>Horário<select name="horario" defaultValue="10:00"><option>10:00</option><option>11:30</option><option>14:00</option><option>16:30</option></select></label></div><label>Seu nome<input name="nome" placeholder="Como podemos te chamar?" required /></label><label>E-mail<input name="email" type="email" placeholder="voce@email.com" required /></label><label>Senha<input name="password" type="password" placeholder="Mínimo de 6 caracteres" required /></label>{bookingError && <p className="form-error">{bookingError}</p>}<button className="button button-gold full-button" type="submit" disabled={bookingLoading}>{bookingLoading ? 'Salvando...' : 'Confirmar agendamento'} <ArrowUpRight size={18} /></button><small className="modal-note">Sua conta é criada automaticamente · sem pagamento agora</small></form>}</div></div>}
      {bookingOpen && <div className="modal-backdrop" onClick={() => setBookingOpen(false)}><div className="booking-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setBookingOpen(false)}><X size={19} /></button>{submitted ? <div className="success-state"><div className="success-icon"><Check /></div><div className="section-kicker">Tudo certo</div><h2>Seu horário está<br /><em>confirmado.</em></h2><p>Seu pedido para <strong>{selectedService}</strong> foi salvo. Nossa equipe confirma pelo WhatsApp.</p><button className="button button-dark" onClick={() => setBookingOpen(false)}>Voltar para o site</button></div> : <form onSubmit={submitBooking}><div className="section-kicker">Agendamento online</div><h2>Reserve seu<br /><em>momento.</em></h2><div className="step-row"><span className="active">01 Serviço</span><span>02 Data e hora</span><span>03 Seus dados</span></div><label>Escolha o serviço<select name="service" value={selectedService} onChange={event => setSelectedService(event.target.value)}>{services.map(service => <option key={service.name}>{service.name}</option>)}</select></label><div className="form-row"><label>Data<input name="data" type="date" required /></label><label>Horário<select name="horario" defaultValue="10:00"><option>10:00</option><option>11:30</option><option>14:00</option><option>16:30</option></select></label></div><label>Seu nome<input name="nome" placeholder="Como podemos te chamar?" required /></label><label>WhatsApp<input name="telefone" placeholder="(11) 99999-9999" required /></label>{bookingError && <p className="form-error">{bookingError}</p>}<button className="button button-gold full-button" type="submit" disabled={bookingLoading}>{bookingLoading ? 'Salvando...' : 'Confirmar agendamento'} <ArrowUpRight size={18} /></button><small className="modal-note">Sem cadastro · confirmação pelo WhatsApp</small></form>}</div></div>}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
