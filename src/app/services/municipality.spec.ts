import { TestBed } from '@angular/core/testing';

import { Municipality } from './municipality';

describe('Municipality', () => {
  let service: Municipality;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Municipality);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
