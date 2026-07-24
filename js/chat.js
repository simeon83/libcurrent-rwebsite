// LIBCURRENT RENEWABLE — "Amp", the site chat assistant.
// This is a friendly, rule-based assistant (not a connected AI model) —
// it reads visitor messages for keywords and replies with warm, natural
// pacing (typing indicator + short delay) so it feels conversational.
// See the handoff notes for how to upgrade this to a real generative AI
// backend later if desired.

(function () {
  const state = {
    name: 'Amp',
    greeting: "Hi, I'm Amp \uD83D\uDC4B I can help with quotes, services, or hours. What can I help you with today?",
    phone: '+231 77 000 0000',
    whatsapp: '23177000000',
    hours: 'Mon\u2013Fri 8am\u20136pm, Sat 9am\u20133pm. 24/7 for emergencies.',
    opened: false,
    greeted: false
  };

  const launcher = document.getElementById('chat-launcher');
  const panel = document.getElementById('chat-panel');
  const closeBtn = document.getElementById('chat-close');
  const body = document.getElementById('chat-body');
  const quickWrap = document.getElementById('chat-quick');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const avatarLetter = document.getElementById('chat-avatar-letter');

  if (!launcher || !panel) return; // widget not present on this page load yet

  function scrollToBottom() { body.scrollTop = body.scrollHeight; }

  function addMessage(text, from) {
    const el = document.createElement('div');
    el.className = 'chat-msg ' + (from === 'user' ? 'user' : 'bot');
    el.textContent = text;
    body.appendChild(el);
    scrollToBottom();
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'chat-typing';
    el.id = 'chat-typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(el);
    scrollToBottom();
  }
  function hideTyping() {
    const el = document.getElementById('chat-typing-indicator');
    if (el) el.remove();
  }

  // Human-like reply pacing: short delay scaled to reply length, capped,
  // so replies never feel instant but never feel slow either.
  function botReply(text, delayOverride) {
    showTyping();
    const delay = delayOverride ?? Math.min(1600, 500 + text.length * 12);
    setTimeout(() => {
      hideTyping();
      addMessage(text, 'bot');
      renderQuickReplies(currentQuickReplies());
    }, delay);
  }

  function setQuickReplies(list) {
    quickWrap.innerHTML = '';
    list.forEach(label => {
      const b = document.createElement('button');
      b.textContent = label;
      b.addEventListener('click', () => handleUserMessage(label));
      quickWrap.appendChild(b);
    });
  }

  const defaultQuickReplies = ['Get a quote', 'Solar systems', 'Business hours', 'Talk to a human'];
  function currentQuickReplies() { return defaultQuickReplies; }
  function renderQuickReplies(list) { setQuickReplies(list); }

  // ---- Simple keyword-based understanding ----
  function respondTo(raw) {
    const msg = raw.toLowerCase();

    const has = (...words) => words.some(w => msg.includes(w));

    if (has('emergency', 'urgent', 'danger', 'sparking', 'fire', 'shock')) {
      return `If this is a live electrical emergency, please call us directly at ${state.phone} right now rather than waiting on chat. For anything else urgent, WhatsApp gets the fastest response.`;
    }
    if (has('hi', 'hello', 'hey', 'good morning', 'good afternoon')) {
      return "Hey there! Good to hear from you. Are you looking into electrical work, solar, or backup power — or just have a question?";
    }
    if (has('quote', 'price', 'cost', 'how much', 'estimate')) {
      return "I can point you to our quote form — it takes about 2 minutes and our team replies within 48 hours with a clear, no-obligation estimate. Want me to take you there?";
    }
    if (has('solar', 'panel', 'inverter', 'battery', 'off-grid', 'off grid')) {
      return "We design and install solar systems — grid-tied, hybrid, or fully off-grid — sized to your actual usage, plus batteries and inverters. Want details on residential or commercial solar specifically?";
    }
    if (has('generator', 'backup', 'ups', 'ats', 'outage', 'power cut')) {
      return "For backup power we handle generator installation, automatic transfer switches (ATS), UPS systems, and voltage stabilization — so outages don't interrupt you. Is this for a home or a business?";
    }
    if (has('house', 'home', 'residential', 'wiring', 'rewire', 'socket', 'lighting')) {
      return "For homes we handle wiring, rewiring, lighting, sockets, distribution boards, earthing, and repairs — all to code. Are you renovating, building new, or fixing an existing issue?";
    }
    if (has('commercial', 'industrial', 'factory', 'warehouse', 'business', 'office', 'three-phase', 'three phase', 'transformer')) {
      return "For commercial and industrial clients we cover three-phase systems, control panels, transformers, motor installation, and scheduled preventive maintenance. What kind of facility are we talking about?";
    }
    if (has('cctv', 'camera', 'lightning', 'inspection', 'safety', 'network cabling')) {
      return "We also handle the safety and technology side — lightning protection, electrical inspections, CCTV, and network cabling. Want to add that to a project you already have in mind?";
    }
    if (has('hour', 'open', 'time', 'when') ) {
      return `Our hours are ${state.hours}`;
    }
    if (has('where', 'location', 'area', 'liberia', 'monrovia', 'based')) {
      return "We're based in Monrovia and serve clients across Montserrado County, with project work available nationwide on request.";
    }
    if (has('human', 'agent', 'person', 'someone', 'representative', 'whatsapp')) {
      return "Of course — tap below and it'll open a WhatsApp chat directly with our team.";
    }
    if (has('thank', 'thanks')) {
      return "Anytime! Let me know if anything else comes up.";
    }

    return "I might not have that one exactly right — I'm just a quick-reply assistant, not able to go too deep. Want me to connect you with our team on WhatsApp, or point you to the quote form?";
  }

  function offerActionIfNeeded(raw) {
    const msg = raw.toLowerCase();
    if (msg.includes('quote') || msg.includes('price') || msg.includes('estimate') || msg.includes('cost')) {
      setTimeout(() => addLinkMessage('Open the quote form \u2192', 'quote.html'), 1700);
    }
    if (msg.includes('human') || msg.includes('agent') || msg.includes('whatsapp') || msg.includes('person') || msg.includes('emergency')) {
      setTimeout(() => addLinkMessage('Chat on WhatsApp \u2192', `https://wa.me/${state.whatsapp}`), 1700);
    }
  }

  function addLinkMessage(label, href) {
    const el = document.createElement('div');
    el.className = 'chat-msg bot';
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.style.color = 'inherit';
    a.style.textDecoration = 'underline';
    if (href.startsWith('http')) a.target = '_blank';
    el.appendChild(a);
    body.appendChild(el);
    scrollToBottom();
  }

  function handleUserMessage(text) {
    addMessage(text, 'user');
    quickWrap.innerHTML = '';
    const reply = respondTo(text);
    botReply(reply);
    offerActionIfNeeded(text);
  }

  launcher.addEventListener('click', () => {
    panel.classList.add('open');
    launcher.querySelector('.unread-dot')?.remove();
    if (!state.greeted) {
      state.greeted = true;
      setTimeout(() => {
        addMessage(state.greeting, 'bot');
        renderQuickReplies(currentQuickReplies());
      }, 500);
    }
    input.focus();
  });

  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  sendBtn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) return;
    input.value = '';
    handleUserMessage(val);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });

  // Expose a hook so main.js can push in CMS-edited settings once loaded
  window.LibCurrentChat = {
    applySettings(s) {
      if (s.assistantName) {
        state.name = s.assistantName;
        if (avatarLetter) avatarLetter.textContent = s.assistantName.charAt(0).toUpperCase();
      }
      if (s.assistantGreeting) state.greeting = s.assistantGreeting;
      if (s.phone) state.phone = s.phone;
      if (s.whatsapp) state.whatsapp = s.whatsapp;
      if (s.hours) state.hours = s.hours;
    }
  };
})();
