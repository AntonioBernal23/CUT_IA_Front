import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetDetail } from './dataset-detail';

describe('DatasetDetail', () => {
  let component: DatasetDetail;
  let fixture: ComponentFixture<DatasetDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatasetDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
