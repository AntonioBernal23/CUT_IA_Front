import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { UnprocessedImagesService } from '../core/unprocessedImages/unprocessedImages.service';

@Component({
  selector: 'app-image-thumb',
  standalone: true,
  template: `
    @if (src(); as s) {
      <img [src]="s" [alt]="alt()" class="w-full aspect-video object-cover" />
    } @else {
      <div class="bg-gray-200 animate-pulse aspect-video"></div>
    }
  `
})
export class ImageThumb {
  readonly imageId = input.required<number>();
  readonly alt = input('');
  readonly src = signal<string | null>(null);

  private readonly service = inject(UnprocessedImagesService);

  constructor() {
    effect(onCleanup => {
      const sub = this.service.getContent(this.imageId()).subscribe({
        next: blob => {
          this.revoke();
          this.src.set(URL.createObjectURL(blob));
        }
      });
      onCleanup(() => sub.unsubscribe());
    });

    inject(DestroyRef).onDestroy(() => this.revoke());
  }

  private revoke(): void {
    const current = this.src();
    if (current) URL.revokeObjectURL(current);
  }
}