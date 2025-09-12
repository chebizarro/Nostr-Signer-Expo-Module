package biz.nostr.expo.signer

import android.content.Intent
import org.junit.Assert.assertEquals
import org.junit.Test

class NostrNip55SignerModuleMappingTest {
  private fun intentWith(vararg pairs: Pair<String, String>): Intent {
    val i = Intent()
    for ((k, v) in pairs) i.putExtra(k, v)
    return i
  }

  @Test
  fun map_get_public_key() {
    val module = NostrNip55SignerModule()
    val i = intentWith("signature" to "npub1xyz", "package" to "com.greenart7c3.nostrsigner")
    val mapped = module.mapIntentResultForTest(NostrNip55SignerModule.Operation.GET_PUBLIC_KEY, i)
    assertEquals("npub1xyz", mapped["npub"])
    assertEquals("com.greenart7c3.nostrsigner", mapped["package"])
  }

  @Test
  fun map_sign_event() {
    val module = NostrNip55SignerModule()
    val i = intentWith("signature" to "sig", "id" to "123", "event" to "{}")
    val mapped = module.mapIntentResultForTest(NostrNip55SignerModule.Operation.SIGN_EVENT, i)
    assertEquals("sig", mapped["signature"])
    assertEquals("123", mapped["id"])
    assertEquals("{}", mapped["event"])
  }

  @Test
  fun map_encrypt_decrypt_and_relays_all_use_result_id() {
    val module = NostrNip55SignerModule()
    val operations = listOf(
      NostrNip55SignerModule.Operation.NIP04_ENCRYPT,
      NostrNip55SignerModule.Operation.NIP04_DECRYPT,
      NostrNip55SignerModule.Operation.NIP44_ENCRYPT,
      NostrNip55SignerModule.Operation.NIP44_DECRYPT,
      NostrNip55SignerModule.Operation.DECRYPT_ZAP_EVENT,
      NostrNip55SignerModule.Operation.GET_RELAYS,
    )
    for (op in operations) {
      val i = intentWith("signature" to "val", "id" to "id-1")
      val mapped = module.mapIntentResultForTest(op, i)
      assertEquals("val", mapped["result"])
      assertEquals("id-1", mapped["id"])
    }
  }
}
