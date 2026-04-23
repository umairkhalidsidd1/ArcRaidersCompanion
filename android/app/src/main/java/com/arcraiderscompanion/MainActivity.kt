package com.ArcRaidersCompanion

import android.graphics.PixelFormat
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ArcRaidersCompanion"

  /**
   * Force the activity window to use a 32-bit RGBA_8888 surface so gradients
   * (especially dark blue → black) render smoothly without 16-bit (RGB_565)
   * banding. Without this, Android falls back to RGB_565 on many devices and
   * shows visible color steps/layers behind cards, the skill tree, weapons
   * carousel, etc. iOS uses 32-bit by default — this brings Android in line.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    window.setFormat(PixelFormat.RGBA_8888)
    super.onCreate(savedInstanceState)
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
