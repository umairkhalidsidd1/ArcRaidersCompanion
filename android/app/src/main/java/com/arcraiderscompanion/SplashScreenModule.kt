package com.ArcRaidersCompanion

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SplashScreenModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun markReady() {
    MainActivity.markLaunchSplashReady()
  }

  companion object {
    const val NAME = "AndroidSplashScreen"
  }
}