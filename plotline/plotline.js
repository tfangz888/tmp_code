const fs = require('fs');
const path = require('path');

function generateDates(count) {
  const dates = [];
  const start = new Date();
  start.setDate(start.getDate() - count + 1);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function generateSeries(count, points) {
  const series = [];
  for (let i = 0; i < count; i += 1) {
    const data = [];
    let value = (Math.random() - 0.5) * 40;
    for (let j = 0; j < points; j += 1) {
      value += (Math.random() - 0.5) * 8;
      data.push(parseFloat(value.toFixed(2)));
    }
    series.push({
      name: `Line ${i + 1}`,
      values: data,
    });
  }
  return series;
}

const lineCount = 20;
const pointCount = 60;
const dates = generateDates(pointCount);
const series = generateSeries(lineCount, pointCount);

const traces = series.map((s) => ({
  x: dates,
  y: s.values,
  type: 'scatter',
  mode: 'lines',
  name: s.name,
  customdata: s.name,
  line: { width: 2 },
  hoverinfo: 'none',
}));

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Plotly 多折线图</title>
  <script src="plotly-2.30.0.min.js"></script>
  <style>
    html, body { margin: 0; width: 100%; height: 100%; }
    body { font-family: "Source Han Sans", "Microsoft YaHei", sans-serif; background: #f6f7fb; }
    .wrap { width: 100%; height: 100%; padding: 0; box-sizing: border-box; }
    .card { width: 100%; height: 100%; background: #fff; border-radius: 0; box-shadow: none; padding: 0; box-sizing: border-box; display: flex; flex-direction: column; position: relative; }
    #chart { width: 100%; flex: 1 1 auto; }
    .tip { font-size: 12px; color: #5f6b7a; margin: 8px 0 0; padding: 0 8px 8px; }
    #hoverBox { position: absolute; top: 8px; left: 8px; background: rgba(255, 255, 255, 0.7); color: #1f2937; padding: 8px 10px; border-radius: 6px; font-size: 12px; line-height: 1.4; pointer-events: none; display: none; }
    .hoverItem { display: flex; align-items: center; gap: 4px; }
    .hoverName { white-space: nowrap; flex: 1 1 auto; }
    .hoverSwatch { width: 10px; height: 10px; border-radius: 2px; flex: 0 0 auto; }
    .hoverValue { display: grid; grid-template-columns: 1fr 1ch 2ch; min-width: 42px; flex: 0 0 auto; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; font-variant-numeric: tabular-nums; }
    .hoverValue .int { text-align: right; color: #2563eb; }
    .hoverValue .dot { text-align: center; }
    .hoverValue .dec { text-align: left; color: #111827; }
    .hoverDivider { border-top: 1px solid #111827; margin: 4px 0; }
    #contextMenu { position: absolute; background: #fff; color: #111827; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); min-width: 140px; padding: 6px 0; display: none; z-index: 10; }
    #contextMenu .item { padding: 6px 12px; cursor: pointer; font-size: 12px; }
    #contextMenu .item:hover { background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div id="chart"></div>
      <div class="tip">提示：点击图例可隐藏/显示单条线；双击图例可独显该线。</div>
      <div id="hoverBox"></div>
      <div id="contextMenu">
        <div class="item" data-action="hideOthers">隐藏非高亮线</div>
        <div class="item" data-action="showAll">显示所有</div>
        <div class="item" data-action="zeroDate">选中日期归零</div>
        <div class="item" data-action="menu3">右键菜单3</div>
      </div>
    </div>
  </div>

  <script>
    const data = ${JSON.stringify(traces)};
    const layout = {
      xaxis: {
        type: 'date',
        tickformat: '%y%m%d',
        showspikes: true,
        spikemode: 'across',
        spikesnap: 'cursor',
        spikecolor: '#94a3b8',
        spikethickness: 1
      },
      yaxis: { tickformat: '.2f' },
      legend: { orientation: 'h', x: 0, xanchor: 'left', y: 1, yanchor: 'bottom' },
      margin: { t: 40, r: 8, b: 40, l: 48 },
      hovermode: 'x'
    };
    const config = {
      responsive: true,
      displaylogo: false
    };

    Plotly.newPlot('chart', data, layout, config);

    const chart = document.getElementById('chart');
    const hoverBox = document.getElementById('hoverBox');
    const contextMenu = document.getElementById('contextMenu');
    const baseNames = data.map((d) => d.customdata || d.name);
    let activeTraceIndex = null;
    const activeTraceSet = new Set();
    let lastHoverIndex = null;
    const originalYs = data.map((trace) => trace.y.slice());
    let suppressNextClick = false;

    const applyHighlight = (traceIndex) => {
      if (traceIndex === null || traceIndex === undefined) {
        activeTraceIndex = null;
        activeTraceSet.clear();
        Plotly.restyle('chart', { 'line.width': data.map(() => 2), name: baseNames });
        return;
      }
      const widths = data.map(() => 2);
      const names = baseNames.map((name, idx) => (idx === traceIndex ? '<b>' + name + '</b>' : name));
      widths[traceIndex] = 4;
      activeTraceIndex = traceIndex;
      activeTraceSet.clear();
      activeTraceSet.add(traceIndex);
      Plotly.restyle('chart', { 'line.width': widths, name: names });
    };

    const applyMultiHighlight = () => {
      const widths = data.map((_, idx) => (activeTraceSet.has(idx) ? 4 : 2));
      const names = baseNames.map((name, idx) => (activeTraceSet.has(idx) ? '<b>' + name + '</b>' : name));
      Plotly.restyle('chart', { 'line.width': widths, name: names });
    };
    const pad2 = (n) => String(n).padStart(2, '0');
    const formatDate = (value) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1) + pad2(d.getDate());
    };

    chart.on('plotly_hover', (event) => {
      const points = event.points.slice();
      points.sort((a, b) => b.y - a.y);
      lastHoverIndex = points[0].pointIndex;
      const header = '<div style="font-weight:600;margin-bottom:4px;">' +
        formatDate(points[0].x) +
        '</div>';
      const negIndex = points.findIndex((p) => p.y < 0);
      const rows = points
        .map((p, idx) => {
          const color = (p.fullData && p.fullData.line && p.fullData.line.color) || '#64748b';
          const name = p.customdata || p.data.customdata || p.data.name;
          const parts = p.y.toFixed(2).split('.');
          const row = '<div class="hoverItem"><span class="hoverSwatch" style="background:' +
            color +
            '"></span><span class="hoverName">' +
            name +
            '</span><span class="hoverValue"><span class="int">' +
            parts[0] +
            '</span><span class="dot">.</span><span class="dec">' +
            parts[1] +
            '</span></span></div>';
          if (negIndex !== -1 && idx === negIndex) {
            return '<div class="hoverDivider"></div>' + row;
          }
          return row;
        })
        .join('');
      hoverBox.innerHTML = header + rows;
      const rect = chart.getBoundingClientRect();
      const mouse = event.event || {};
      const maxLeft = rect.width - hoverBox.offsetWidth - 8;
      const maxTop = rect.height - hoverBox.offsetHeight - 8;
      const left = Math.min(Math.max((mouse.clientX || rect.left) - rect.left + 12, 8), maxLeft);
      const top = Math.min(Math.max((mouse.clientY || rect.top) - rect.top + 12, 8), maxTop);
      hoverBox.style.left = left + 'px';
      hoverBox.style.top = top + 'px';
      hoverBox.style.display = 'block';
    });

    chart.on('plotly_unhover', () => {
      hoverBox.style.display = 'none';
    });

    chart.on('plotly_click', (event) => {
      if (event.event && event.event.button === 2) return;
      if (!event.points || !event.points.length) return;
      const rect = chart.getBoundingClientRect();
      const mouseY = (event.event && event.event.clientY) ? (event.event.clientY - rect.top) : null;
      const maxPickDistance = 4;
      let picked = event.points[0];
      if (mouseY !== null && event.points.length > 1) {
        let best = Infinity;
        event.points.forEach((p) => {
          const yPx = p.yaxis.l2p(p.y) + p.yaxis._offset;
          const dist = Math.abs(mouseY - yPx);
          if (dist < best) {
            best = dist;
            picked = p;
          }
        });
        if (best > maxPickDistance) {
          suppressNextClick = true;
          applyHighlight(null);
          return;
        }
      }
      const traceIndex = picked.curveNumber;
      suppressNextClick = true;
      if (event.event && event.event.ctrlKey) {
        if (activeTraceSet.has(traceIndex)) {
          activeTraceSet.delete(traceIndex);
        } else {
          activeTraceSet.add(traceIndex);
        }
        activeTraceIndex = activeTraceSet.size ? traceIndex : null;
        if (activeTraceSet.size === 0) {
          applyHighlight(null);
        } else {
          applyMultiHighlight();
        }
        return;
      }
      if (activeTraceIndex === traceIndex) {
        applyHighlight(null);
      } else {
        applyHighlight(traceIndex);
      }
    });

    chart.addEventListener('click', (event) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      if (event.target && event.target.closest && event.target.closest('.legend')) return;
      applyHighlight(null);
    });

    chart.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      const rect = chart.getBoundingClientRect();
      const maxLeft = rect.width - contextMenu.offsetWidth - 8;
      const maxTop = rect.height - contextMenu.offsetHeight - 8;
      const left = Math.min(Math.max(event.clientX - rect.left, 8), maxLeft);
      const top = Math.min(Math.max(event.clientY - rect.top, 8), maxTop);
      contextMenu.style.left = left + 'px';
      contextMenu.style.top = top + 'px';
      contextMenu.style.display = 'block';
    });

    document.addEventListener('click', () => {
      contextMenu.style.display = 'none';
    });

    contextMenu.addEventListener('click', (event) => {
      const item = event.target.closest('.item');
      if (!item) return;
      const action = item.getAttribute('data-action');
      if (action === 'hideOthers') {
        if (activeTraceSet.size > 0) {
          const visible = data.map((_, idx) => (activeTraceSet.has(idx) ? true : 'legendonly'));
          Plotly.restyle('chart', { visible });
        }
      } else if (action === 'showAll') {
        Plotly.restyle('chart', { visible: data.map(() => true) });
      } else if (action === 'zeroDate') {
        if (lastHoverIndex !== null) {
          const newYs = originalYs.map((ys) => {
            const base = ys.map((v) => Number(v));
            const rebased = new Array(ys.length);
            rebased[lastHoverIndex] = base[lastHoverIndex];
            for (let i = lastHoverIndex - 1; i >= 0; i -= 1) {
              rebased[i] = rebased[i + 1] - base[i];
            }
            for (let i = lastHoverIndex + 1; i < ys.length; i += 1) {
              rebased[i] = rebased[i - 1] + base[i];
            }
            return rebased.map((v) => parseFloat(v.toFixed(2)));
          });
          Plotly.restyle('chart', { y: newYs });
        }
      } else {
        console.log('context menu:', action);
      }
      contextMenu.style.display = 'none';
    });
  </script>
</body>
</html>`;

const outputPath = path.join(__dirname, 'plotline.html');
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Generated: ${outputPath}`);
