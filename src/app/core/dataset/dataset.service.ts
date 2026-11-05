import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AnnotationRequest, LabelDto, DatasetDto, CreateDatasetRequest, DatasetImageDto } from '../interfaces/annotation';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DatasetService {
  private readonly base = `${environment.apiUrl}/dataset`;

  constructor(private http: HttpClient) {}

  //Funciona
  getLabels(): Observable<LabelDto[]> {
    return this.http.get<LabelDto[]>(`${this.base}/labels`);
  }

  //Flta 
  createLabel(datasetId: number, name: string): Observable<LabelDto> {
    return this.http.post<LabelDto>(`${this.base}/${datasetId}/labels`, { name });
  }

  // Ya funciona
  saveAnnotations(datasetId: number, imageId: number, annotations: AnnotationRequest[]): Observable<void> {
    return this.http.post<void>(
      `${this.base}/${datasetId}/annotations/${imageId}`,
      annotations
    );
  }

  //Ya funciona
  getImageBlob(imageId: number): Observable<Blob> {
    return this.http.get(
      `${this.base}/content/${imageId}`,
      { responseType: 'blob' }
    );
  }

  //Ya funciona
  getDatasets(): Observable<DatasetDto[]> {
    return this.http.get<DatasetDto[]>(this.base);
  }

  //Ya funciona
  createDataset(body: CreateDatasetRequest): Observable<DatasetDto> {
    return this.http.post<DatasetDto>(this.base, body);
  }

  // #### Datasets ####
  getDataset(datasetId: number): Observable<DatasetDto> {
    return this.http.get<DatasetDto>(`${this.base}/${datasetId}`);
  }

  getDatasetImages(datasetId: number): Observable<DatasetImageDto[]> {
    return this.http.get<DatasetImageDto[]>(`${this.base}/${datasetId}/images`);
  }

  downloadDataset(datasetId: number, valRatio = 0.2): Observable<HttpResponse<Blob>> {
  return this.http.get(`${this.base}/${datasetId}/download`, {
    params: { valRatio },
    responseType: 'blob',
    observe: 'response',
  });
}
}