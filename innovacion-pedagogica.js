document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('empty');
  const countEl = document.getElementById('listCount');
  const successBar = document.getElementById('successBar');

  const q = document.getElementById('q');
  const clearBtn = document.getElementById('clearBtn');
  const filterBtn = document.getElementById('filterBtn');
  const fab = document.getElementById('fab'); // Este es el botón de "Nuevo Proyecto"

  // Conexión con Supabase
  const SUPABASE_URL = "https://uvhzeqemkmekgwhqczth.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2aHplcWVta21la2d3aHFjenRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODQ2MzUsImV4cCI6MjA3Njc2MDYzNX0.vJtoznHXAnuBZNABDI8gZARYgXgIVuL-Y6Ut8XL88z8";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Obtener los proyectos de la tabla 'innovacion_pedagogica'
  const { data: projects, error } = await supabase
    .from('innovacion_pedagogica')  // Usar la tabla innovacion_pedagogica
    .select('*');

  if (error) {
    console.error('Error al obtener proyectos:', error);
    alert('Hubo un error al cargar los proyectos.');
    return;
  }

  // --- Render principal ---
  function render(items) {
    listEl.innerHTML = '';
    if (!items.length) {
      emptyEl.hidden = false;
      countEl.textContent = '0 proyectos';
      return;
    }
    emptyEl.hidden = true;
    countEl.textContent = items.length === 1 ? '1 proyecto' : `${items.length} proyectos`;
    items.forEach(p => listEl.appendChild(projectCard(p)));

    const anyUpdated = items.some(p => p.updated_ok);
    successBar.hidden = !anyUpdated;
    if (anyUpdated) setTimeout(() => { successBar.hidden = true; }, 2400);
  }

  // --- Crear tarjeta ---
  function projectCard(p) {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="card__avatar" aria-hidden="true">📚</div>
      <div class="card__body">
        <h3 class="card__title" title="${escapeHtml(p.titulo)}">${escapeHtml(p.titulo)}</h3>

        <div class="card__meta">
          <span title="Investigadores">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.34-6 3v1h12v-1c0-1.66-2.67-3-6-3Z" fill="currentColor"/>
            </svg>
            1 investigador
          </span>
          <span>•</span>
          <span class="card__author">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.86 0-7 1.79-7 4v2h14v-2c0-2.21-3.14-4-7-4Z" fill="currentColor"/>
            </svg>
            ${escapeHtml(p.investigadores)}
          </span>
        </div>

        <div class="card__forms">
          <span>Formularios:</span>
          <button class="btn-mini btn-outline" data-action="pdf" data-id="${p.id}" title="Exportar PDF">PDF</button>
          <button class="btn-mini btn-outline" data-action="excel" data-id="${p.id}" title="Exportar Excel">Excel</button>
        </div>
      </div>
      <div class="card__chev" aria-hidden="true">›</div>
    `;

    // Navegar al clic en la tarjeta completa
    el.addEventListener('click', () => {
      window.location.href = `formulario-pedagogica.html?id=${p.id}`;
    });

    // Evitar propagación al hacer clic en los botones de exportación
    el.querySelectorAll('.btn-mini').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        const action = ev.currentTarget.getAttribute('data-action');
        const pid = Number(ev.currentTarget.getAttribute('data-id'));
        // Cargamos respuestas desde ambas tablas
        const { proyectoResp, informeResp } = await fetchRespuestas(pid);
        const meta = { titulo: p.titulo, investigadores: p.investigadores, id: pid };

        if (action === 'pdf') {
          exportPDF(meta, proyectoResp, informeResp);
        } else if (action === 'excel') {
          exportCSV(meta, proyectoResp, informeResp);
        }
      });
    });

    return el;
  }

  // --- Buscar respuestas en Supabase ---
  async function fetchRespuestas(projectId) {
    const [r1, r2] = await Promise.all([
      supabase.from('innovacion_pedagogica_form_proyecto').select('respuestas').eq('project_id', projectId).maybeSingle(),
      supabase.from('innovacion_pedagogica_form_informe').select('respuestas').eq('project_id', projectId).maybeSingle()
    ]);

    const proyectoResp = r1.error ? null : (r1.data?.respuestas || null);
    const informeResp  = r2.error ? null : (r2.data?.respuestas || null);

    return { proyectoResp, informeResp };
  }

  // --- Armar filas legibles [{seccion, item, valor}] ---
  function buildRows(meta, respProyecto, respInforme) {
    const rows = [];
    rows.push({ seccion: 'Proyecto', item: 'Título', valor: meta.titulo || '—' });
    rows.push({ seccion: 'Proyecto', item: 'Investigadores', valor: meta.investigadores || '—' });

    if (respProyecto) {
      Object.entries(respProyecto).forEach(([k, v]) => {
        rows.push({ seccion: 'Formulario: Proyecto', item: k, valor: v === 'si' ? 'Sí' : (v === 'no' ? 'No' : '—') });
      });
    }
    if (respInforme) {
      Object.entries(respInforme).forEach(([k, v]) => {
        rows.push({ seccion: 'Informe Final', item: k, valor: v === 'si' ? 'Sí' : (v === 'no' ? 'No' : '—') });
      });
    }
    return rows;
  }

  // --- Exportar a PDF (ventana imprimible) ---
  function exportPDF(meta, respProyecto, respInforme) {
    const rows = buildRows(meta, respProyecto, respInforme);
    const date = new Date().toLocaleString();

    const tableRows = rows.map(r => `
      <tr>
        <td>${escapeHtml(r.seccion)}</td>
        <td>${escapeHtml(r.item)}</td>
        <td style="text-align:center">${escapeHtml(r.valor)}</td>
      </tr>
    `).join('');

    const html = `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Reporte ${escapeHtml(meta.titulo || '')}</title>
<style>
  body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#0f172a; margin:24px; }
  h1 { font-size:20px; margin:0 0 6px; }
  .muted { color:#64748b; margin:0 0 16px; }
  table { width:100%; border-collapse: collapse; }
  th, td { border:1px solid #e5e7eb; padding:8px 10px; font-size:13px; }
  th { background:#f1f5f9; text-align:left; }
  tr:nth-child(even) td { background:#fafafa; }
</style>
</head>
<body>
  <h1>Reporte de Formularios</h1>
  <div class="muted">${escapeHtml(meta.titulo)} — ${escapeHtml(meta.investigadores)}</div>
  <div class="muted">Generado: ${escapeHtml(date)}</div>
  <table>
    <thead>
      <tr><th>Sección</th><th>Ítem</th><th>Respuesta</th></tr>
    </thead>
    <tbody>
      ${tableRows || `<tr><td colspan="3" style="text-align:center;color:#64748b">No hay respuestas guardadas.</td></tr>`}
    </tbody>
  </table>
  <script>window.addEventListener('load',()=>{window.print();});</script>
</body>
</html>`.trim();

    const w = window.open('', '_blank');
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  }

  // --- Exportar a CSV (abre en Excel) ---
  function exportCSV(meta, respProyecto, respInforme) {
    const rows = buildRows(meta, respProyecto, respInforme);
    const header = ['Sección','Ítem','Respuesta'];
    const allRows = [
      header,
      ...rows.map(r => [r.seccion, r.item, r.valor])
    ];

    // CSV seguro (escapando comillas)
    const csv = allRows.map(r => r.map(cell => {
      const s = String(cell ?? '');
      const needsQuote = /[",\n;]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuote ? `"${escaped}"` : escaped;
    }).join(',')).join('\n');

    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }); // BOM para Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${meta.titulo || 'reporte'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // --- Búsqueda / Filtros ---
  function applySearch() {
    const term = (q.value || '').trim().toLowerCase();
    const filtered = projects.filter(p =>
      (p.titulo || '').toLowerCase().includes(term) ||
      (p.investigadores || '').toLowerCase().includes(term)
    );
    render(filtered);
  }

  q.addEventListener('input', applySearch);
  clearBtn.addEventListener('click', () => { q.value = ''; q.focus(); applySearch(); });
  let asc = true;
  filterBtn.addEventListener('click', () => {
    projects.sort((a, b) => asc ? a.titulo.localeCompare(b.titulo) : b.titulo.localeCompare(a.titulo));
    asc = !asc;
    applySearch();
  });

  fab.addEventListener('click', () => { window.location.href = 'nuevo-proyecto2.html'; });

  // Inicial
  render(projects);
});

// Utilidad simple para evitar inyectar HTML
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[s]);
}
