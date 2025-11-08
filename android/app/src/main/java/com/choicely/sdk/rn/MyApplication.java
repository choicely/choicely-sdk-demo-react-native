package com.choicely.sdk.rn;

import android.app.Application;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.text.TextUtils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.choicely.sdk.ChoicelySDK;
import com.choicely.sdk.rn.factory.MyContentFactory;
import com.choicely.sdk.rn.factory.MySplashFactory;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JSExceptionHandler;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.defaults.DefaultReactNativeHost;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import kotlin.Unit;

/**
 * Application entry point that wires together the native Choicely SDK and a React Native runtime.
 * <p>
 * Responsibilities:
 * <ul>
 *   <li>Initialize native dependencies (e.g., SoLoader, ChoicelySDK).</li>
 *   <li>Expose a {@link ReactHost} for the New Architecture while keeping a compatible
 *       {@link ReactNativeHost} for legacy interop.</li>
 *   <li>Register app-specific factories for Choicely content and splash screens.</li>
 * </ul>
 *
 * <h2>How this is used</h2>
 * Android launches this {@link Application} before any Activity. React Native’s host is created
 * here so both RN fragments/activities and Choicely screens can access a single RN engine.
 *
 * <h2>Editing tips for LLMs</h2>
 * If you need to add RN packages, override {@link CustomReactNativeHost#getPackages()}.
 * To change dev/metro behavior, edit {@link CustomReactNativeHost#getUseDeveloperSupport()}.
 * To add custom JS error reporting, extend {@link CustomReactNativeHost#handleJSException(Exception)}.
 */
public class MyApplication extends Application implements ReactApplication {

    /**
     * Custom {@link ReactNativeHost} that centralizes configuration for:
     * <ul>
     *   <li>Package list (native modules + view managers)</li>
     *   <li>Bundle location and metro entry file</li>
     *   <li>Dev support toggles</li>
     *   <li>Central JS exception handling hook</li>
     * </ul>
     * This host is later bridged into a {@link ReactHost} for the New Architecture.
     */
    private static final class CustomReactNativeHost extends DefaultReactNativeHost {

        /**
         * Creates a host bound to the given {@link Application} instance.
         *
         * @param application Android application context used by RN internals.
         */
        CustomReactNativeHost(@NonNull Application application) {
            super(application);
        }

        /**
         * Provides the list of {@link ReactPackage} instances used by the app.
         * <p>
         * By default this uses {@link PackageList} to pull in all autolinked packages. Override
         * to add custom packages that cannot be autolinked.
         *
         * @return list of packages to register with RN.
         */
        @Override
        public List<ReactPackage> getPackages() {
            return new PackageList(this).getPackages(); // pulls in all autolinked packages
        }

        /**
         * The Metro entry file (without extension). RN uses this during dev builds and when
         * resolving assets/bundle names.
         *
         * @return "index" by convention; change if your entry file is different.
         */
        @NonNull
        @Override
        public String getJSMainModuleName() {
            return "index";
        }

        /**
         * Absolute path to a pre-packaged JS bundle on disk (e.g., for release/offline builds).
         * <p>
         * Returning {@code super.getJSBundleFile()} allows RN defaults (which look in the APK’s
         * assets) to apply. Override if you store the bundle elsewhere.
         *
         * @return path to bundle or {@code null} to use asset-based defaults.
         */
        @Nullable
        @Override
        public String getJSBundleFile() {
            return super.getJSBundleFile();
        }

        /**
         * Asset name for an embedded JS bundle inside the APK (e.g., "index.android.bundle").
         * <p>
         * {@link Objects#requireNonNull(Object)} is used to make expectations explicit: in release
         * builds you should have a bundle asset baked in.
         *
         * @return non-null bundle asset name.
         * @throws NullPointerException if the super implementation returns null.
         */
        @NonNull
        @Override
        protected String getBundleAssetName() {
            return Objects.requireNonNull(super.getBundleAssetName());
        }

        /**
         * Toggles RN developer features (e.g., redbox, dev menu, live reloading).
         * <p>
         * Convention: enable dev support only when the app is a debug build <em>and</em> Metro is
         * intended to run. {@code BuildConfig.USE_METRO} lets you ship debug builds without Metro.
         *
         * @return {@code true} to enable dev features; otherwise {@code false}.
         */
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG && BuildConfig.USE_METRO;
        }

        /**
         * Provides a {@link JSExceptionHandler} that forwards uncaught JS exceptions to
         * {@link #handleJSException(Exception)}.
         *
         * @return a handler instance suitable for {@link DefaultReactHost}.
         */
        public JSExceptionHandler getJSExceptionHandler() {
            return this::handleJSException;
        }

        /**
         * Central handler for JS exceptions thrown by the RN runtime.
         * <p>
         * In debug, this prints a stack trace for fast local feedback. In production you can:
         * <ul>
         *   <li>Report to Crashlytics/Sentry</li>
         *   <li>Show a user-friendly fallback UI</li>
         *   <li>Schedule app state cleanup or recovery flows</li>
         * </ul>
         *
         * @param e the exception originating from RN/JS execution.
         * @return {@link Unit#INSTANCE} to satisfy the Kotlin SAM type used by RN defaults.
         */
        public Unit handleJSException(Exception e) {
            if (BuildConfig.DEBUG) {
                e.printStackTrace();
            }
            // TODO: hook crash reporting here for release builds.
            return Unit.INSTANCE;
        }
    }

    /**
     * Single, app-wide React Native host instance. This is the source of truth for both the legacy
     * {@link ReactNativeHost} APIs and the New Architecture {@link ReactHost} bridge.
     */
    private final CustomReactNativeHost rnHost = new CustomReactNativeHost(this);

    /**
     * Creates a {@link ReactHost} (New Architecture) by bridging settings from {@link #rnHost}.
     * <p>
     * Why this exists: {@link DefaultReactHost#getDefaultReactHost} lets you keep one config
     * surface while supporting both old and new APIs. The {@code JSExceptionHandler} passed here
     * funnels JS errors to {@link CustomReactNativeHost#handleJSException(Exception)}.
     *
     * @return a configured {@link ReactHost} ready for fragments/activities to consume.
     */
    @Override
    public ReactHost getReactHost() {
        return DefaultReactHost.getDefaultReactHost(
                this,
                rnHost.getPackages(),
                rnHost.getJSMainModuleName(),
                rnHost.getBundleAssetName(),
                rnHost.getJSBundleFile(),
                null,
                rnHost.getUseDeveloperSupport(),
                new ArrayList<>(),
                rnHost::handleJSException,
                null
        );
    }

    /**
     * Legacy accessor for the {@link ReactNativeHost}. Some RN components still query this in
     * mixed-architecture setups. Keep it in sync with {@link #getReactHost()}.
     *
     * @return the singleton {@link ReactNativeHost} instance.
     */
    @NonNull
    @Override
    public ReactNativeHost getReactNativeHost() {
        return rnHost;
    }

    /**
     * Application initialization hook.
     * <p>
     * Performs the following in order:
     * <ol>
     *   <li>Initialize native SoLoader (required by RN/Skia/JNI libs).</li>
     *   <li>Initialize {@link ChoicelySDK} using the app key from resources.</li>
     *   <li>Register app-specific factories:
     *     <ul>
     *       <li>{@link MyContentFactory} — custom content rendering inside Choicely.</li>
     *       <li>{@link MySplashFactory} — custom splash screen for the app.</li>
     *     </ul>
     *   </li>
     *   <li>If the New Architecture flag is enabled, load its entry point.</li>
     * </ol>
     * <p>
     * Editing tips: If you introduce other native SDKs, keep initialization lightweight and idempotent.
     * Heavy or network-bound work should be deferred to a background initializer.
     */

    private static final String PREFS_DEBUG_SERVER_HOST_KEY = "debug_http_host";

    @Override
    public void onCreate() {
        super.onCreate();

        // 1) Native loader for RN/Skia/JNI-backed libs.
        SoLoaderHelper.INSTANCE.initSoLoader(this);

        // 2) Core Choicely SDK bootstrapping with app key from choicely_config.xml.
        ChoicelySDK.init(this, getResources().getString(R.string.choicely_app_key));

        // 3) Register custom factories to override default content + splash behavior.
        ChoicelySDK.factory().setContentFactory(new MyContentFactory());
        ChoicelySDK.factory().setSplashFactory(new MySplashFactory());

        // 4) Opt into React Native's New Architecture when the build flag is enabled.
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load();
        }

        final SharedPreferences prefs =
                PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        final String host = getString(R.string.debug_rn_host);
        if (TextUtils.getTrimmedLength(host) > 0) {
            prefs.edit()
                    .putString(PREFS_DEBUG_SERVER_HOST_KEY, host)
                    .apply();
        }
    }
}
