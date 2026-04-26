// ===========================
// ⚙️ CONFIGURATION WEBHOOKS
// Modifiez uniquement ces 3 URLs
// ===========================

const WEBHOOKS = {
  rapport:        'https://discord.com/api/webhooks/1497917202324783134/lx7gFzTe5VsKN5N3YYAFRd9qfdXshp92fEDlWM3ESPmNhSqcdPJ5k3BJfJ5a2XyBIhYN',
  plainte:        'https://discord.com/api/webhooks/1497918264691527930/ZWRFVMoHwUBk_xuMtuRvRr8pEGdmBB-StNmt81CBlKZmta_Tu-KwDqLvX_l_4EzImUI_',
  interrogatoire: 'https://discord.com/api/webhooks/1497920904808628346/hNaQgrLfYCtWo-6wVi8GEOvHTfWE746LpZoxK1ZtkQsWzmUcOpKEAQwpt0OBDIyMfkRS',
};

// ===========================
// INIT
// ===========================

let currentTab = 'rapport';
let currentPreviewType = null;
let questionCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initRapportNum();
  initNav();
  setDefaultDates();
  addQuestion(); // ajouter une question par défaut
});

// ===========================
// DATE & NUMÉRO
// ===========================

function initDate() {
  const el = document.getElementById('live-date');
  function update() {
    const now = new Date();
    el.textContent = now.toLocaleString('fr-FR', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).toUpperCase();
  }
  update();
  setInterval(update, 1000);
}

function initRapportNum() {
  const num = Math.floor(Math.random() * 9000) + 1000;
  document.getElementById('rnum').textContent = num;
}

function setDefaultDates() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
  ['r-date', 'p-date', 'i-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = local;
  });
  const today = now.toISOString().split('T')[0];
  const sig = document.getElementById('p-date-signature');
  if (sig) sig.value = today;
}

// ===========================
// NAVIGATION
// ===========================

function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;

  // Boutons
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });

  // Contenu
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.id === `tab-${tab}`);
  });

  // Scroll top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===========================
// WEBHOOKS
// ===========================

function getWebhookUrl(type) {
  return WEBHOOKS[type] || '';
}


// ===========================
// QUESTIONS DYNAMIQUES
// ===========================

function addQuestion() {
  questionCount++;
  const container = document.getElementById('questions-container');
  if (!container) return;

  const block = document.createElement('div');
  block.className = 'qa-block';
  block.dataset.qid = questionCount;

  block.innerHTML = `
    <button class="remove-btn" onclick="removeQuestion(this)">✕ Supprimer</button>
    <div class="field-group">
      <label>Question ${questionCount}</label>
      <input type="text" class="qa-question" placeholder="Ex : Étiez-vous présent sur les lieux à 21h ?" />
    </div>
    <div class="field-group">
      <label>Réponse du suspect</label>
      <textarea class="qa-answer" rows="3" placeholder="Réponse exacte du suspect..."></textarea>
    </div>
  `;
  container.appendChild(block);
}

function removeQuestion(btn) {
  const block = btn.closest('.qa-block');
  if (document.querySelectorAll('.qa-block').length > 1) {
    block.remove();
  } else {
    showToast('error', '⚠️ Minimum une question requise');
  }
}

// ===========================
// COLLECTE DES DONNÉES
// ===========================

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function getChecked(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.value);
}

function formatDateTime(dtStr) {
  if (!dtStr) return 'Non renseigné';
  const d = new Date(dtStr);
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getQA() {
  const blocks = document.querySelectorAll('.qa-block');
  const qa = [];
  blocks.forEach((block, i) => {
    const q = block.querySelector('.qa-question')?.value.trim();
    const a = block.querySelector('.qa-answer')?.value.trim();
    if (q || a) {
      qa.push({ num: i + 1, q: q || '—', a: a || '—' });
    }
  });
  return qa;
}

// ===========================
// BUILD MESSAGES DISCORD
// ===========================

function buildRapportEmbed() {
  const infractions = getChecked('r-infractions');
  const infAutres = val('r-infractions-autres');
  const allInfractions = infAutres ? [...infractions, infAutres] : infractions;

  const mesures = getChecked('r-mesures');

  const rapportNum = document.getElementById('rnum').textContent;

  return {
    username: '🚔 Commissariat RP',
    avatar_url: 'https://i.imgur.com/AfFp7pu.png',
    embeds: [{
      title: `📝 RAPPORT DE POLICE — #${rapportNum}`,
      color: 0xc8a84b,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '📋 EN-TÊTE',
          value: [
            `**Service :** ${val('r-service') || '—'}`,
            `**Agent :** ${val('r-agent') || '—'}`,
            `**Date / Heure :** ${formatDateTime(val('r-date'))}`,
            `**Lieu :** ${val('r-lieu') || '—'}`
          ].join('\n'),
          inline: false
        },
        {
          name: '👮 AGENTS PRÉSENTS',
          value: val('r-agents') || '—',
          inline: false
        },
        {
          name: '🔴 SUSPECTS',
          value: val('r-suspects') || '—',
          inline: true
        },
        {
          name: '🟡 VICTIMES',
          value: val('r-victimes') || '—',
          inline: true
        },
        {
          name: '🟢 TÉMOINS',
          value: val('r-temoins') || '—',
          inline: true
        },
        {
          name: '📍 MOTIF D\'INTERVENTION',
          value: `**Type :** ${val('r-motif-type') || '—'}\n${val('r-motif-detail') || '—'}`,
          inline: false
        },
        {
          name: '📖 DÉROULEMENT DES FAITS',
          value: [
            `**À l'arrivée :**\n${val('r-arrivee') || '—'}`,
            `**Actions suspects :**\n${val('r-actions-suspects') || '—'}`,
            `**Actions policiers :**\n${val('r-actions-policiers') || '—'}`,
            `**Poursuites / Interpellations :**\n${val('r-poursuite') || '—'}`
          ].join('\n\n'),
          inline: false
        },
        {
          name: '⚖️ INFRACTIONS CONSTATÉES',
          value: allInfractions.length > 0
            ? allInfractions.map(i => `• ${i}`).join('\n')
            : '— Aucune infraction renseignée',
          inline: true
        },
        {
          name: '🔒 MESURES PRISES',
          value: mesures.length > 0
            ? mesures.map(m => `• ${m}`).join('\n') + (val('r-mesures-detail') ? `\n\n${val('r-mesures-detail')}` : '')
            : '— Aucune mesure renseignée',
          inline: true
        },
        {
          name: '📦 ÉLÉMENTS DE PREUVE',
          value: [
            val('r-temoignages') ? `**Témoignages :** ${val('r-temoignages')}` : '',
            val('r-objets') ? `**Objets / Preuves :** ${val('r-objets')}` : ''
          ].filter(Boolean).join('\n') || '—',
          inline: false
        },
        {
          name: '✍️ CONCLUSION',
          value: [
            val('r-resume') ? `**Résumé :** ${val('r-resume')}` : '',
            `**Situation finale :** ${val('r-situation') || '—'}`,
            val('r-remarques') ? `**Remarques :** ${val('r-remarques')}` : ''
          ].filter(Boolean).join('\n'),
          inline: false
        }
      ],
      footer: {
        text: `Commissariat RP • Rapport #${rapportNum} • Document Officiel`
      }
    }]
  };
}

function buildPlainteEmbed() {
  const rapportNum = document.getElementById('rnum').textContent;
  const ddn = val('p-ddn');

  return {
    username: '📋 Commissariat RP — Plaintes',
    embeds: [{
      title: `📋 DÉPÔT DE PLAINTE — #${rapportNum}`,
      color: 0x4a8fd4,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '👤 INFORMATIONS DU PLAIGNANT',
          value: [
            `**Nom / Prénom :** ${val('p-nom') || '—'}`,
            ddn ? `**Date de naissance :** ${new Date(ddn).toLocaleDateString('fr-FR')}` : '',
            val('p-contact') ? `**Contact RP :** ${val('p-contact')}` : '',
            val('p-agent-recevant') ? `**Agent recevant :** ${val('p-agent-recevant')}` : ''
          ].filter(Boolean).join('\n'),
          inline: false
        },
        {
          name: '📍 LIEU ET DATE DES FAITS',
          value: [
            `**Lieu :** ${val('p-lieu') || '—'}`,
            `**Date / Heure :** ${formatDateTime(val('p-date'))}`
          ].join('\n'),
          inline: false
        },
        {
          name: '📖 DESCRIPTION DES FAITS',
          value: [
            val('p-avant') ? `**Avant les faits :**\n${val('p-avant')}` : '',
            `**Ce qui s'est passé :**\n${val('p-vu') || '—'}`,
            val('p-suspect-action') ? `**Actions du suspect :**\n${val('p-suspect-action')}` : '',
            val('p-fin') ? `**Comment ça s'est terminé :**\n${val('p-fin')}` : ''
          ].filter(Boolean).join('\n\n'),
          inline: false
        },
        {
          name: '🧍 DESCRIPTION DU SUSPECT',
          value: [
            `**Identité :** ${val('p-suspect-nom') || 'Inconnu'}`,
            val('p-suspect-vehicule') ? `**Véhicule :** ${val('p-suspect-vehicule')}` : '',
            val('p-suspect-description') ? `**Apparence :** ${val('p-suspect-description')}` : ''
          ].filter(Boolean).join('\n') || '— Non renseigné',
          inline: false
        },
        {
          name: '📦 PRÉJUDICE',
          value: [
            val('p-vole') ? `**Objets volés :** ${val('p-vole')}` : '',
            val('p-blessures') ? `**Blessures :** ${val('p-blessures')}` : '',
            val('p-degats') ? `**Dégâts matériels :** ${val('p-degats')}` : ''
          ].filter(Boolean).join('\n') || '— Non renseigné',
          inline: false
        },
        {
          name: '✍️ SIGNATURE',
          value: [
            `**Plaignant :** ${val('p-signature') || '—'}`,
            val('p-date-signature') ? `**Date :** ${new Date(val('p-date-signature')).toLocaleDateString('fr-FR')}` : '',
            val('p-remarques') ? `**Observations de l'agent :** ${val('p-remarques')}` : ''
          ].filter(Boolean).join('\n'),
          inline: false
        }
      ],
      footer: { text: `Commissariat RP • Dépôt de Plainte #${rapportNum}` }
    }]
  };
}

function buildInterrogatoireEmbed() {
  const qa = getQA();
  const rapportNum = document.getElementById('rnum').textContent;

  const qaText = qa.length > 0
    ? qa.map(q => `**Q${q.num} :** ${q.q}\n**R :** ${q.a}`).join('\n\n')
    : '— Aucune question renseignée';

  return {
    username: '🎙️ Commissariat RP — Interrogatoires',
    embeds: [{
      title: `🎙️ PROCÈS-VERBAL D'INTERROGATOIRE — #${rapportNum}`,
      color: 0xd94444,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '👮 INFORMATIONS DE BASE',
          value: [
            `**Agent :** ${val('i-agent') || '—'} — ${val('i-grade') || '—'}`,
            `**Suspect :** ${val('i-suspect') || '—'}`,
            `**Date / Heure :** ${formatDateTime(val('i-date'))}`,
            `**Lieu :** ${val('i-lieu') || 'Commissariat'}`
          ].join('\n'),
          inline: false
        },
        {
          name: '⚖️ DROITS',
          value: val('i-droits-acceptes') || '—',
          inline: false
        },
        {
          name: '❓ QUESTIONS GÉNÉRALES',
          value: [
            `**Identité déclarée :** ${val('i-identite') || '—'}`,
            val('i-avant-faits') ? `**Localisation avant les faits :** ${val('i-avant-faits')}` : '',
            val('i-activite') ? `**Activité déclarée :** ${val('i-activite')}` : ''
          ].filter(Boolean).join('\n'),
          inline: false
        },
        {
          name: '🔍 QUESTIONS SUR LES FAITS',
          value: qaText,
          inline: false
        },
        {
          name: '🧠 CONFRONTATION AUX PREUVES',
          value: [
            val('i-preuves-montrees') ? `**Preuves présentées :**\n${val('i-preuves-montrees')}` : '',
            val('i-incoherences') ? `**Incohérences :**\n${val('i-incoherences')}` : '',
            val('i-reaction-preuves') ? `**Réaction du suspect :**\n${val('i-reaction-preuves')}` : ''
          ].filter(Boolean).join('\n\n') || '—',
          inline: false
        },
        {
          name: '✍️ DÉCLARATION DU SUSPECT',
          value: val('i-declaration') || '— Aucune déclaration',
          inline: false
        },
        {
          name: '🔒 CONCLUSION',
          value: [
            val('i-resume') ? `**Résumé :** ${val('i-resume')}` : '',
            `**Décision :** ${val('i-decision') || '—'}`,
            val('i-remarques') ? `**Observations :** ${val('i-remarques')}` : ''
          ].filter(Boolean).join('\n'),
          inline: false
        }
      ],
      footer: { text: `Commissariat RP • Interrogatoire #${rapportNum}` }
    }]
  };
}

function buildPayload(type) {
  if (type === 'rapport') return buildRapportEmbed();
  if (type === 'plainte') return buildPlainteEmbed();
  if (type === 'interrogatoire') return buildInterrogatoireEmbed();
}

// ===========================
// VALIDATION
// ===========================

function validateForm(type) {
  const requiredMap = {
    rapport: [
      { id: 'r-service', label: 'Service' },
      { id: 'r-agent', label: 'Nom / Grade agent' },
      { id: 'r-date', label: 'Date & Heure' },
      { id: 'r-lieu', label: 'Lieu' },
      { id: 'r-motif-type', label: 'Type d\'intervention' },
      { id: 'r-motif-detail', label: 'Détail du motif' },
      { id: 'r-situation', label: 'Situation finale' },
    ],
    plainte: [
      { id: 'p-nom', label: 'Nom du plaignant' },
      { id: 'p-lieu', label: 'Lieu des faits' },
      { id: 'p-date', label: 'Date des faits' },
      { id: 'p-vu', label: 'Description des faits' },
      { id: 'p-signature', label: 'Signature' },
    ],
    interrogatoire: [
      { id: 'i-agent', label: 'Nom de l\'agent' },
      { id: 'i-grade', label: 'Grade' },
      { id: 'i-suspect', label: 'Nom du suspect' },
      { id: 'i-date', label: 'Date & Heure' },
      { id: 'i-droits-acceptes', label: 'Réponse aux droits' },
      { id: 'i-decision', label: 'Décision finale' },
    ]
  };

  const fields = requiredMap[type] || [];
  for (const field of fields) {
    const el = document.getElementById(field.id);
    if (!el || !el.value.trim()) {
      showToast('error', `⚠️ Champ requis : « ${field.label} »`);
      el?.focus();
      return false;
    }
  }

  const webhookUrl = getWebhookUrl(type);
  if (!webhookUrl || webhookUrl.includes('VOTRE_WEBHOOK')) {
    showToast('error', '⚠️ Configurez le webhook dans script.js');
    return false;
  }

  return true;
}

// ===========================
// PREVIEW
// ===========================

function previewForm(type) {
  currentPreviewType = type;

  const titles = {
    rapport: '📝 Prévisualisation — Rapport de Police',
    plainte: '📋 Prévisualisation — Dépôt de Plainte',
    interrogatoire: '🎙️ Prévisualisation — Interrogatoire'
  };

  document.getElementById('modalTitle').textContent = titles[type];

  const payload = buildPayload(type);
  const embed = payload.embeds[0];

  let preview = `${embed.title}\n${'─'.repeat(50)}\n\n`;
  embed.fields.forEach(f => {
    preview += `【 ${f.name} 】\n${f.value}\n\n`;
  });
  preview += `─\n${embed.footer.text}\n${new Date().toLocaleString('fr-FR')}`;

  document.getElementById('previewContent').textContent = preview;

  document.getElementById('modalSendBtn').onclick = () => {
    closeModal();
    sendForm(type);
  };

  document.getElementById('previewModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('previewModal').classList.add('hidden');
}

// ===========================
// SEND
// ===========================

async function sendForm(type) {
  if (!validateForm(type)) return;


  const webhookUrl = getWebhookUrl(type);
  const payload = buildPayload(type);

  const sendBtn = document.querySelector(`#tab-${type} .btn-primary`);
  const originalText = sendBtn?.innerHTML;
  if (sendBtn) {
    sendBtn.innerHTML = '⏳ Envoi en cours...';
    sendBtn.disabled = true;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 204) {
      showToast('success', '✅ Rapport envoyé sur Discord !');
      initRapportNum();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast('error', `❌ Erreur Discord : ${err.message || res.status}`);
    }
  } catch (e) {
    showToast('error', '❌ Erreur réseau. Vérifiez l\'URL du webhook.');
    console.error(e);
  } finally {
    if (sendBtn) {
      sendBtn.innerHTML = originalText;
      sendBtn.disabled = false;
    }
  }
}

// ===========================
// RESET
// ===========================

function resetForm(type) {
  if (!confirm(`Réinitialiser le formulaire "${type}" ? Toutes les données seront perdues.`)) return;

  const prefix = type === 'rapport' ? 'r-' : type === 'plainte' ? 'p-' : 'i-';
  const container = document.getElementById(`tab-${type}`);

  container.querySelectorAll('input[type="text"], input[type="url"], input[type="date"], input[type="datetime-local"]')
    .forEach(el => { if (!el.id?.startsWith('webhook')) el.value = ''; });

  container.querySelectorAll('textarea').forEach(el => el.value = '');
  container.querySelectorAll('select').forEach(el => el.value = '');
  container.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);

  if (type === 'interrogatoire') {
    const qc = document.getElementById('questions-container');
    if (qc) { qc.innerHTML = ''; questionCount = 0; addQuestion(); }
  }

  setDefaultDates();
  showToast('success', '🗑️ Formulaire réinitialisé');
}

// ===========================
// TOAST
// ===========================

function showToast(type, msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMsg');

  toast.className = `toast ${type}`;
  msgEl.textContent = msg;

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}
