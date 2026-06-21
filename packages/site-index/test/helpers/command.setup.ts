import { afterEach, beforeEach, vi } from "vitest";

type ResettableMock = {
  mockReset: () => void;
};

export function setupCommandMock(mockFunction: ResettableMock): void {
  beforeEach(() => {
    mockFunction.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}
