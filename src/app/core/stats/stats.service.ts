import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BehaviorEventsPageDto } from '../interfaces/BehaviorEventsPageDto';

export interface LabelTotalDto { label: string; total: number; }
export interface LabelStatsDto { label: string; average: number; max: number; min: number; }
export interface ActivityByMinuteDto { minute: string; label: string; total: number; }

@Injectable({ providedIn: 'root' })
export class StatsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/stream/stats`;

  getTotals(): Observable<LabelTotalDto[]> {
    return this.http.get<LabelTotalDto[]>(`${this.apiUrl}/totals`);
  }
  getSummary(): Observable<LabelStatsDto[]> {
    return this.http.get<LabelStatsDto[]>(`${this.apiUrl}/summary`);
  }
  getByMinute(): Observable<ActivityByMinuteDto[]> {
    return this.http.get<ActivityByMinuteDto[]>(`${this.apiUrl}/by-minute`);
  }

  getImages(page = 0, size = 20): Observable<BehaviorEventsPageDto> {
    return this.http.get<BehaviorEventsPageDto>(`${this.apiUrl}/images`, {
      params: { page, size }
    });
  }
}