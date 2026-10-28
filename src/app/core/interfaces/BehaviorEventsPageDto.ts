import { BehaviorEventDto } from "./BehaviorEventDto";

export interface BehaviorEventsPageDto {
  content: BehaviorEventDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}