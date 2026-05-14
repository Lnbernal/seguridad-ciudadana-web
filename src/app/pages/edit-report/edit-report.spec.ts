import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditReport } from './edit-report';

describe('EditReport', () => {
  let component: EditReport;
  let fixture: ComponentFixture<EditReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditReport],
    }).compileComponents();

    fixture = TestBed.createComponent(EditReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
