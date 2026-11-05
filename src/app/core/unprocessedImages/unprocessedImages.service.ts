import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ImageSummary {
  id: number;
  fileName: string;
  width: number;
  height: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

@Injectable({ providedIn: 'root' })
export class UnprocessedImagesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/dataset`;

  getUnprocessed(page: number, size: number): Observable<Page<ImageSummary>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<ImageSummary>>(`${this.url}/unprocessed`, { params });
  }

  getAllUnprocessed(pageSize = 100): Observable<ImageSummary[]> {
    return this.getUnprocessed(0, pageSize).pipe(
      expand(p => (p.last ? EMPTY : this.getUnprocessed(p.number + 1, pageSize))),
      map(p => p.content),
      reduce((all, chunk) => all.concat(chunk), [] as ImageSummary[])
    );
  }

  getContent(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/content/${id}`, { responseType: 'blob' });
  }

  delete(id: number) {
  return this.http.delete<void>(`${this.url}/eliminate/${id}`);
}
}