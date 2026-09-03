import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "./auth";

describe("auth schemas", () => {
  it("normalizes a valid e-mail address", () => {
    const parsed = signInSchema.parse({
      email: "  ROBERTH@example.com ",
      password: "memoria-segura",
    });

    expect(parsed.email).toBe("roberth@example.com");
  });

  it("rejects short passwords", () => {
    const parsed = signInSchema.safeParse({
      email: "roberth@example.com",
      password: "curta",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires a display name during sign-up", () => {
    const parsed = signUpSchema.safeParse({
      email: "roberth@example.com",
      password: "memoria-segura",
      fullName: " ",
    });

    expect(parsed.success).toBe(false);
  });
});
