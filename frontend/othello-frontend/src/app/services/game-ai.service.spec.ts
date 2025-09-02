import { TestBed } from '@angular/core/testing';

import { GameAIService } from './game-ai.service';

describe('GameAIService', () => {
  let service: GameAIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameAIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
