import type { Mock } from "vitest";

export function getFirstMockArgument<T>(
  mock: Mock<(argument: T, ...args: unknown[]) => unknown>,
  label: string,
): T {
  const call = mock.mock.calls[0];

  if (!call) {
    throw new Error(`Expected ${label} to have call 1`);
  }

  return call[0] as T;
}
