import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMapa } from './admin-mapa';

describe('AdminMapa', () => {
  let component: AdminMapa;
  let fixture: ComponentFixture<AdminMapa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMapa],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMapa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
