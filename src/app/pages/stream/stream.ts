import { Component, ElementRef, OnDestroy, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-stream',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './stream.html'
})
export class Stream implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private abort?: AbortController;

  menuOpen = false;
  connected = signal(false);
  failed = signal(false);
  fps = signal(0);

  constructor() {
    afterNextRender(() => this.start());
  }

  ngOnDestroy(): void {
    this.abort?.abort();
  }

  private async start(): Promise<void> {
    this.abort = new AbortController();
    const el = this.canvas().nativeElement;
    const ctx = el.getContext('2d')!;

    try {
      const res = await fetch(`${environment.apiUrl}/stream`, {
        headers: { Authorization: `Bearer ${this.auth.getToken()}` },
        signal: this.abort.signal
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      let buf = new Uint8Array(0);
      let frames = 0;
      let last = performance.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const merged = new Uint8Array(buf.length + value.length);
        merged.set(buf);
        merged.set(value, buf.length);
        buf = merged;

        // Extrae todos los JPEG completos del buffer (inicio FFD8, fin FFD9)
        while (true) {
          const start = this.find(buf, 0xD8, 0);
          if (start < 0) { buf = buf.slice(-1); break; }
          const end = this.find(buf, 0xD9, start + 2);
          if (end < 0) { buf = buf.slice(start); break; }

          const frame = buf.slice(start, end + 2);
          buf = buf.slice(end + 2);

          const bmp = await createImageBitmap(new Blob([frame], { type: 'image/jpeg' }));
          if (el.width !== bmp.width) { el.width = bmp.width; el.height = bmp.height; }
          ctx.drawImage(bmp, 0, 0);
          bmp.close();

          this.connected.set(true);
          this.failed.set(false);

          frames++;
          const now = performance.now();
          if (now - last >= 1000) {
            this.fps.set(Math.round((frames * 1000) / (now - last)));
            frames = 0;
            last = now;
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        this.connected.set(false);
        this.failed.set(true);
      }
    }
  }

  /** Busca el marcador 0xFF seguido de `second` a partir de `from`. */
  private find(buf: Uint8Array, second: number, from: number): number {
    for (let i = from; i < buf.length - 1; i++) {
      if (buf[i] === 0xFF && buf[i + 1] === second) return i;
    }
    return -1;
  }
}