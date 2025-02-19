import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingslotComponent } from './parkingslot.component';

describe('ParkingslotComponent', () => {
  let component: ParkingslotComponent;
  let fixture: ComponentFixture<ParkingslotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingslotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParkingslotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
