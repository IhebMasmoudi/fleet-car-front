import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarDetaillsComponent } from './car-detaills.component';

describe('CarDetaillsComponent', () => {
  let component: CarDetaillsComponent;
  let fixture: ComponentFixture<CarDetaillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarDetaillsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarDetaillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
