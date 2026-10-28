const storageKey = 'clara-clientes';
const storedClients = JSON.parse(localStorage.getItem(storageKey) || 'null');
const demoCedulas = new Set(['1001001001', '1001001002', '1001001003', '1001001004']);
let clients = Array.isArray(storedClients)
  ? storedClients.filter((client) => !demoCedulas.has(String(client.cedula || '')))
  : [];
if (Array.isArray(storedClients) && clients.length !== storedClients.length) {
  localStorage.setItem(storageKey, JSON.stringify(clients));
}
const table = document.querySelector('#clientTable');
const emptyState = document.querySelector('#emptyState');
const searchInput = document.querySelector('#searchInput');
const statusFilter = document.querySelector('#statusFilter');
const modal = document.querySelector('#clientModal');
const form = document.querySelector('#clientForm');
const consentModal = document.querySelector('#consentModal');
const consentForm = document.querySelector('#consentForm');
const consentClientSelect = document.querySelector('#consentClientSelect');
const signatureCanvas = document.querySelector('#signatureCanvas');
const signatureData = document.querySelector('#signatureData');
const signatureContext = signatureCanvas.getContext('2d');
let isDrawingSignature = false;
const isPublicFlow = window.location.hash === '#clienta';
const publicFlow = document.querySelector('#publicFlow');
const publicLookup = document.querySelector('#publicLookup');
const publicResult = document.querySelector('#publicResult');
const clinicalForm = document.querySelector('#clinicalForm');
let publicRequest = {};
const consentCopy = {
  procedure: ['Consentimiento para el procedimiento', 'Autorizo la realización del procedimiento después de recibir información clara sobre sus objetivos, beneficios, riesgos, alternativas y cuidados posteriores.'],
  data: ['Autorización de tratamiento de datos', 'Autorizo el tratamiento de mis datos personales para la gestión de mi historia, citas y atención, de acuerdo con la normativa vigente.'],
  images: ['Autorización de uso de imágenes', 'Autorizo de manera opcional el uso de fotografías del resultado con fines informativos y profesionales.']
};
let selectedConsentType = '';

function formatDate(value) {
  if (!value) return 'Sin cita registrada';
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function initials(name) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function avatarClass(index) {
  return ['','mint','gold'][index % 3];
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const filtered = clients.filter((client) => {
    const matchesText = `${client.name} ${client.email} ${client.phone}`.toLowerCase().includes(query);
    return matchesText && (status === 'all' || client.status === status);
  });

  table.innerHTML = filtered.map((client, index) => `<tr>
    <td><div class="client-cell"><span class="client-avatar ${avatarClass(index)}">${initials(client.name)}</span><span>${client.name}<small class="client-sub">${client.note || 'Cliente'}</small></span></div></td>
    <td>${client.cedula || 'Sin registrar'}</td>
    <td>${client.phone}<small class="client-sub">${client.email || 'Sin correo'}</small></td>
    <td>${formatDate(client.appointment)}</td>
    <td><button class="consent ${client.consent === 'Firmado' ? 'signed' : 'pending'} consent-open" data-consent-client="${client.id}">${client.consent === 'Firmado' ? 'Ver firmado' : 'Diligenciar'}</button></td>
    <td><span class="status ${client.status === 'Activo' ? 'active' : 'inactive'}">${client.status}</span></td>
    <td><button class="row-menu" data-id="${client.id}" aria-label="Eliminar cliente">•••</button></td>
  </tr>`).join('');

  emptyState.hidden = filtered.length !== 0;
  document.querySelector('#totalClients').textContent = clients.length;
  document.querySelector('#navClientCount').textContent = clients.length;
  document.querySelector('#clientSummary').textContent = `${clients.length} ${clients.length === 1 ? 'registro guardado' : 'registros guardados'}`;
  document.querySelector('#tableCount').textContent = `Mostrando ${filtered.length} ${filtered.length === 1 ? 'cliente' : 'clientes'}`;
  const active = clients.filter((client) => client.status === 'Activo').length;
  document.querySelector('#activeClients').textContent = `${clients.length ? Math.round((active / clients.length) * 100) : 0}%`;
  document.querySelector('#activeProgress').style.width = `${clients.length ? (active / clients.length) * 100 : 0}%`;
  document.querySelector('#pendingConsents').textContent = clients.filter((client) => client.consent === 'Pendiente').length;
  document.querySelector('#upcomingAppointments').textContent = clients.filter((client) => client.appointment).length;
  consentClientSelect.innerHTML = clients.length
    ? clients.map((client) => `<option value="${client.id}">${client.name} — ${client.consent}</option>`).join('')
    : '<option value="">No hay clientas registradas</option>';
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(clients));
  render();
}

document.querySelector('#openClientModal').addEventListener('click', () => modal.showModal());
document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => document.querySelector(`#${button.dataset.closeDialog}`).close());
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  clients.unshift({ id: Date.now(), name: data.get('name'), cedula: data.get('cedula'), phone: data.get('phone'), email: data.get('email'), appointment: data.get('appointment'), note: data.get('note'), consent: 'Pendiente', status: 'Activo' });
  save();
  form.reset();
  modal.close();
});
searchInput.addEventListener('input', render);
statusFilter.addEventListener('change', render);
table.addEventListener('click', (event) => {
  const consentButton = event.target.closest('[data-consent-client]');
  if (consentButton) {
    consentClientSelect.value = consentButton.dataset.consentClient;
    document.querySelector('#consentimientos').scrollIntoView({ behavior: 'smooth' });
    openConsent('procedure');
    return;
  }
  const button = event.target.closest('[data-id]');
  if (!button) return;
  clients = clients.filter((client) => client.id !== Number(button.dataset.id));
  save();
});
document.querySelectorAll('.consent-action').forEach((button) => {
  button.addEventListener('click', () => openConsent(button.dataset.consentType));
});
function openConsent(type) {
  if (!consentClientSelect.value) return;
  selectedConsentType = type;
  const [title, text] = consentCopy[type];
  document.querySelector('#consentModalTitle').textContent = title;
  document.querySelector('#consentModalText').textContent = text;
  consentForm.reset();
  clearSignature();
  consentForm.elements.signedDate.value = new Date().toISOString().slice(0, 10);
  consentModal.showModal();
}
function getSignaturePoint(event) {
  const bounds = signatureCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * (signatureCanvas.width / bounds.width),
    y: (event.clientY - bounds.top) * (signatureCanvas.height / bounds.height)
  };
}
function startSignature(event) {
  event.preventDefault();
  isDrawingSignature = true;
  const point = getSignaturePoint(event);
  signatureContext.beginPath();
  signatureContext.moveTo(point.x, point.y);
  signatureContext.lineWidth = 3;
  signatureContext.lineCap = 'round';
  signatureContext.lineJoin = 'round';
  signatureContext.strokeStyle = '#24313b';
  signatureCanvas.setPointerCapture(event.pointerId);
}
function drawSignature(event) {
  if (!isDrawingSignature) return;
  event.preventDefault();
  const point = getSignaturePoint(event);
  signatureContext.lineTo(point.x, point.y);
  signatureContext.stroke();
  signatureData.value = signatureCanvas.toDataURL('image/png');
}
function endSignature(event) {
  if (!isDrawingSignature) return;
  isDrawingSignature = false;
  if (signatureCanvas.hasPointerCapture(event.pointerId)) signatureCanvas.releasePointerCapture(event.pointerId);
}
function clearSignature() {
  signatureContext.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  signatureData.value = '';
}
signatureCanvas.addEventListener('pointerdown', startSignature);
signatureCanvas.addEventListener('pointermove', drawSignature);
signatureCanvas.addEventListener('pointerup', endSignature);
signatureCanvas.addEventListener('pointercancel', endSignature);
document.querySelector('#clearSignature').addEventListener('click', clearSignature);
consentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const client = clients.find((item) => item.id === Number(consentClientSelect.value));
  if (!client || !selectedConsentType) return;
  const data = new FormData(consentForm);
  if (!signatureData.value) {
    event.preventDefault();
    signatureCanvas.focus();
    return;
  }
  client.consent = 'Firmado';
  client.consentDetails = { type: selectedConsentType, signature: data.get('signature'), signatureImage: data.get('signatureData'), signedDate: data.get('signedDate') };
  save();
  consentModal.close();
});
render();

function setupPublicFlow() {
  document.querySelector('.app-shell').hidden = true;
  publicFlow.hidden = false;
  document.querySelector('#lookupForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    publicRequest = { service: data.get('service'), cedula: String(data.get('cedula')).replace(/\D/g, '') };
    const existing = clients.find((client) => String(client.cedula || '') === publicRequest.cedula);
    publicLookup.hidden = true;
    publicResult.hidden = false;
    document.querySelector('#publicResultTitle').textContent = existing ? `Hola, ${existing.name}` : 'No encontramos tu ficha clínica';
    document.querySelector('#publicResultText').textContent = existing ? `Tu ficha ya está registrada para ${publicRequest.service}. Puedes continuar con el diligenciamiento de tus consentimientos.` : `Para ${publicRequest.service} necesitamos crear tu ficha clínica antes de continuar.`;
    document.querySelector('#createClinicalFile').hidden = Boolean(existing);
  });
  document.querySelector('#createClinicalFile').addEventListener('click', () => {
    publicResult.hidden = true;
    clinicalForm.hidden = false;
    clinicalForm.elements.service.value = publicRequest.service;
    clinicalForm.elements.cedula.value = publicRequest.cedula;
  });
  clinicalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(clinicalForm);
    clients.unshift({ id: Date.now(), name: data.get('name'), cedula: data.get('cedula'), phone: data.get('phone'), email: data.get('email'), note: `${data.get('service')} | Alergias: ${data.get('allergies') || 'Ninguna'}`, medicalHistory: data.get('medicalHistory'), medications: data.get('medications'), consent: 'Pendiente', status: 'Activo' });
    save();
    clinicalForm.hidden = true;
    publicResult.hidden = false;
    document.querySelector('#publicResultTitle').textContent = 'Ficha clínica guardada';
    document.querySelector('#publicResultText').textContent = 'Gracias. Tu información fue registrada correctamente.';
  });
}

function setupQr() {
  if (!window.QRCode) return;
  const publishedSiteUrl = 'https://reyleolol2020.github.io/Consentimientos/';
  const publicUrlInput = document.querySelector('#publicUrlInput');
  const qrWarning = document.querySelector('#qrWarning');
  const qrCode = document.querySelector('#qrCode');
  const downloadQr = document.querySelector('#downloadQr');
  const currentUrl = window.location.href.split('#')[0];
  publicUrlInput.value = /^https?:$/.test(window.location.protocol) ? currentUrl : publishedSiteUrl;
  function generateQr() {
    const baseUrl = publicUrlInput.value.trim().replace(/#.*$/, '');
    qrCode.innerHTML = '';
    downloadQr.disabled = true;
    if (!/^https?:\/\/.+/i.test(baseUrl)) {
      qrWarning.textContent = 'Primero publica la página y pega aquí una URL que empiece por https://.';
      document.querySelector('#qrUrl').textContent = 'Sin URL pública';
      return;
    }
    const publicUrl = `${baseUrl.replace(/\/?$/, '/')}#clienta`;
    new QRCode(qrCode, { text: publicUrl, width: 150, height: 150, colorDark: '#24313b', colorLight: '#ffffff' });
    document.querySelector('#qrUrl').textContent = publicUrl;
    qrWarning.textContent = 'Escanea este código desde otro celular para probarlo.';
    downloadQr.disabled = false;
    downloadQr.dataset.qrReady = 'true';
  }
  document.querySelector('#generateQr').addEventListener('click', generateQr);
  if (/^https?:$/.test(window.location.protocol)) generateQr();
  else qrWarning.textContent = 'Usando la URL pública publicada en GitHub Pages.';
  downloadQr.addEventListener('click', () => {
    if (downloadQr.dataset.qrReady !== 'true') return;
    const canvas = document.querySelector('#qrCode canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'codigo-qr-ficha-clinica.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

if (isPublicFlow) setupPublicFlow();
else setupQr();
