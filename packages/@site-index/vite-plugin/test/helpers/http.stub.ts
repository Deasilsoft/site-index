import { vi } from "vitest";

export type RequestLike = {
  url?: string;
  method?: string;
};

export type ResponseLike = {
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
  statusCode: number;
};

export type RequestHandler = (
  req: RequestLike,
  res: ResponseLike,
  next: () => void,
) => void;

export function createResponseStub(): ResponseLike {
  return {
    setHeader: vi.fn(),
    end: vi.fn(),
    statusCode: 0,
  };
}
