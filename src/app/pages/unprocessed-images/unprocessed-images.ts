import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { UnprocessedImagesService, ImageSummary } from '../../core/unprocessedImages/unprocessedImages.service';
import { DatasetService } from '../../core/dataset/dataset.service';
import { AnnotationRequest, DatasetDto, LabelDto } from '../../core/interfaces/annotation';
import { ImageThumb } from '../../shared/image-thumb';
import { Annotator } from '../annotator/annotator';

@Component({
  selector: 'app-unprocessed-images',
  imports: [ImageThumb, Annotator, FormsModule],
  templateUrl: './unprocessed-images.html',
  styleUrl: './unprocessed-images.css',
})
export class UnprocessedImages {
  private readonly service = inject(UnprocessedImagesService);
  private readonly datasetService = inject(DatasetService);
  private readonly destroyRef = inject(DestroyRef);

  // Imágenes pendientes
  readonly items = signal<ImageSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly deletingId = signal<number | null>(null);

  // Datasets y clases
  readonly datasets = signal<DatasetDto[]>([]);
  readonly datasetId = signal<number | null>(null);
  readonly labels = signal<LabelDto[]>([]);

  newDatasetName = '';
  newDatasetDescription = '';
  newLabelName = '';
  readonly formError = signal('');

  // Anotación
  readonly selected = signal<ImageSummary | null>(null);
  readonly selectedSrc = signal<string | null>(null);
  readonly loadingImage = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');

  constructor() {
    this.load();
    this.loadDatasets();
    this.loadLabels();
  }

  // ---------- Imágenes pendientes ----------
  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.service
      .getAllUnprocessed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: all => {
          this.items.set(all);
          this.loading.set(false);
        },
        error: err => {
          this.loading.set(false);
          this.error.set(err.error?.message ?? 'No se pudieron cargar las imágenes.');
        },
      });
  }

  remove(img: ImageSummary): void {
    if (!confirm(`¿Eliminar "${img.fileName}"?`)) return;

    this.deletingId.set(img.id);
    this.service.delete(img.id).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.id !== img.id));
        this.deletingId.set(null);
      },
      error: err => {
        this.deletingId.set(null);
        // 404 = ya no existe, se puede quitar de la lista igual
        if (err.status === 404) {
          this.items.update(list => list.filter(i => i.id !== img.id));
        } else {
          this.error.set('No se pudo eliminar la imagen');
        }
      },
    });
  }

  // ---------- Datasets ----------
  private loadDatasets(selectId?: number): void {
    this.datasetService
      .getDatasets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => {
          this.datasets.set(list);
          if (selectId != null) {
            this.selectDataset(selectId);
          } else if (this.datasetId() === null && list.length > 0) {
            this.selectDataset(list[0].id);
          }
        },
        error: err => console.error('Error al cargar datasets', err),
      });
  }

  selectDataset(id: number | null): void {
    this.datasetId.set(id);
    this.formError.set('');
    if (id !== null) this.loadLabels();
  }

  private loadLabels(): void {
    this.datasetService
      .getLabels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: labels => this.labels.set(labels),
        error: err => console.error('Error al cargar las clases', err),
      });
  }

  createDataset(): void {
    const name = this.newDatasetName.trim();
    if (!name) return;
    this.formError.set('');

    this.datasetService
      .createDataset({
        name,
        description: this.newDatasetDescription.trim() || undefined,
      })
      .subscribe({
        next: created => {
          this.newDatasetName = '';
          this.newDatasetDescription = '';
          this.loadDatasets(created.id);
        },
        error: err => {
          // 409 = nombre repetido (hay unique en name)
          this.formError.set(
            err.status === 409
              ? 'Ya existe un dataset con ese nombre.'
              : 'No se pudo crear el dataset.'
          );
        },
      });
  }

  createLabel(): void {
    const id = this.datasetId();
    const name = this.newLabelName.trim();
    if (id === null || !name) return;
    this.formError.set('');

    this.datasetService.createLabel(id, name).subscribe({
      next: label => {
        this.labels.update(list => [...list, label]);
        this.newLabelName = '';
      },
      error: err => {
        this.formError.set(
          err.status === 409
            ? 'Ya existe una clase con ese nombre.'
            : 'No se pudo crear la clase.'
        );
      },
    });
  }

  // ---------- Anotación ----------
  open(img: ImageSummary): void {
    if (this.datasetId() === null) return;

    this.selected.set(img);
    this.selectedSrc.set(null);
    this.saveError.set('');
    this.loadingImage.set(true);

    this.datasetService.getImageBlob(img.id).subscribe({
      next: blob => {
        // Evita mostrar una imagen vieja si el usuario ya cerró o abrió otra
        if (this.selected()?.id !== img.id) return;
        this.selectedSrc.set(URL.createObjectURL(blob));
        this.loadingImage.set(false);
      },
      error: () => {
        this.loadingImage.set(false);
        this.saveError.set('No se pudo cargar la imagen.');
      },
    });
  }

  close(): void {
    if (this.saving()) return;

    const src = this.selectedSrc();
    if (src) URL.revokeObjectURL(src);

    this.selected.set(null);
    this.selectedSrc.set(null);
    this.saveError.set('');
  }

  onSave(annotations: AnnotationRequest[]): void {
    const img = this.selected();
    const datasetId = this.datasetId();
    if (!img || datasetId === null || this.saving()) return;

    this.saving.set(true);
    this.saveError.set('');

    this.datasetService.saveAnnotations(datasetId, img.id, annotations).subscribe({
      next: () => {
        this.saving.set(false);
        // Ya procesada: sale de la lista de pendientes
        this.items.update(list => list.filter(i => i.id !== img.id));
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('No se pudieron guardar las anotaciones. Intenta nuevamente.');
      },
    });
  }
}