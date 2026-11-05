// annotator/annotator.ts
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnnotationRequest, Box, LabelDto } from '../../core/interfaces/annotation';

@Component({
  selector: 'app-annotator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './annotator.html',
})
export class Annotator {
  @Input({ required: true }) imageSrc!: string;      // data:image/... o URL
  @Input({ required: true }) labels: LabelDto[] = [];
  @Output() save = new EventEmitter<AnnotationRequest[]>();

  @ViewChild('overlay') overlayRef!: ElementRef<HTMLDivElement>;

  boxes: Box[] = [];
  selectedLabelId: number | null = null;

  drawing: Box | null = null;
  private start = { x: 0, y: 0 };

  private readonly MIN_SIZE = 0.01; // ignora clics accidentales

  // ---------- Dibujo ----------
  onPointerDown(e: PointerEvent): void {
    if (this.selectedLabelId === null) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this.start = this.toNormalized(e);
    this.drawing = {
      x: this.start.x, y: this.start.y, w: 0, h: 0,
      labelId: this.selectedLabelId,
    };
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.drawing) return;

    const p = this.toNormalized(e);
    this.drawing = {
      ...this.drawing,
      x: Math.min(this.start.x, p.x),
      y: Math.min(this.start.y, p.y),
      w: Math.abs(p.x - this.start.x),
      h: Math.abs(p.y - this.start.y),
    };
  }

  onPointerUp(): void {
    if (this.drawing && this.drawing.w > this.MIN_SIZE && this.drawing.h > this.MIN_SIZE) {
      this.boxes = [...this.boxes, this.drawing];
    }
    this.drawing = null;
  }

  // Convierte coordenadas del mouse a 0..1 relativas a la imagen
  private toNormalized(e: PointerEvent): { x: number; y: number } {
    const rect = this.overlayRef.nativeElement.getBoundingClientRect();
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    return {
      x: clamp((e.clientX - rect.left) / rect.width),
      y: clamp((e.clientY - rect.top) / rect.height),
    };
  }

  // ---------- Utilidades ----------
  labelName(id: number): string {
    return this.labels.find(l => l.id === id)?.name ?? '?';
  }

  removeBox(index: number): void {
    this.boxes = this.boxes.filter((_, i) => i !== index);
  }

  clearAll(): void {
    this.boxes = [];
  }

  // ---------- Envío ----------
  submit(): void {
    const annotations: AnnotationRequest[] = this.boxes.map(b => ({
      labelId: b.labelId,
      xCenter: b.x + b.w / 2,
      yCenter: b.y + b.h / 2,
      boxWidth: b.w,
      boxHeight: b.h,
    }));
    this.save.emit(annotations); // lista vacía = imagen de fondo (válida en YOLO)
  }
}