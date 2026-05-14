import { vi } from "vitest";

type ResponseLike = {
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
  statusCode: number;
};

export function createResponseMock(): ResponseLike {
  return {
    setHeader: vi.fn(),
    end: vi.fn(),
    statusCode: 0,
  };
}

