import { describe, expect, it } from "vitest";
import { PII_MASK, redactIdentifiers } from "./redact";

describe("redactIdentifiers", () => {
  it("masks Aadhaar numbers written with or without spaces", () => {
    const a = redactIdentifiers("నా ఆధార్ 1234 5678 9012.");
    expect(a.text).toBe(`నా ఆధార్ ${PII_MASK}.`);
    expect(a.found).toEqual(["aadhaar"]);
    expect(redactIdentifiers("aadhaar 123456789012").text).toBe(`aadhaar ${PII_MASK}`);
  });

  it("masks phone numbers, emails and PAN, and lists what it found", () => {
    const r = redactIdentifiers("call +91 9876543210 or mail a.b@example.com, PAN ABCDE1234F");
    expect(r.text).not.toMatch(/\d{10}|@|ABCDE1234F/);
    expect(r.found.sort()).toEqual(["email", "pan", "phone"]);
  });

  it("leaves ordinary details alone", () => {
    const r = redactIdentifiers("income 1.2 lakh, 3 acres, 150 units, age 66, 45% disability");
    expect(r.redacted).toBe(false);
    expect(r.text).toBe("income 1.2 lakh, 3 acres, 150 units, age 66, 45% disability");
  });
});
