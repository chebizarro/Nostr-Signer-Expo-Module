# expo-nip55

An Android-only Expo Modules plugin that integrates with NIP-55 Signer applications. It prefers the NIP-55 ContentResolver (background) path and safely falls back to Intents when needed. Includes a sample Expo app.

• Android only. The JS API throws a stable error `ANDROID_ONLY` on iOS.
• Tested with the known signer package `com.greenart7c3.nostrsigner`.

## Installation

1) Install and build this module using expo-module-scripts (from the project root):

```
pnpm i
pnpm run build
```

2) In your client app, add queries in AndroidManifest to discover external signer apps:

```xml
<manifest>
  <queries>
    <package android:name="com.greenart7c3.nostrsigner"/>
    <!-- Add additional known signer packages here -->
    <intent>
      <action android:name="android.intent.action.VIEW"/>
      <data android:scheme="nostrsigner"/>
    </intent>
  </queries>
</manifest>
```

## API

Import:

```ts
import * as Nip55 from "expo-nip55";
```

Types:

```ts
export interface SignerAppInfo {
  name: string;
  packageName: string;
  iconUrl?: string;
}

export type PermissionType =
  | "get_public_key"
  | "nip04_encrypt" | "nip04_decrypt"
  | "nip44_encrypt" | "nip44_decrypt"
  | "decrypt_zap_event"
  | "sign_event"
  | "nip";

export interface Permission {
  type: PermissionType;
  kind?: number;      // for sign_event or nip
  checked?: boolean;  // default true
}
```

Helpers:

```ts
Nip55.isAndroid(): boolean
Nip55.buildPermissionsJson(perms: Permission[]): string
```

Methods:

```ts
Nip55.setPackageName(packageName: string): Promise<void>
Nip55.isExternalSignerInstalled(packageName: string): Promise<boolean>
Nip55.getInstalledSignerApps(): Promise<SignerAppInfo[]>

Nip55.getPublicKey(packageName?: string | null, permissions?: Permission[] | string | null):
  Promise<{ npub: string; package: string }>

Nip55.signEvent(packageName: string | null, eventJson: string, id: string, npub: string):
  Promise<{ signature: string; id: string; event: string }>

Nip55.nip04Encrypt(packageName: string | null, plainText: string, id: string, pubKey: string, npub: string):
  Promise<{ result: string; id: string }>

Nip55.nip04Decrypt(packageName: string | null, encryptedText: string, id: string, pubKey: string, npub: string):
  Promise<{ result: string; id: string }>

Nip55.nip44Encrypt(packageName: string | null, plainText: string, id: string, pubKey: string, npub: string):
  Promise<{ result: string; id: string }>

Nip55.nip44Decrypt(packageName: string | null, encryptedText: string, id: string, pubKey: string, npub: string):
  Promise<{ result: string; id: string }>

Nip55.decryptZapEvent(packageName: string | null, eventJson: string, id: string, npub: string):
  Promise<{ result: string; id: string }>

Nip55.getRelays(packageName: string | null, id: string, npub: string):
  Promise<{ result: string; id: string }>
```

Notes:

• `permissions` can be an array of Permission objects or a pre-built JSON string.
• Results map the native extras as per NIP-55. Encrypt/decrypt operations normalize to `{ result, id }`.

## ContentResolver first, Intent fallback

The native module prefers the background ContentResolver path via `NostrAndroid` (v2.0.0). If the provider returns null or signals rejection, the module falls back to an Intent flow where appropriate. Some apps may represent permanent rejections; in such cases, Intent fallback may be skipped by the signer itself.

Error codes (stable):

• ANDROID_ONLY — called on non-Android platforms.
• MISSING_PARAMS — invalid or missing input params.
• NO_ACTIVITY — no current activity to launch the intent.
• INTENT_FAILED — launching or returning from intent failed.
• INTENT_CANCELLED — user cancelled the intent.
• UNEXPECTED_ERROR — unexpected failure.

## Known signer packages

• com.greenart7c3.nostrsigner (default in example app)

## Example app

The example in `example/` demonstrates:

• Listing installed signer apps and choosing a package.
• Getting public key with permissions.
• Signing an event.
• NIP-04 / NIP-44 encrypt/decrypt toggle.
• Decrypting Zap events and getting relays.

Run:

```
cd example
pnpm i
pnpm android
```

## Security & privacy

• Do not log secrets. Event JSON and npub values are sensitive.
• Never accept or handle nsec in this module.

## Testing & CI

JavaScript:

• Jest tests live under `src/__tests__/`. Run via `pnpm test`.

Android:

• Run unit tests with `./gradlew test`.

CI:

• Add steps to run both `pnpm test` and `./gradlew test`.
