import * as Nip55 from "nostr-nip55-signer";
import { getEventHash, nip19 } from "nostr-tools";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface SignerAppInfo {
  name: string;
  packageName: string;
  iconUrl?: string;
}

export interface Permission {
  type: string;
  kind?: number;
  checked?: boolean;
}

export default function App(): JSX.Element {
  const [publicKey, setPublicKey] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [eventContent, setEventContent] = useState<string>("");
  const [encryptPubKey, setEncryptPubKey] = useState<string>("");
  const [messageToEncrypt, setMessageToEncrypt] = useState<string>("");
  const [encryptedMessage, setEncryptedMessage] = useState<string>("");
  const [decryptedMessage, setDecryptedMessage] = useState<string>("");
  const [signerInstalled, setSignerInstalled] = useState<boolean>(false);
  const [packageName, setPackageName] = useState<string>("");
  const [signerApps, setSignerApps] = useState<SignerAppInfo[]>([]);
  const [isScriptActive, setIsScriptActive] = useState<boolean>(false);
  const [relays, setRelays] = useState<string>("");

  /**
   * Fetch installed signer apps on mount
   */
  useEffect(() => {
    const fetchSignerApps = async () => {
      try {
        const apps: SignerAppInfo[] = await Nip55.getInstalledSignerApps();
        setSignerApps(apps);
      } catch (error) {
        console.error("Error getting installed signer apps:", error);
        Alert.alert("Error", "Failed to fetch installed signer apps.");
      }
    };
    fetchSignerApps();
  }, []);

  /**
   * When packageName changes, setPackageName in the module and then check if installed
   */
  useEffect(() => {
    const checkSignerInstalled = async () => {
      try {
        if (packageName) {
          // setPackageName from the Expo module
          await Nip55.setPackageName(packageName);
          // isExternalSignerInstalled => { installed: boolean }
          const result = await Nip55.isExternalSignerInstalled(packageName);
          setSignerInstalled(Boolean(result));
        } else {
          setSignerInstalled(false);
        }
      } catch (error) {
        console.error("Error checking signer installation:", error);
        setSignerInstalled(false);
        Alert.alert("Error", "Failed to check if signer is installed.");
      }
    };
    checkSignerInstalled();
  }, [packageName]);

  /**
   * On tapping an icon, we set the packageName state
   */
  const selectSignerApp = (app: SignerAppInfo) => {
    setPackageName(app.packageName);
  };

  const perms: Permission[] = [
    { type: "sign_event", kind: 22242 },
    { type: "nip44_decrypt" },
  ];

  /**
   * Retrieves the public key
   */
  const getPublicKey = async () => {
    try {
      const result = await Nip55.getPublicKey(packageName, perms);
      setPublicKey(result.npub);
      Alert.alert("Public Key", `npub: ${result.npub}`);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to get public key");
    }
  };

  /**
   * Signs an event
   */
  const signEvent = async () => {
    try {
      const { data } = nip19.decode(publicKey);
      const event = {
        kind: 1,
        created_at: Math.round(Date.now() / 1000),
        content: eventContent,
        tags: [],
        pubkey: data,
        id: "",
        sig: "",
      };
      const hash = getEventHash(event);
      event.id = hash;

      const eventJson = JSON.stringify(event);
      const eventId = "event123";
      const npub = data;

      if (!npub) {
        Alert.alert("Error", "Please get the public key first.");
        return;
      }

      const result = await Nip55.signEvent(
        packageName,
        eventJson,
        eventId,
        npub,
      );
      setSignature(result.signature);
      Alert.alert("Sign Event", `Signature: ${result.signature}`);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to sign event");
    }
  };

  /**
   * Encrypt a message (NIP-04 or NIP-44)
   */
  const encryptMessage = async () => {
    try {
      if (!publicKey) {
        Alert.alert("Error", "Public key not available.");
        return;
      }
      if (!encryptPubKey) {
        Alert.alert("Error", "Recipient public key is required.");
        return;
      }
      if (!messageToEncrypt) {
        Alert.alert("Error", "Message to encrypt is required.");
        return;
      }
      const { data } = nip19.decode(encryptPubKey);

      let result;
      if (isScriptActive) {
        result = await Nip55.nip44Encrypt(
          packageName,
          messageToEncrypt,
          "encrypt123",
          data,
          publicKey,
        );
      } else {
        result = await Nip55.nip04Encrypt(
          packageName,
          messageToEncrypt,
          "encrypt123",
          data,
          publicKey,
        );
      }
      setEncryptedMessage(result.result);
      Alert.alert("Encryption", `Encrypted Message: ${result.result}`);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Encryption failed");
    }
  };

  /**
   * Decrypt a message (NIP-04 or NIP-44)
   */
  const decryptMessage = async () => {
    try {
      if (!publicKey) {
        Alert.alert("Error", "Public key not available.");
        return;
      }
      if (!encryptPubKey) {
        Alert.alert("Error", "Recipient public key is required.");
        return;
      }
      if (!encryptedMessage) {
        Alert.alert("Error", "No encrypted message to decrypt.");
        return;
      }

      const { data } = nip19.decode(encryptPubKey);

      let result;
      if (isScriptActive) {
        result = await Nip55.nip44Decrypt(
          packageName,
          encryptedMessage,
          "decrypt123",
          publicKey,
          data,
        );
      } else {
        result = await Nip55.nip04Decrypt(
          packageName,
          encryptedMessage,
          "decrypt123",
          publicKey,
          data,
        );
      }

      setDecryptedMessage(result.result);
      Alert.alert("Decryption", `Decrypted Message: ${result.result}`);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Decryption failed");
    }
  };

  /**
   * Decrypt a Zap event
   */
  const decryptZapEvent = async () => {
    try {
      const eventJson = '{"content": "Zap event content"}';
      const eventId = "zap123";

      const result = await Nip55.decryptZapEvent(
        packageName,
        eventJson,
        eventId,
        publicKey,
      );
      Alert.alert("Decrypt Zap Event", `Result: ${result.result}`);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to decrypt Zap event");
    }
  };

  /**
   * Retrieve relay info
   */
  const getRelays = async () => {
    try {
      const { data } = nip19.decode(publicKey);

      const result = await Nip55.getRelays(packageName, "relay123", data);
      setRelays(result.result);
      Alert.alert("Relays", `Relay Information: ${result.result}`);
    } catch (error: any) {
      console.error("Error fetching relays:", error);
      Alert.alert("Error", error.message || "Failed to fetch relays");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Nostr Signer Demo (Expo)</Text>

        <Text style={styles.subheader}>Installed Signers</Text>
        {signerApps.length > 0 ? (
          signerApps.map((app) => (
            <TouchableOpacity
              key={app.packageName}
              style={styles.appChooser}
              onPress={() => selectSignerApp(app)}
            >
              {app.iconUrl ? (
                <Image source={{ uri: app.iconUrl }} style={styles.appIcon} />
              ) : null}
              <Text style={styles.appName}>{app.name}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No signer apps installed.</Text>
        )}

        <View style={styles.separator} />

        <Button
          title="Get Public Key"
          onPress={getPublicKey}
          disabled={!signerInstalled}
        />
        {publicKey ? (
          <Text style={styles.output}>Public Key: {publicKey}</Text>
        ) : null}

        <View style={styles.separator} />

        <Text style={styles.subheader}>Sign Event</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Event Content"
          value={eventContent}
          onChangeText={setEventContent}
        />
        <Button
          title="Sign Event"
          onPress={signEvent}
          disabled={!signerInstalled}
        />
        {signature ? (
          <Text style={styles.output}>Signature: {signature}</Text>
        ) : null}

        <View style={styles.separator} />

        <Text style={styles.subheader}>Encryption</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Recipient Public Key"
          value={encryptPubKey}
          onChangeText={setEncryptPubKey}
        />
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Message to Encrypt"
          value={messageToEncrypt}
          onChangeText={setMessageToEncrypt}
          multiline
        />
        <View style={styles.toggleContainer}>
          <Switch value={isScriptActive} onValueChange={setIsScriptActive} />
          <Text style={styles.toggleText}>
            {isScriptActive ? "NIP-44" : "NIP-04"}
          </Text>
        </View>
        <View style={styles.buttonRow}>
          <Button
            title="Encrypt Message"
            onPress={encryptMessage}
            disabled={!signerInstalled}
          />
          <Button
            title="Decrypt Message"
            onPress={decryptMessage}
            disabled={!signerInstalled}
          />
        </View>
        {encryptedMessage ? (
          <Text style={styles.output}>Encrypted: {encryptedMessage}</Text>
        ) : null}
        {decryptedMessage ? (
          <Text style={styles.output}>Decrypted: {decryptedMessage}</Text>
        ) : null}

        <View style={styles.separator} />

        <Text style={styles.subheader}>Zap Event Decryption</Text>
        <Button
          title="Decrypt Zap Event"
          onPress={decryptZapEvent}
          disabled={!signerInstalled}
        />

        <View style={styles.separator} />
        <Text style={styles.subheader}>Relays</Text>
        <Button
          title="Get Relays"
          onPress={getRelays}
          disabled={!signerInstalled}
        />
        {relays ? <Text style={styles.output}>Relays: {relays}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  subheader: { fontSize: 20, marginVertical: 8 },
  separator: { height: 1, backgroundColor: "#CCCCCC", marginVertical: 16 },
  text: { marginVertical: 16 },
  output: { marginVertical: 8, backgroundColor: "#f0f0f0", padding: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  toggleText: { marginLeft: 10, fontSize: 16 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  appChooser: { alignItems: "center", marginBottom: 20 },
  appIcon: { width: 80, height: 80, marginBottom: 10 },
  appName: { fontSize: 16, textAlign: "center" },
});
