import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BehaviorEventDto } from '../../core/interfaces/BehaviorEventDto';
import { StatsService } from '../../core/stats/stats.service';

@Component({
  selector: 'app-images',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './images.html',
  styleUrl: './images.css',
})
export class Images implements OnInit {

  events: BehaviorEventDto[] = [];
  loading = false;
  loadingMore = false;
  errorMessage = '';

  page = 0;
  readonly pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  selectedLabel = '';
  searchText = '';

  selectedImage: BehaviorEventDto | null = null;

  constructor(
    private statsService: StatsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadImages();
  }

  get hasMore(): boolean {
    return this.page + 1 < this.totalPages;
  }

  loadImages(): void {
    this.page = 0;
    this.events = [];
    this.loading = true;
    this.errorMessage = '';
    this.fetchPage();
  }

  loadMore(): void {
    if (!this.hasMore || this.loadingMore) return;

    this.page++;
    this.loadingMore = true;
    this.fetchPage();
  }

  private fetchPage(): void {
    this.statsService.getImages(this.page, this.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          const withImage = res.content.filter(
            event => !!event.imageB64
          );

          this.events = [...this.events, ...withImage];
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
        },
        error: (error: unknown) => {
          console.error('Error al cargar imágenes:', error);

          // Para poder reintentar la misma página
          if (this.page > 0) this.page--;

          this.errorMessage =
            'No se pudieron cargar las imágenes. Intenta nuevamente.';
        }
      });
  }

  get uniqueLabels(): string[] {
    return [
      ...new Set(
        this.events.map(event => event.label)
      )
    ].sort();
  }

  get filteredEvents(): BehaviorEventDto[] {
    const search = this.searchText.trim().toLowerCase();

    return this.events.filter(event => {
      const matchesLabel =
        !this.selectedLabel ||
        event.label === this.selectedLabel;

      const matchesSearch =
        !search ||
        event.label.toLowerCase().includes(search) ||
        String(event.id).includes(search);

      return matchesLabel && matchesSearch;
    });
  }

  getImageUrl(imageB64: string): string {
    if (imageB64.startsWith('data:image/')) {
      return imageB64;
    }

    return `data:image/jpeg;base64,${imageB64}`;
  }

  openImage(event: BehaviorEventDto): void {
    this.selectedImage = event;
  }

  closeImage(): void {
    this.selectedImage = null;
  }
}