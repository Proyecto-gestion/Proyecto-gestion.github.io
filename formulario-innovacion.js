document.addEventListener('DOMContentLoaded', async () => {
  // Supabase
  const SUPABASE_URL = "https://uvhzeqemkmekgwhqczth.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aHplcWVta21la2d3aHFjenRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQ2MzUsImV4cCI6MjA3Njc2MDYzNX0.vJtoznHXAnuBZNABDI8gZARYgXgIVuL-Y6Ut8XL88z8";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // UI refs
  const projectTitle = document.getElementById('projectTitle');
  const projectAuthor = document.getElementById('projectAuthor');
  const projectDescription = document.getElementById('projectDescription');
  const projectIdEl = document.getElementById('projectId');
  const btnProyecto = document.getElementById('btnProyecto');
  const btnInforme  = document.getElementById('btnInforme');
  const formWrap    = document.getElementById('formWrap');

  // Get id from URL
  const projectId = new URLSearchParams(location.search).get('id');
  if (!projectId) { alert('No se ha proporcionado un ID de proyecto válido.'); return; }

  // Cargar proyecto base
  const { data: project, error } = await supabase
    .from('innovacion')
    .select('*')
    .eq('id', projectId)
    .single();
  if (error) { console.error(error); alert('Error al cargar el proyecto.'); return; }

  // Render info
  projectTitle.textContent = project.titulo || 'Sin título';
  projectAuthor.textContent = project.investigadores || '—';
  projectDescription.textContent = project.descripcion || '—';
  projectIdEl.textContent = project.id;

  // Botones
  btnProyecto.addEventListener('click', () => renderForm('proyecto', project));
  btnInforme .addEventListener('click', () => renderForm('informe', project));

  // ------- Helpers UI -------
  function secTpl(titulo, innerHtml, opened = false) {
    return `
      <div class="form-section">
        <button type="button" class="toggle-btn" aria-expanded="${opened ? 'true' : 'false'}">
          <span class="twisty">${opened ? '▾' : '▸'}</span> ${titulo}
        </button>
        <div class="form-content" style="display:${opened ? 'block' : 'none'}">
          ${innerHtml}
        </div>
      </div>
    `;
  }

  function attachToggles(scopeEl) {
    scopeEl.querySelectorAll('.form-section .toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const content = btn.nextElementSibling;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        const icon = btn.querySelector('.twisty');
        if (icon) icon.textContent = expanded ? '▸' : '▾';
        content.style.display = expanded ? 'none' : 'block';
      });
    });
  }

  // Radios Sí/No
  function yn(name, label) {
    return `
      <div class="field">
        <label>${label}</label>
        <div class="yn-group" style="display:flex;gap:12px;align-items:center">
          <label style="display:inline-flex;gap:6px;align-items:center">
            <input type="radio" name="${name}" value="si"> Sí
          </label>
          <label style="display:inline-flex;gap:6px;align-items:center">
            <input type="radio" name="${name}" value="no"> No
          </label>
        </div>
      </div>
    `;
  }

  // Cargar respuestas previas (tabla según tipo)
  async function loadRespuestas(table) {
    const { data, error } = await supabase
      .from(table)
      .select('respuestas')
      .eq('project_id', projectId)
      .maybeSingle();
    if (error) { console.error('Error al cargar respuestas:', error); return null; }
    return data?.respuestas || null;
  }

  // Aplicar respuestas a radios
  function applyRespuestas(json) {
    if (!json) return;
    Object.entries(json).forEach(([name, val]) => {
      const input = formWrap.querySelector(`input[name="${CSS.escape(name)}"][value="${CSS.escape(val)}"]`);
      if (input) input.checked = true;
    });
  }

  // Colectar radios → JSON
  function collectRespuestas() {
    const all = formWrap.querySelectorAll('input[type="radio"]');
    const out = {};
    all.forEach(r => {
      if (r.checked) out[r.name] = r.value; // "si" o "no"
      if (!(r.name in out)) out[r.name] = out[r.name] || null;
    });
    return out;
  }

  // Guardar (upsert) en tabla según tipo
  async function saveRespuestas(table, json) {
    const payload = {
      project_id: Number(projectId),
      respuestas: json,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from(table).upsert(payload, { onConflict: 'project_id' });
    if (error) { console.error('Error al guardar:', error); alert('No se pudo guardar.'); return false; }
    return true;
  }

  // ------- Render dinámico -------
  async function renderForm(type, p) {
    formWrap.hidden = false;

    if (type === 'proyecto') {
      // ===== PROYECTO (igual que lo tenías) =====
      const sI = `
        <div class="form-grid">
          ${yn('s11', '1.1. Título del proyecto')}
          ${yn('s12', '1.2. Investigador(es)')}
          ${yn('s13', '1.3. Programa(s) de estudios')}
          ${yn('s14', '1.4. Línea de investigación')}
          ${yn('s15d', '1.5. N° beneficiarios directos')}
          ${yn('s15i', '1.5. N° beneficiarios indirectos')}
          ${yn('s16', '1.6. Costo del proyecto')}
          ${yn('s17', '1.7. Lugar de ejecución')}
          ${yn('s18', '1.8. Fuente de financiamiento')}
          ${yn('s19', '1.9. Correo institucional del investigador')}
        </div>`;
      const sII = `
        <div class="form-grid">
          ${yn('s21', '2.1. Identificación del problema (incluye causas)')}
          ${yn('s22', '2.2. Formulación del problema (General - Específico)')}
          ${yn('s23', '2.3. Objetivos de la investigación (G.E.), verbo en infinitivo')}
          ${yn('s24', '2.4. Justificación social (necesidad u oportunidad a aprovechar)')}
          ${yn('s25', '2.5. Limitaciones de la investigación')}
        </div>`;
      const sIII = `
        <div class="form-grid">
          ${yn('s31', '3.1. Antecedentes del estudio')}
          ${yn('s32', '3.2. Bases teóricas')}
          ${yn('s33', '3.3. Definición de términos básicos')}
        </div>`;
      const sIV = `
        <div class="form-grid">
          ${yn('s41', '4.1. Tipo de investigación: Aplicada')}
          ${yn('s42', '4.2. Diseño de investigación: Experimental')}
          ${yn('s43', '4.3. Alcance de la investigación: Innovación tecnológica')}
          ${yn('s44', '4.4. Descripción de la innovación (en qué consistirá el producto)')}
        </div>`;
      const sV = `
        <div class="form-grid">
          ${yn('s51', '5.1. Identificación del segmento de los clientes')}
          ${yn('s52', '5.2. Demanda potencial del mercado encontrado')}
          ${yn('s53', '5.3. Canales de distribución')}
          ${yn('s54', '5.4. Contextualización y pertinencia del proyecto')}
        </div>`;
      const sVI = `
        <div class="form-grid">
          ${yn('s61', '6.1. Lugar y periodo de ejecución (inicio - fin)')}
          ${yn('s62', '6.2. Costos directos e indirectos')}
          ${yn('s63', '6.3. Indicadores de evaluación del proyecto')}
          ${yn('s64', '6.4. Cronograma de actividades')}
        </div>`;
      const sVII = `
        <div class="form-grid">
          ${yn('s71', 'VII. Referencias bibliográficas y webgrafía')}
        </div>`;

      formWrap.innerHTML = `
        <div class="card__body">
          <h3 class="card__title">PROYECTO DE INNOVACIÓN TECNOLÓGICA</h3>
          ${secTpl('I. DATOS GENERALES', sI, true)}
          ${secTpl('II. IDENTIFICACIÓN DE LA PROBLEMÁTICA', sII)}
          ${secTpl('III. MARCO REFERENCIAL', sIII)}
          ${secTpl('IV. METODOLOGÍA DEL PROYECTO', sIV)}
          ${secTpl('V. IDENTIFICACIÓN DEL MERCADO OBJETIVO', sV)}
          ${secTpl('VI. ADMINISTRACIÓN DEL PROYECTO', sVI)}
          ${secTpl('VII. REFERENCIAS BIBLIOGRÁFICAS Y WEBGRAFÍA', sVII)}
          <div class="form-actions">
            <button id="btnSaveProyecto" class="btn">Guardar borrador</button>
            <button class="btn" onclick="history.back()">Cancelar</button>
          </div>
        </div>`;
      attachToggles(formWrap);

      const prev = await loadRespuestas('innovacion_form_proyecto');
      applyRespuestas(prev);
      document.getElementById('btnSaveProyecto').addEventListener('click', async () => {
        const respuestas = collectRespuestas();
        const ok = await saveRespuestas('innovacion_form_proyecto', respuestas);
        if (ok) alert('Guardado correctamente.');
      });

    } else {
      // ===== INFORME FINAL: secciones + Sí/No =====
      // I. CARÁTULA
      const if_I = `
        <div class="form-grid">
          ${yn('if_i1',  '1.1. Página de respecto')}
          ${yn('if_i2',  '1.2. Resolución Directoral de aprobación del proyecto')}
          ${yn('if_i3',  '1.3. Dedicatoria')}
          ${yn('if_i4',  '1.4. Agradecimiento')}
          ${yn('if_i5',  '1.5. Tabla de contenidos (índice)')}
          ${yn('if_i6',  '1.6. Introducción')}
          ${yn('if_i7',  '1.7. Resumen')}
        </div>`;

      // II. IDENTIFICACIÓN DE LA PROBLEMÁTICA
      const if_II = `
        <div class="form-grid">
          ${yn('if_ii11', '2.1. Identificación del problema (causas)')}
          ${yn('if_ii12', '2.2. Formulación del problema (G.E.)')}
          ${yn('if_ii13', '2.3. Objetivos de la Investigación (G.E.), verbo en infinitivo')}
          ${yn('if_ii14', '2.4. Justificación social (necesidad u oportunidad a aprovechar)')}
          ${yn('if_ii15', '2.5. Limitaciones de la investigación')}
        </div>`;

      // III. MARCO REFERENCIAL
      const if_III = `
        <div class="form-grid">
          ${yn('if_iii21', '3.1. Antecedentes del estudio')}
          ${yn('if_iii22', '3.2. Bases teóricas')}
          ${yn('if_iii23', '3.3. Definición de términos básicos')}
        </div>`;

      // IV. METODOLOGÍA DEL PROYECTO
      const if_IV = `
        <div class="form-grid">
          ${yn('if_iv31', '4.1. Tipo de investigación')}
          ${yn('if_iv32', '4.2. Diseño de investigación')}
          ${yn('if_iv33', '4.3. Alcance de la investigación')}
          ${yn('if_iv34', '4.4. Descripción de la innovación')}
        </div>`;

      // V. IDENTIFICACIÓN DEL MERCADO OBJETIVO
      const if_V = `
        <div class="form-grid">
          ${yn('if_v41', '5.1. Segmentos de clientes')}
          ${yn('if_v42', '5.2. Demanda potencial del mercado encontrado')}
          ${yn('if_v43', '5.3. Canales de distribución utilizados')}
          ${yn('if_v44', '5.4. Contextualización y pertinencia del proyecto')}
        </div>`;

      // VI. ADMINISTRACIÓN DEL PROYECTO
      const if_VI = `
        <div class="form-grid">
          ${yn('if_vi51', '6.1. Costos directos e indirectos')}
          ${yn('if_vi52', '6.2. Tasa Interna de Retorno (TIR)')}
          ${yn('if_vi53', '6.3. Valor Presente Neto (VPN)')}
          ${yn('if_vi54', '6.4. Relación Costo/Beneficio')}
        </div>`;

      // VII. CONCLUSIONES Y RECOMENDACIONES
      const if_VII = `
        <div class="form-grid">
          ${yn('if_vii1', 'Conclusiones y recomendaciones')}
        </div>`;

      // VIII. REFERENCIAS BIBLIOGRÁFICAS-APA
      const if_VIII = `
        <div class="form-grid">
          ${yn('if_viii1', 'Referencias bibliográficas - APA')}
        </div>`;

      // ANEXOS
      const if_ANEXOS = `
        <div class="form-grid">
          ${yn('if_ax1', 'Costo total de ejecución')}
          ${yn('if_ax2', 'Beneficiarios (directos e indirectos)')}
          ${yn('if_ax3', 'Fuente de financiamiento')}
          ${yn('if_ax4', 'Lugar de ejecución del proyecto')}
          ${yn('if_ax5', 'Declaración jurada de autoría del Proyecto')}
        </div>`;

      formWrap.innerHTML = `
        <div class="card__body">
          <h3 class="card__title">INFORME FINAL DE INNOVACIÓN TECNOLÓGICA</h3>
          ${secTpl('I. CARÁTULA', if_I, true)}
          ${secTpl('II. IDENTIFICACIÓN DE LA PROBLEMÁTICA', if_II)}
          ${secTpl('III. MARCO REFERENCIAL', if_III)}
          ${secTpl('IV. METODOLOGÍA DEL PROYECTO', if_IV)}
          ${secTpl('V. IDENTIFICACIÓN DEL MERCADO OBJETIVO', if_V)}
          ${secTpl('VI. ADMINISTRACIÓN DEL PROYECTO', if_VI)}
          ${secTpl('VII. CONCLUSIONES Y RECOMENDACIONES', if_VII)}
          ${secTpl('VIII. REFERENCIAS BIBLIOGRÁFICAS - APA', if_VIII)}
          ${secTpl('ANEXOS', if_ANEXOS)}
          <div class="form-actions">
            <button id="btnSaveInforme" class="btn">Guardar borrador</button>
            <button class="btn" onclick="history.back()">Cancelar</button>
          </div>
        </div>`;
      attachToggles(formWrap);

      // Cargar respuestas previas y aplicar
      const prevIF = await loadRespuestas('innovacion_form_informe');
      applyRespuestas(prevIF);

      // Guardar
      document.getElementById('btnSaveInforme').addEventListener('click', async () => {
        const respuestas = collectRespuestas();
        const ok = await saveRespuestas('innovacion_form_informe', respuestas);
        if (ok) alert('Guardado correctamente.');
      });
    }

    // Scroll suave
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Utilidad anti-XSS
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[s]);
}
