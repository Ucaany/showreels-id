describe("admin access helpers", () => {
  const originalOwnerEmail = process.env.OWNER_EMAIL;
  const originalAdminEmails = process.env.ADMIN_EMAILS;
  const originalAdminEmailsLower = process.env.admin_emails;

  afterEach(() => {
    if (originalOwnerEmail === undefined) {
      delete process.env.OWNER_EMAIL;
    } else {
      process.env.OWNER_EMAIL = originalOwnerEmail;
    }

    if (originalAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = originalAdminEmails;
    }

    if (originalAdminEmailsLower === undefined) {
      delete process.env.admin_emails;
    } else {
      process.env.admin_emails = originalAdminEmailsLower;
    }

    jest.resetModules();
  });

  it("always treats the configured owner email as admin", async () => {
    process.env.OWNER_EMAIL = "hello@ucan.com";
    delete process.env.ADMIN_EMAILS;
    delete process.env.admin_emails;

    const { isAdminEmail } = await import("@/server/admin-access");

    expect(isAdminEmail("hello@ucan.com")).toBe(true);
  });

  it("keeps custom admin emails alongside the owner email", async () => {
    process.env.OWNER_EMAIL = "hello@ucan.com";
    process.env.ADMIN_EMAILS = "team@showreels.id";

    const { getAdminEmailList } = await import("@/server/admin-access");

    expect(getAdminEmailList().sort()).toEqual([
      "hello@ucan.com",
      "team@showreels.id",
    ]);
  });
});
