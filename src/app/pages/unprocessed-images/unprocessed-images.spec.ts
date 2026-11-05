import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnprocessedImages } from './unprocessed-images';

describe('UnprocessedImages', () => {
  let component: UnprocessedImages;
  let fixture: ComponentFixture<UnprocessedImages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnprocessedImages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnprocessedImages);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
