import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatasetService } from '../../core/dataset/dataset.service';
import { DatasetDto, DatasetImageDto } from '../../core/interfaces/annotation';
import { ImageThumb } from '../../shared/image-thumb';

@Component({
  selector: 'app-dataset-detail',
  imports: [RouterLink, ImageThumb],
  templateUrl: './dataset-detail.html',
})
export class DatasetDetail {
  private readonly datasetService = inject(DatasetService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  readonly dataset = signal<DatasetDto | null>(null);
  readonly images = signal<DatasetImageDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly downloading = signal(false);
  readonly downloadError = signal('');

  private readonly datasetId = Number(this.route.snapshot.paramMap.get('id'));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.datasetService
      .getDataset(this.datasetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: d => this.dataset.set(d),
        error: err =>
          this.error.set(err.status === 404 ? 'El dataset no existe.' : 'No se pudo cargar el dataset.'),
      });

    this.datasetService
      .getDatasetImages(this.datasetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => {
          this.images.set(list);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar las imágenes del dataset.');
        },
      });
  }

  download(): void {
    if (this.downloading()) return;

    this.downloading.set(true);
    this.downloadError.set('');

    this.datasetService.downloadDataset(this.datasetId).subscribe({
      next: res => {
        const blob = res.body;
        if (!blob) {
          this.downloading.set(false);
          this.downloadError.set('La descarga llegó vacía.');
          return;
        }

        const fallback = `${this.dataset()?.name ?? 'dataset'}.zip`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.fileNameFrom(res.headers.get('Content-Disposition')) ?? fallback;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        this.downloading.set(false);
      },
      error: err => {
        this.downloading.set(false);
        this.downloadError.set(
          err.status === 409
            ? 'El dataset no tiene imágenes procesadas.'
            : 'No se pudo descargar el dataset.'
        );
      },
    });
  }

  // Extrae filename del header Content-Disposition
  private fileNameFrom(header: string | null): string | null {
    if (!header) return null;
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
    return match ? decodeURIComponent(match[1]) : null;
  }
}