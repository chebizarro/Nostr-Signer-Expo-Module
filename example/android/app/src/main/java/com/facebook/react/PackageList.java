package com.facebook.react;

import android.app.Application;
import android.content.Context;
import androidx.annotation.Nullable;

import com.facebook.react.PackageListActivity;
import com.facebook.react.ReactPackage;

import java.util.Arrays;
import java.util.List;

import expo.modules.ExpoModulesPackage;

/**
 * Override of the generated PackageList to use the current Expo Modules API.
 * This avoids legacy imports (expo.core.ExpoModulesPackage) from older autolinking templates.
 */
public class PackageList {
  private Application application;
  private ReactNativeHost reactNativeHost;

  public PackageList(ReactNativeHost reactNativeHost) {
    this.reactNativeHost = reactNativeHost;
  }

  public PackageList(Application application) {
    this.application = application;
  }

  private ReactNativeHost getReactNativeHost() {
    return this.reactNativeHost;
  }

  private Application getApplication() {
    if (this.reactNativeHost == null) return this.application;
    return (Application) this.reactNativeHost.getApplication();
  }

  private Context getApplicationContext() {
    return this.getApplication().getApplicationContext();
  }

  public List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
      new ExpoModulesPackage()
    );
  }
}
