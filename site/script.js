const SAMPLE_CSV = `data,produto,quantidade,preco_unitario,vendedor
2024-01-05,Notebook,2,3500.00,Ana
2024-01-06,Mouse,5,150.00,Bruno
2024-01-07,Notebook,1,3500.00,Ana
2024-01-08,Teclado,3,250.00,Carlos
2024-01-09,Mouse,2,150.00,Ana
2024-01-10,Monitor,1,1200.00,Bruno
2024-01-11,Teclado,1,250.00,Carlos
2024-01-12,Notebook,2,3500.00,Bruno
2024-01-13,Mouse,4,150.00,Carlos
2024-01-14,Monitor,2,1200.00,Ana`;

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const statusEl = document.getElementById('status');
const errorBox = document.getElementById('error-box');
const results = document.getElementById('results');
const sampleLink = document.getElementById('sample-link');

let chartReceita, chartEvolucao;

// ===================== carregar_dados() =====================
function carregarDados(csvText) {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error('Erro ao ler CSV: ' + parsed.errors[0].message);

  const requiredCols = ['data', 'produto', 'quantidade', 'preco_unitario', 'vendedor'];
  const cols = parsed.meta.fields || [];
  for (const c of requiredCols) {
    if (!cols.includes(c)) throw new Error(`Coluna obrigatória ausente: "${c}"`);
  }

  let rows = parsed.data;
  rows = rows.filter(r => requiredCols.every(c => r[c] !== null && r[c] !== undefined && String(r[c]).trim() !== ''));

  rows = rows.map(r => ({
    data: r.data.trim(),
    produto: r.produto.trim(),
    quantidade: Number(r.quantidade),
    preco_unitario: Number(r.preco_unitario),
    vendedor: r.vendedor.trim(),
  }));

  rows = rows.filter(r => !isNaN(r.quantidade) && !isNaN(r.preco_unitario));

  const seen = new Set();
  rows = rows.filter(r => {
    const key = JSON.stringify(r);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  rows = rows.map(r => ({ ...r, total_venda: r.quantidade * r.preco_unitario }));

  if (rows.length === 0) throw new Error('Nenhuma linha válida encontrada após a limpeza.');
  return rows;
}

// ===================== relatório =====================
function gerarRelatorio(df) {
  const totalVendas = df.reduce((acc, r) => acc + r.total_venda, 0);
  const ticketMedio = totalVendas / df.length;

  const qtdPorProduto = {};
  for (const r of df) qtdPorProduto[r.produto] = (qtdPorProduto[r.produto] || 0) + r.quantidade;

  const [produtoMaisVendido, qtdTop] = Object.entries(qtdPorProduto).sort((a, b) => b[1] - a[1])[0];

  return { totalVendas, ticketMedio, produtoMaisVendido, qtdTop };
}

function formatBRL(value) {
  return 'R$ ' + value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?=,))/g, '.');
}

// ===================== gráficos =====================
function gerarGraficos(df) {
  const receitaPorProduto = {};
  for (const r of df) receitaPorProduto[r.produto] = (receitaPorProduto[r.produto] || 0) + r.total_venda;
  const produtos = Object.keys(receitaPorProduto);
  const receitas = produtos.map(p => receitaPorProduto[p]);

  const vendasPorDia = {};
  for (const r of df) vendasPorDia[r.data] = (vendasPorDia[r.data] || 0) + r.total_venda;
  const dias = Object.keys(vendasPorDia).sort();
  const valoresDia = dias.map(d => vendasPorDia[d]);

  const fontFamily = "'Space Grotesk', sans-serif";
  const gridColor = '#2A3142';
  const textColor = '#8E96A8';

  if (chartReceita) chartReceita.destroy();
  if (chartEvolucao) chartEvolucao.destroy();

  chartReceita = new Chart(document.getElementById('chart-receita'), {
    type: 'bar',
    data: {
      labels: produtos,
      datasets: [{
        label: 'Receita (R$)',
        data: receitas,
        backgroundColor: '#FF6B4A',
        borderRadius: 6,
        maxBarThickness: 56,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, font: { family: fontFamily, size: 12 } }, grid: { display: false } },
        y: { ticks: { color: textColor, font: { family: fontFamily, size: 11 } }, grid: { color: gridColor }, beginAtZero: true }
      }
    }
  });

  chartEvolucao = new Chart(document.getElementById('chart-evolucao'), {
    type: 'line',
    data: {
      labels: dias,
      datasets: [{
        label: 'Total vendido (R$)',
        data: valoresDia,
        borderColor: '#5EEAD4',
        backgroundColor: 'rgba(94, 234, 212, 0.08)',
        pointBackgroundColor: '#5EEAD4',
        pointBorderColor: '#0B0E14',
        pointBorderWidth: 2,
        pointRadius: 5,
        borderWidth: 2.5,
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, font: { family: fontFamily, size: 10 }, maxRotation: 45, minRotation: 45 }, grid: { display: false } },
        y: { ticks: { color: textColor, font: { family: fontFamily, size: 11 } }, grid: { color: gridColor }, beginAtZero: true }
      }
    }
  });
}

// ===================== tabela =====================
function renderTable(df) {
  const head = document.getElementById('table-head');
  const body = document.getElementById('table-body');
  const cols = ['data', 'produto', 'quantidade', 'preco_unitario', 'vendedor', 'total_venda'];

  head.innerHTML = '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';

  const preview = df.slice(0, 8);
  body.innerHTML = preview.map(r => {
    return '<tr>' + cols.map(c => {
      const val = r[c];
      const isNum = c === 'quantidade' || c === 'preco_unitario' || c === 'total_venda';
      const display = isNum ? (c === 'quantidade' ? val : val.toFixed(2)) : val;
      const cls = c === 'total_venda' ? 'num highlight' : (isNum ? 'num' : '');
      return `<td class="${cls}">${display}</td>`;
    }).join('') + '</tr>';
  }).join('');
}

// ===================== pipeline completo =====================
function rodarPipeline(csvText, sourceLabel) {
  errorBox.style.display = 'none';
  statusEl.innerHTML = 'processando...';

  try {
    const df = carregarDados(csvText);
    statusEl.innerHTML = `<span class="ok">✓</span> ${df.length} linhas carregadas — ${sourceLabel}`;

    const { totalVendas, ticketMedio, produtoMaisVendido, qtdTop } = gerarRelatorio(df);

    document.getElementById('total-vendas').textContent = formatBRL(totalVendas);
    document.getElementById('ticket-medio').textContent = formatBRL(ticketMedio);
    document.getElementById('produto-top').textContent = produtoMaisVendido;
    document.getElementById('produto-top-qtd').textContent = `${qtdTop} unidades vendidas`;

    gerarGraficos(df);
    renderTable(df);

    results.style.display = 'block';
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    errorBox.textContent = 'Erro: ' + err.message;
    errorBox.style.display = 'block';
    results.style.display = 'none';
    statusEl.innerHTML = '<span class="err">✗ falha ao processar</span>';
  }
}

// ===================== eventos =====================
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    errorBox.textContent = 'Erro: por favor selecione um arquivo .csv';
    errorBox.style.display = 'block';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => rodarPipeline(e.target.result, file.name);
  reader.readAsText(file);
}

sampleLink.addEventListener('click', (e) => {
  e.preventDefault();
  rodarPipeline(SAMPLE_CSV, 'dados.csv (exemplo)');
});
