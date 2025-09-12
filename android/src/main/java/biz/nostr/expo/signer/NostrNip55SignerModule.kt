package biz.nostr.expo.signer

import android.content.Context
import android.content.Intent
import biz.nostr.android.nip55.AppInfo
import biz.nostr.android.nip55.IntentBuilder
import biz.nostr.android.nip55.Signer
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NostrNip55SignerModule : Module() {

    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    private var signerPackageName: String? = null

    // region: Pending calls map for fallback intents
    private data class PendingCall(val promise: Promise, val op: Operation)
    private val pendingCalls: MutableMap<Int, PendingCall> = mutableMapOf()
    private var requestSeq: Int = 0
    private fun nextRequestCodeFor(op: Operation): Int {
        // Generate request codes in a large range to minimize collision
        // Combine op base with an incrementing sequence
        requestSeq = (requestSeq + 1) and 0x0FFF
        return op.base + requestSeq
    }
    internal enum class Operation(val base: Int) {
        GET_PUBLIC_KEY(REQUEST_GET_PUBLIC_KEY),
        SIGN_EVENT(REQUEST_SIGN_EVENT),
        NIP04_ENCRYPT(REQUEST_NIP_04_ENCRYPT),
        NIP04_DECRYPT(REQUEST_NIP_04_DECRYPT),
        NIP44_ENCRYPT(REQUEST_NIP_44_ENCRYPT),
        NIP44_DECRYPT(REQUEST_NIP_44_DECRYPT),
        DECRYPT_ZAP_EVENT(REQUEST_DECRYPT_ZAP_EVENT),
        GET_RELAYS(REQUEST_GET_RELAYS)
    }

    override fun definition() = ModuleDefinition {
        Name("ExpoNostrSignerModule")

        Events("onChange")

        AsyncFunction("isExternalSignerInstalled") { packageName: String ->
            val resolveInfoList: List<Any> = Signer.isExternalSignerInstalled(context, packageName)
            // Return true if the list isn't empty, false otherwise
            resolveInfoList.isNotEmpty()
        }

        AsyncFunction("getInstalledSignerApps") {
            val signerAppInfos: List<AppInfo> = Signer.getInstalledSignerApps(context)
            signerAppInfos.map { info ->
                mapOf(
                    "name" to info.name,
                    "packageName" to info.packageName,
                    // Do not pass iconData to avoid large payloads
                    "iconUrl" to info.iconUrl
                )
            }
        }

        AsyncFunction("setPackageName") { packageName: String ->
            if (packageName.isBlank()) {
                throw IllegalArgumentException("Missing or empty packageName parameter")
            }
            signerPackageName = packageName
        }

        AsyncFunction("getPublicKey") { pkgName: String?, permissions: String?, promise: Promise ->
            val packageName = getPackageNameFromCall(pkgName)
            val publicKey: String? = Signer.getPublicKey(context, packageName)
            if (publicKey != null) {
                // Direct approach success
                val resultMap = mapOf("npub" to publicKey, "package" to packageName)
                promise.resolve(resultMap)
            } else {
                // Fallback approach
                launchFallbackIntent(
                    op = Operation.GET_PUBLIC_KEY,
                    intent = IntentBuilder.getPublicKeyIntent(packageName, permissions),
                    promise = promise
                )
            }
        }

        AsyncFunction("signEvent") {
                pkgName: String?,
                eventJson: String,
                eventId: String,
                npub: String,
                promise: Promise ->
            val packageName = getPackageNameFromCall(pkgName)
            val signedEvent: Array<String>? =
                Signer.signEvent(context, packageName, eventJson, npub)
            if (signedEvent != null) {
                val resultMap =
                        mapOf(
							"signature" to signedEvent[0],
							"id" to eventId,
							"event" to signedEvent[1]
                        )
                promise.resolve(resultMap)
            } else {
                val intent = IntentBuilder.signEventIntent(packageName, eventJson, eventId, npub)
                launchFallbackIntent(Operation.SIGN_EVENT, intent, promise)
            }
        }

        AsyncFunction("nip04Encrypt") {
                packageName: String?,
                plainText: String,
                id: String,
                pubKey: String,
                npub: String,
                promise: Promise ->
            val pkg = getPackageNameFromCall(packageName)
            val encryptedText = Signer.nip04Encrypt(context, pkg, plainText, npub, pubKey)
            if (encryptedText != null) {
                val resultMap = mapOf("result" to encryptedText, "id" to id)
                promise.resolve(resultMap)
            } else {
                val intent = IntentBuilder.nip04EncryptIntent(pkg, plainText, id, npub, pubKey)
                launchFallbackIntent(Operation.NIP04_ENCRYPT, intent, promise)
            }
        }

        AsyncFunction("nip04Decrypt") {
                packageName: String?,
                encryptedText: String,
                id: String,
                pubKey: String,
                npub: String,
                promise: Promise ->
            val pkg = getPackageNameFromCall(packageName)
            val decryptedText = Signer.nip04Decrypt(context, pkg, encryptedText, npub, pubKey)
            if (decryptedText != null) {
                val resultMap = mapOf("result" to decryptedText, "id" to id)
                promise.resolve(resultMap)
            } else {
                val intent = IntentBuilder.nip04DecryptIntent(pkg, encryptedText, id, npub, pubKey)
                launchFallbackIntent(Operation.NIP04_DECRYPT, intent, promise)
            }
        }

        AsyncFunction("nip44Encrypt") {
                packageName: String?,
                plainText: String,
                id: String,
                pubKey: String,
                npub: String,
                promise: Promise ->
            val pkg = getPackageNameFromCall(packageName)
            val encryptedText = Signer.nip44Encrypt(context, pkg, plainText, npub, pubKey)
            if (encryptedText != null) {
                val resultMap = mapOf("result" to encryptedText, "id" to id)
                promise.resolve(resultMap)
            } else {
                val intent = IntentBuilder.nip44EncryptIntent(pkg, plainText, id, npub, pubKey)
                launchFallbackIntent(Operation.NIP44_ENCRYPT, intent, promise)
            }
        }

        AsyncFunction("nip44Decrypt") {
                packageName: String?,
                encryptedText: String,
                id: String,
                pubKey: String,
                npub: String,
                promise: Promise ->
            val pkg = getPackageNameFromCall(packageName)
            val decryptedText = Signer.nip44Decrypt(context, pkg, encryptedText, npub, pubKey)
            if (decryptedText != null) {
                val resultMap = mapOf("result" to decryptedText, "id" to id)
                promise.resolve(resultMap)
            } else {
                val intent = IntentBuilder.nip44DecryptIntent(pkg, encryptedText, id, npub, pubKey)
                launchFallbackIntent(Operation.NIP44_DECRYPT, intent, promise)
            }
        }

        AsyncFunction("decryptZapEvent") {
                packageName: String?,
                eventJson: String,
                id: String,
                npub: String,
                promise: Promise ->
            val pkg = getPackageNameFromCall(packageName)
            val decryptedEventJson = Signer.decryptZapEvent(context, pkg, eventJson, npub)
            if (decryptedEventJson != null) {
                val resultMap = mapOf("result" to decryptedEventJson, "id" to id)
                promise.resolve(resultMap)
            } else {
                val intent = IntentBuilder.decryptZapEventIntent(pkg, eventJson, id, npub)
                launchFallbackIntent(Operation.DECRYPT_ZAP_EVENT, intent, promise)
            }
        }

        AsyncFunction("getRelays") {
                packageName: String?,
                id: String,
                npub: String,
                promise: Promise ->
            val pkg = getPackageNameFromCall(packageName)
            val relayJson = Signer.getRelays(context, pkg, npub)
            if (relayJson != null) {
                val resultMap = mapOf("result" to relayJson, "id" to id)
                promise.resolve(resultMap)
            } else {
                val intent = IntentBuilder.getRelaysIntent(pkg, id, npub)
                launchFallbackIntent(Operation.GET_RELAYS, intent, promise)
            }
        }

        OnActivityResult { _, payload ->
            val pending = pendingCalls.remove(payload.requestCode) ?: return@OnActivityResult
            val promise = pending.promise

            if (payload.resultCode == android.app.Activity.RESULT_CANCELED) {
                promise.reject("INTENT_CANCELLED", "Activity cancelled by user", null)
                return@OnActivityResult
            }

            val dataIntent = payload.data
            if (dataIntent == null) {
                promise.reject("INTENT_FAILED", "No data returned from activity", null)
                return@OnActivityResult
            }
            val mapped = mapIntentResult(pending.op, dataIntent)
            promise.resolve(mapped)
        }
    }

    // Map intent extras to the public API result shape per operation.
    private fun mapIntentResult(op: Operation, dataIntent: Intent): Map<String, String?> {
        return when (op) {
            Operation.GET_PUBLIC_KEY -> {
                val npub = dataIntent.getStringExtra("signature")
                val packageName = dataIntent.getStringExtra("package")
                mapOf("npub" to npub, "package" to packageName)
            }
            Operation.SIGN_EVENT -> {
                val signature = dataIntent.getStringExtra("signature")
                val id = dataIntent.getStringExtra("id")
                val signedEventJson = dataIntent.getStringExtra("event")
                mapOf("signature" to signature, "id" to id, "event" to signedEventJson)
            }
            Operation.NIP04_ENCRYPT, Operation.NIP44_ENCRYPT,
            Operation.NIP04_DECRYPT, Operation.NIP44_DECRYPT,
            Operation.DECRYPT_ZAP_EVENT, Operation.GET_RELAYS -> {
                val signature = dataIntent.getStringExtra("signature")
                val resultId = dataIntent.getStringExtra("id")
                mapOf("result" to signature, "id" to resultId)
            }
        }
    }

    // Visible for testing: expose mapping for Robolectric tests
    @androidx.annotation.VisibleForTesting
    internal fun mapIntentResultForTest(op: Operation, dataIntent: Intent): Map<String, String?> =
        mapIntentResult(op, dataIntent)

    /** Helper method to handle fallback launching */
    private fun launchFallbackIntent(op: Operation, intent: Intent, promise: Promise) {
        val activity = appContext.activityProvider?.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "No current activity available to launch signer", null)
            return
        }
        try {
            val requestCode = nextRequestCodeFor(op)
            pendingCalls[requestCode] = PendingCall(promise, op)
            activity.startActivityForResult(intent, requestCode)
        } catch (e: Throwable) {
            promise.reject("INTENT_FAILED", "Failed to start activity for result", e.toCodedException())
        }
    }

    /** Helper function to get the effective package name or fallback to a stored one */
    private fun getPackageNameFromCall(paramPackageName: String?): String {
        return if (!paramPackageName.isNullOrBlank()) {
            paramPackageName
        } else {
            signerPackageName
				?: throw IllegalArgumentException(
					"Signer package name not set. Call setPackageName first."
				)
        }
    }

    companion object {
        private const val REQUEST_GET_PUBLIC_KEY = 1001
        private const val REQUEST_SIGN_EVENT = 1002
        private const val REQUEST_NIP_04_ENCRYPT = 1003
        private const val REQUEST_NIP_04_DECRYPT = 1004
        private const val REQUEST_NIP_44_ENCRYPT = 1005
        private const val REQUEST_NIP_44_DECRYPT = 1006
        private const val REQUEST_DECRYPT_ZAP_EVENT = 1007
        private const val REQUEST_GET_RELAYS = 1008
    }

    // no-op marker class removed; using pendingCalls map instead

}
