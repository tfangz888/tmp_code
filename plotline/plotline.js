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
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div id="chart"></div>
      <div class="tip">提示：点击图例可隐藏/显示单条线；双击图例可独显该线。</div>
      <div id="hoverBox"></div>
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
    const pad2 = (n) => String(n).padStart(2, '0');
    const formatDate = (value) => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return String(d.getFullYear()).slice(2) + pad2(d.getMonth() + 1) + pad2(d.getDate());
    };

    chart.on('plotly_hover', (event) => {
      const points = event.points.slice();
      points.sort((a, b) => b.y - a.y);
      const header = '<div style="font-weight:600;margin-bottom:4px;">' +
        formatDate(points[0].x) +
        '</div>';
      const negIndex = points.findIndex((p) => p.y < 0);
      const rows = points
        .map((p, idx) => {
          const color = (p.fullData && p.fullData.line && p.fullData.line.color) || '#64748b';
          const parts = p.y.toFixed(2).split('.');
          const row = '<div class="hoverItem"><span class="hoverSwatch" style="background:' +
            color +
            '"></span><span class="hoverName">' +
            p.data.name +
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
  </script>
</body>
</html>`;

const outputPath = path.join(__dirname, 'plotline.html');
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Generated: ${outputPath}`);
