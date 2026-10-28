import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Stream } from './stream';

describe('Stream', () => {
  let component: Stream;
  let fixture: ComponentFixture<Stream>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stream]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Stream);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
