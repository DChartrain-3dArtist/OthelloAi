import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardGameComponent } from './boardgame.component';

describe('BoardgameComponent', () => {
  let component: BoardGameComponent;
  let fixture: ComponentFixture<BoardGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardGameComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BoardGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
