import { NativeModule, requireNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

import { SignerAppInfo } from ".";
import { NostrNip55SignerModuleEvents } from "./NostrNip55Signer.types";

declare class NostrNip55SignerModule extends NativeModule<NostrNip55SignerModuleEvents> {
  isExternalSignerInstalled(packageName: string): Promise<boolean>;
  getInstalledSignerApps(): Promise<SignerAppInfo[]>;
  setPackageName(packageName: string): Promise<void>;
  getPublicKey(
    packageName?: string | null,
    permissions?: string | null,
  ): Promise<{ npub: string; package: string }>; // include package for parity
  signEvent(
    packageName: string | null,
    eventJson: string,
    eventId: string,
    npub: string,
  ): Promise<{ signature: string; id: string; event: string }>;
  nip04Encrypt(
    packageName: string | null,
    plainText: string,
    id: string,
    pubKey: string,
    npub: string,
  ): Promise<{ result: string; id: string }>;
  nip04Decrypt(
    packageName: string | null,
    encryptedText: string,
    id: string,
    pubKey: string,
    npub: string,
  ): Promise<{ result: string; id: string }>;
  nip44Encrypt(
    packageName: string | null,
    plainText: string,
    id: string,
    pubKey: string,
    npub: string,
  ): Promise<{ result: string; id: string }>;
  nip44Decrypt(
    packageName: string | null,
    encryptedText: string,
    id: string,
    pubKey: string,
    npub: string,
  ): Promise<{ result: string; id: string }>;
  decryptZapEvent(
    packageName: string | null,
    eventJson: string,
    id: string,
    npub: string,
  ): Promise<{ result: string; id: string }>;
  getRelays(
    packageName: string | null,
    id: string,
    npub: string,
  ): Promise<{ result: string; id: string }>;
}

const ANDROID_ONLY_ERROR = () => {
  const err = new Error("ANDROID_ONLY");
  // Attach a code property for consumers who inspect it
  (err as any).code = "ANDROID_ONLY";
  return err;
};

const nativeModule =
  Platform.OS === "android"
    ? requireNativeModule<NostrNip55SignerModule>("ExpoNostrSignerModule")
    : ({
        isExternalSignerInstalled: () => {
          throw ANDROID_ONLY_ERROR();
        },
        getInstalledSignerApps: () => {
          throw ANDROID_ONLY_ERROR();
        },
        setPackageName: () => {
          throw ANDROID_ONLY_ERROR();
        },
        getPublicKey: () => {
          throw ANDROID_ONLY_ERROR();
        },
        signEvent: () => {
          throw ANDROID_ONLY_ERROR();
        },
        nip04Encrypt: () => {
          throw ANDROID_ONLY_ERROR();
        },
        nip04Decrypt: () => {
          throw ANDROID_ONLY_ERROR();
        },
        nip44Encrypt: () => {
          throw ANDROID_ONLY_ERROR();
        },
        nip44Decrypt: () => {
          throw ANDROID_ONLY_ERROR();
        },
        decryptZapEvent: () => {
          throw ANDROID_ONLY_ERROR();
        },
        getRelays: () => {
          throw ANDROID_ONLY_ERROR();
        },
        addListener: () => {
          throw ANDROID_ONLY_ERROR();
        },
        removeListener: () => {
          throw ANDROID_ONLY_ERROR();
        },
        removeAllListeners: () => {
          throw ANDROID_ONLY_ERROR();
        },
        emit: () => {
          throw ANDROID_ONLY_ERROR();
        },
        listenerCount: () => {
          throw ANDROID_ONLY_ERROR();
        },
      } as unknown as NostrNip55SignerModule);

// This call loads the native module object from the JSI.
export default nativeModule;
