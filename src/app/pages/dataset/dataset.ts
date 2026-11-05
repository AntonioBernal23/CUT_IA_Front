import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatasetService } from '../../core/dataset/dataset.service';
import { DatasetDto } from '../../core/interfaces/annotation';

@Component({
  selector: 'app-dataset',
  imports: [RouterLink, DatePipe],
  templateUrl: './dataset.html',
  styleUrl: './dataset.css',
})
export class Datasets {
  private readonly datasetService = inject(DatasetService);
  private readonly destroyRef = inject(DestroyRef);

  readonly datasets = signal<DatasetDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.datasetService
      .getDatasets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => {
          this.datasets.set(list);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar los datasets.');
        },
      });
  }
}