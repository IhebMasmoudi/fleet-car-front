import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentlogComponent } from './assignmentlog.component';

describe('AssignmentlogComponent', () => {
  let component: AssignmentlogComponent;
  let fixture: ComponentFixture<AssignmentlogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignmentlogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignmentlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
