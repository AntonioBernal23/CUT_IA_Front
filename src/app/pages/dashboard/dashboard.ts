import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { forkJoin, interval, startWith, switchMap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StatsService } from '../../core/stats/stats.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, BaseChartDirective],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
  private api = inject(StatsService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  menuOpen = false;

  private palette = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171'];

  stats = [
    { title: 'Detecciones totales', value: '—', detail: 'Eventos registrados', color: 'blue' },
    { title: 'Categoría principal', value: '—', detail: 'Más detectada', color: 'violet' },
    { title: 'Confianza promedio', value: '—', detail: 'Entre todas las etiquetas', color: 'emerald' },
    // Sin endpoint todavía: se queda estático
    { title: 'Tiempo activo', value: '99.8%', detail: 'Disponibilidad del sistema', color: 'amber' }
  ];

  legend: { label: string; pct: number; color: string }[] = [];

  lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: {
        beginAtZero: true,
        grid: { color: '#1e293b' },
        ticks: { color: '#94a3b8', precision: 0 }
      }
    }
  };

  lineData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Detecciones',
      data: [],
      borderColor: '#60a5fa',
      backgroundColor: 'rgba(96,165,250,0.12)',
      pointBackgroundColor: '#60a5fa',
      borderWidth: 2,
      pointRadius: 3,
      fill: true,
      tension: 0.4
    }]
  };

  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { display: false } }
  };

  doughnutData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: '#0f172a',
      borderWidth: 4
    }]
  };

  constructor() {
    // se cancela solo al destruir el componente
  }

  ngOnInit() {
    interval(10_000).pipe(
      startWith(0),
      switchMap(() =>
        forkJoin({
          totals: this.api.getTotals(),
          summary: this.api.getSummary(),
          byMinute: this.api.getByMinute()
        }).pipe(
          catchError(err => {
            console.error('Error cargando estadísticas', err);
            return of(null);
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (!res) return;
      const { totals, summary, byMinute } = res;

      const grand = totals.reduce((a, t) => a + t.total, 0);
      const top = [...totals].sort((a, b) => b.total - a.total)[0];
      const totalByLabel = new Map(totals.map(t => [t.label, t.total]));
      const weightSum = summary.reduce((a, s) => a + (totalByLabel.get(s.label) ?? 0), 0);
      const avgConf = weightSum
      ? (summary.reduce((a, s) => a + s.average * (totalByLabel.get(s.label) ?? 0), 0) / weightSum) * 100
        : null;
      // Tarjetas (la 4ª se queda como está)
      this.stats = [
        { ...this.stats[0], value: grand.toLocaleString('es-MX') },
        { ...this.stats[1], value: top?.label ?? '—', detail: `${top?.total ?? 0} detecciones` },
        { ...this.stats[2], value: avgConf !== null ? avgConf.toFixed(1) + '%' : '—' },
        this.stats[3]
      ];

      // Dona + leyenda
      const colors = totals.map((_, i) => this.palette[i % this.palette.length]);
      this.doughnutData = {
        labels: totals.map(t => t.label),
        datasets: [{
          data: totals.map(t => t.total),
          backgroundColor: colors,
          borderColor: '#0f172a',
          borderWidth: 4
        }]
      };
      this.legend = totals.map((t, i) => ({
        label: t.label,
        pct: grand ? Math.round((t.total / grand) * 100) : 0,
        color: colors[i]
      }));

      // Línea por minuto (suma todas las etiquetas de cada minuto)
      const perMinute = new Map<string, number>();
      byMinute.forEach(m =>
        perMinute.set(m.minute, (perMinute.get(m.minute) ?? 0) + m.total)
      );

      this.lineData = {
        labels: [...perMinute.keys()],
        datasets: [{ ...this.lineData.datasets[0], data: [...perMinute.values()] }]
      };
      this.cdr.markForCheck();
    });
  }
}