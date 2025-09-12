import * as Nip55 from "../index";

// Mock react-native Platform (android by default)
jest.mock("react-native", () => ({
  Platform: { OS: "android" },
}));

// Track native calls
let lastGetPublicKeyArgs: any[] | null = null;
let lastSignEventArgs: any[] | null = null;
let lastNip04EncArgs: any[] | null = null;
let lastNip04DecArgs: any[] | null = null;
let lastNip44EncArgs: any[] | null = null;
let lastNip44DecArgs: any[] | null = null;
let lastZapArgs: any[] | null = null;
let lastRelaysArgs: any[] | null = null;

// Mock native module
jest.mock("../NostrNip55SignerModule", () => ({
  __esModule: true,
  default: {
    isExternalSignerInstalled: async (_pkg: string) => true,
    getInstalledSignerApps: async () => [
      { name: "Signer", packageName: "com.greenart7c3.nostrsigner", iconUrl: null },
    ],
    setPackageName: async (_pkg: string) => undefined,
    getPublicKey: async (...args: any[]) => {
      lastGetPublicKeyArgs = args;
      return { npub: "npub1xyz", package: "com.greenart7c3.nostrsigner" };
    },
    signEvent: async (...args: any[]) => {
      lastSignEventArgs = args;
      return { signature: "sig", id: "id", event: "{}" };
    },
    nip04Encrypt: async (...args: any[]) => {
      lastNip04EncArgs = args;
      return { result: "enc", id: "id" };
    },
    nip04Decrypt: async (...args: any[]) => {
      lastNip04DecArgs = args;
      return { result: "dec", id: "id" };
    },
    nip44Encrypt: async (...args: any[]) => {
      lastNip44EncArgs = args;
      return { result: "enc44", id: "id" };
    },
    nip44Decrypt: async (...args: any[]) => {
      lastNip44DecArgs = args;
      return { result: "dec44", id: "id" };
    },
    decryptZapEvent: async (...args: any[]) => {
      lastZapArgs = args;
      return { result: "zap", id: "id" };
    },
    getRelays: async (...args: any[]) => {
      lastRelaysArgs = args;
      return { result: "relays", id: "id" };
    },
  },
}));

describe("TS API: helpers and mappings", () => {
  test("buildPermissionsJson serializes array", () => {
    const json = Nip55.buildPermissionsJson([
      { type: "sign_event", kind: 1 },
      { type: "nip04_encrypt" },
    ]);
    expect(json).toContain("sign_event");
    expect(json).toContain("nip04_encrypt");
  });

  test("selectSignerApp prefers known packages", async () => {
    const apps = await Nip55.getInstalledSignerApps();
    const chosen = Nip55.selectSignerApp(apps);
    expect(chosen?.packageName).toBe("com.greenart7c3.nostrsigner");
  });

  test("getPublicKey accepts Permission[] and forwards JSON string", async () => {
    const result = await Nip55.getPublicKey(
      "com.greenart7c3.nostrsigner",
      [{ type: "get_public_key" }]
    );
    expect(result.npub).toBe("npub1xyz");
    expect(lastGetPublicKeyArgs![0]).toBe("com.greenart7c3.nostrsigner");
    expect(typeof lastGetPublicKeyArgs![1]).toBe("string");
    expect((lastGetPublicKeyArgs![1] as string).includes("get_public_key")).toBe(true);
  });
});

describe("TS API: argument validation", () => {
  test("signEvent requires eventJson, eventId, npub", async () => {
    await expect(Nip55.signEvent(null as any, "", "", "")).rejects.toMatchObject({ code: "MISSING_PARAMS" });
  });
  test("nip04Encrypt requires plainText,id,pubKey,npub", async () => {
    await expect(Nip55.nip04Encrypt(null as any, "", "", "", "")).rejects.toMatchObject({ code: "MISSING_PARAMS" });
  });
  test("nip04Decrypt requires encryptedText,id,pubKey,npub", async () => {
    await expect(Nip55.nip04Decrypt(null as any, "", "", "", "")).rejects.toMatchObject({ code: "MISSING_PARAMS" });
  });
  test("nip44Encrypt requires plainText,id,pubKey,npub", async () => {
    await expect(Nip55.nip44Encrypt(null as any, "", "", "", "")).rejects.toMatchObject({ code: "MISSING_PARAMS" });
  });
  test("nip44Decrypt requires encryptedText,id,pubKey,npub", async () => {
    await expect(Nip55.nip44Decrypt(null as any, "", "", "", "")).rejects.toMatchObject({ code: "MISSING_PARAMS" });
  });
  test("decryptZapEvent requires eventJson,id,npub", async () => {
    await expect(Nip55.decryptZapEvent(null as any, "", "", "")).rejects.toMatchObject({ code: "MISSING_PARAMS" });
  });
  test("getRelays requires id,npub", async () => {
    await expect(Nip55.getRelays(null as any, "", "")).rejects.toMatchObject({ code: "MISSING_PARAMS" });
  });
});

describe("TS API: iOS guard", () => {
  test("throws ANDROID_ONLY on iOS", async () => {
    const rn = require("react-native");
    rn.Platform.OS = "ios";
    expect(() => Nip55.isAndroid()).not.toThrow();
    await expect(Nip55.getInstalledSignerApps()).rejects.toMatchObject({ code: "ANDROID_ONLY" });
    rn.Platform.OS = "android";
  });
});
