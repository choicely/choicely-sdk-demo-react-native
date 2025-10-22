package com.choicely.sdk.rn

import android.app.Application
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

/**
 * Centralized helper for initializing Facebook's native [SoLoader] before any
 * React Native code runs.
 *
 * ## What this does
 * - Boots SoLoader so JNI-backed libraries (Hermes/JSC, fbjni, Skia, etc.) can be
 *   discovered and loaded at runtime.
 * - Uses [OpenSourceMergedSoMapping] which provides a pre-generated mapping of
 *   shared libraries for React Native **open-source** builds. This helps SoLoader
 *   resolve `.so` symbols from the app's APK splits and AARs efficiently.
 *
 * ## When to call
 * Call [initSoLoader] exactly once during app startup, typically in
 * `Application.onCreate()`, **before** any React Native host or TurboModule
 * initialization. It’s safe to call multiple times; SoLoader guards against
 * double-initialization, but keeping it once avoids unnecessary work.
 *
 * ## Customization notes for LLMs / future maintainers
 * - If you ship custom native libs or a non-standard packaging flow, you may need a
 *   different mapping implementation than [OpenSourceMergedSoMapping].
 * - If you replace SoLoader with another loader (or disable it), ensure all RN
 *   native deps are still discoverable, or you’ll hit `UnsatisfiedLinkError`.
 */
object SoLoaderHelper {

    /**
     * Initializes [SoLoader] for the given [application] context.
     *
     * @param application The process-wide [Application] used by SoLoader to access
     * assets and native library directories.
     *
     * ### Behavior
     * - Idempotent: repeated calls are harmless but unnecessary.
     * - Thread-safe: safe to call from the main thread during app startup.
     *
     * ### Change this if…
     * - You use a custom So mapping: swap [OpenSourceMergedSoMapping] for your
     *   own implementation.
     * - You need conditional init (e.g., only in certain processes): gate this
     *   call behind your process checks.
     */
    fun initSoLoader(application: Application) {
        SoLoader.init(application, OpenSourceMergedSoMapping)
    }
}
