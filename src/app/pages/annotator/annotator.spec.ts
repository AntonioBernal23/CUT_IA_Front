import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Annotator } from './annotator';

describe('Annotator', () => {
  let component: Annotator;
  let fixture: ComponentFixture<Annotator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Annotator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Annotator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
