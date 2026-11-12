import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { signToken, verifyToken } from "@/lib/jwt";
import type { JWTPayload } from "@/src/type";

const payload: JWTPayload = {
  id: 1,
  email: "admin@empresa.com",
  role: "administrator",
  first_name: "Carlos",
  last_name: "Hernandez",
};

describe("jwt helpers", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it("firma y verifica un token conservando el payload", () => {
    const token = signToken(payload);

    expect(typeof token).toBe("string");
    expect(verifyToken(token)).toMatchObject(payload);
  });

  it("devuelve null para un token inválido", () => {
    expect(verifyToken("esto-no-es-un-jwt")).toBeNull();
  });

  it("devuelve null cuando el secreto no coincide", () => {
    const token = signToken(payload);
    process.env.JWT_SECRET = "otro-secreto";

    expect(verifyToken(token)).toBeNull();
  });

  it("lanza un error si JWT_SECRET no está configurado", () => {
    delete process.env.JWT_SECRET;

    expect(() => signToken(payload)).toThrow(/JWT_SECRET/);
  });
});
