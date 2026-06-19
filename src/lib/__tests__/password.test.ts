import { hashPassword, verifyPassword } from "@/lib/password";

describe("password helpers", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("Ucan301026.");

    await expect(verifyPassword("Ucan301026.", hash)).resolves.toBe(true);
    await expect(verifyPassword("salah-total", hash)).resolves.toBe(false);
  });
});
