import { Platform } from "react-native";
import NostrNip55SignerModule from "./NostrNip55SignerModule";

const ensureAndroid = () => {
  if (Platform.OS !== "android") {
    const err = new Error("ANDROID_ONLY");
    (err as any).code = "ANDROID_ONLY";
    throw err;
  }
};

export const isAndroid = () => Platform.OS === "android";

export async function isExternalSignerInstalled(packageName: string): Promise<boolean> {
  ensureAndroid();
  return NostrNip55SignerModule.isExternalSignerInstalled(packageName);
}

export interface SignerAppInfo {
  name: string;
  packageName: string;
  iconUrl?: string;
}

export async function getInstalledSignerApps(): Promise<SignerAppInfo[]> {
  ensureAndroid();
  return NostrNip55SignerModule.getInstalledSignerApps();
}

export async function setPackageName(packageName: string): Promise<void> {
  ensureAndroid();
  if (!packageName || typeof packageName !== "string") {
    const err = new Error("MISSING_PARAMS: packageName");
    (err as any).code = "MISSING_PARAMS";
    throw err;
  }
  return NostrNip55SignerModule.setPackageName(packageName);
}

export type PermissionType =
  | "get_public_key"
  | "nip04_encrypt"
  | "nip04_decrypt"
  | "nip44_encrypt"
  | "nip44_decrypt"
  | "decrypt_zap_event"
  | "sign_event"
  | "nip";

export interface Permission {
  type: PermissionType;
  kind?: number; // for sign_event or nip
  checked?: boolean; // default true
}

export function buildPermissionsJson(perms: Permission[]): string {
  return JSON.stringify(perms ?? []);
}

export const KNOWN_SIGNER_PACKAGES = [
  "com.greenart7c3.nostrsigner",
];

export function selectSignerApp(
  apps: { packageName: string; name: string }[],
  preferredPackages: string[] = KNOWN_SIGNER_PACKAGES
): { packageName: string; name: string } | null {
  if (!apps || apps.length === 0) return null;
  for (const pkg of preferredPackages) {
    const found = apps.find((a) => a.packageName === pkg);
    if (found) return found;
  }
  return apps[0];
}

export async function getPublicKey(
  packageName?: string | null,
  permissions?: Permission[] | string | null,
): Promise<{ npub: string; package: string }>
{
  ensureAndroid();
  const permissionsJson = Array.isArray(permissions)
    ? buildPermissionsJson(permissions)
    : (permissions ?? null);
  return NostrNip55SignerModule.getPublicKey(packageName ?? null, permissionsJson);
}

export async function signEvent(
  packageName: string | null,
  eventJson: string,
  eventId: string,
  npub: string,
): Promise<{ signature: string; id: string; event: string }>
{
  ensureAndroid();
  if (!eventJson || !eventId || !npub) {
    const err = new Error("MISSING_PARAMS: eventJson,eventId,npub");
    (err as any).code = "MISSING_PARAMS";
    throw err;
  }
  return NostrNip55SignerModule.signEvent(packageName, eventJson, eventId, npub);
}

export async function nip04Encrypt(
  packageName: string | null,
  plainText: string,
  id: string,
  pubKey: string,
  npub: string,
): Promise<{ result: string; id: string }>
{
  ensureAndroid();
  if (!plainText || !id || !pubKey || !npub) {
    const err = new Error("MISSING_PARAMS: plainText,id,pubKey,npub");
    (err as any).code = "MISSING_PARAMS";
    throw err;
  }
  return NostrNip55SignerModule.nip04Encrypt(packageName, plainText, id, pubKey, npub);
}

export async function nip04Decrypt(
  packageName: string | null,
  encryptedText: string,
  id: string,
  pubKey: string,
  npub: string,
): Promise<{ result: string; id: string }>
{
  ensureAndroid();
  if (!encryptedText || !id || !pubKey || !npub) {
    const err = new Error("MISSING_PARAMS: encryptedText,id,pubKey,npub");
    (err as any).code = "MISSING_PARAMS";
    throw err;
  }
  return NostrNip55SignerModule.nip04Decrypt(packageName, encryptedText, id, pubKey, npub);
}

export async function nip44Encrypt(
  packageName: string | null,
  plainText: string,
  id: string,
  pubKey: string,
  npub: string,
): Promise<{ result: string; id: string }>
{
  ensureAndroid();
  if (!plainText || !id || !pubKey || !npub) {
    const err = new Error("MISSING_PARAMS: plainText,id,pubKey,npub");
    (err as any).code = "MISSING_PARAMS";
    throw err;
  }
  return NostrNip55SignerModule.nip44Encrypt(packageName, plainText, id, pubKey, npub);
}

export async function nip44Decrypt(
  packageName: string | null,
  encryptedText: string,
  id: string,
  pubKey: string,
  npub: string,
): Promise<{ result: string; id: string }>
{
  ensureAndroid();
  if (!encryptedText || !id || !pubKey || !npub) {
    const err = new Error("MISSING_PARAMS: encryptedText,id,pubKey,npub");
    (err as any).code = "MISSING_PARAMS";
    throw err;
  }
  return NostrNip55SignerModule.nip44Decrypt(packageName, encryptedText, id, pubKey, npub);
}

export async function decryptZapEvent(
  packageName: string | null,
  eventJson: string,
  id: string,
  npub: string,
): Promise<{ result: string; id: string }>
{
  ensureAndroid();
  if (!eventJson || !id || !npub) {
    const err = new Error("MISSING_PARAMS: eventJson,id,npub");
    (err as any).code = "MISSING_PARAMS";
    throw err;
  }
  return NostrNip55SignerModule.decryptZapEvent(packageName, eventJson, id, npub);
}

export async function getRelays(
  packageName: string | null,
  id: string,
  npub: string,
): Promise<{ result: string; id: string }>
{
  ensureAndroid();
  if (!id || !npub) {
    const err = new Error("MISSING_PARAMS: id,npub");
    (err as any).code = "MISSING_PARAMS";
    throw err;
  }
  return NostrNip55SignerModule.getRelays(packageName, id, npub);
}

export default {
  isExternalSignerInstalled,
  getInstalledSignerApps,
  setPackageName,
  getPublicKey,
  signEvent,
  nip04Encrypt,
  nip04Decrypt,
  nip44Encrypt,
  nip44Decrypt,
  decryptZapEvent,
  getRelays,
};
