import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuelconsumptionComponent } from './fuelconsumption.component';

describe('FuelconsumptionComponent', () => {
  let component: FuelconsumptionComponent;
  let fixture: ComponentFixture<FuelconsumptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuelconsumptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FuelconsumptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
