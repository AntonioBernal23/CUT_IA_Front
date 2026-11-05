export interface LabelDto {
  id: number;
  name: string;
  classIndex: number;
}

// Caja en memoria: esquina superior izquierda + tamaño, todo normalizado 0..1
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  labelId: number;
}

// Lo que recibe el back (formato YOLO: centro + tamaño)
export interface AnnotationRequest {
  labelId: number;
  xCenter: number;
  yCenter: number;
  boxWidth: number;
  boxHeight: number;
}

export interface SaveAnnotationsRequest {
  imageB64: string;
  annotations: AnnotationRequest[];
}

export interface DatasetDto {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  imageCount?: number;
}

export interface CreateDatasetRequest {
  name: string;
  description?: string;
}

export interface DatasetImageDto {
  imageId: number;
  fileName: string;
  width: number;
  height: number;
  split: 'TRAIN' | 'VAL' | 'TEST';
  status: 'LABELED' | 'REVIEWED';
  addedAt: string;
}