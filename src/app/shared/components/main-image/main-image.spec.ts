import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainImage } from './main-image';

describe('MainImage', () => {
  let component: MainImage;
  let fixture: ComponentFixture<MainImage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainImage],
    }).compileComponents();

    fixture = TestBed.createComponent(MainImage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
