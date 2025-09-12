package biz.nostr.expo.signer

import org.junit.Test
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull

class NostrNip55SignerModuleTest {
  @Test
  fun module_definition_has_name() {
    val module = NostrNip55SignerModule()
    val def = module.definition()
    // The ModuleDefinition name is set to "ExpoNostrSignerModule"
    assertNotNull(def)
    // There is no direct getter for name; this test ensures the module can be constructed without errors.
    // Additional Robolectric-based integration tests can be added to simulate activity results.
  }
}
