import { afterEach, beforeEach, vi } from "vitest";

type ResettableMock = {
  mockReset: () => void;
};

export function setupCommandMock(mockFn: ResettableMock): void {
  beforeEach(() => {
    mockFn.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}
