package com.choicely.sdk.rn;

import android.app.Application;
import android.content.Context;
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

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
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
        @NonNull
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
            return "src/index";
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

    private static final String CHOICELY_CONFIG_FILE = "choicely_config.json";
    private static final String PREFS_DEBUG_SERVER_HOST_KEY = "debug_http_host";

    private SharedPreferences rnPrefs;

    /**
     * Application initialization hook.
     *
     * <p>Performs the following in order:
     * <ol>
     *   <li>Resolve the default React Native dev host:
     *     <ul>
     *       <li>Reads the <code>rn_host_dev</code> value from {@value #CHOICELY_CONFIG_FILE} in assets.</li>
     *       <li>Falls back to <code>R.string.rn_host_dev</code> if the key is missing or invalid.</li>
     *       <li>Stores the resolved value into the default {@link SharedPreferences} under
     *           <code>{@value #PREFS_DEBUG_SERVER_HOST_KEY}</code> so RN can use it as the debug HTTP host.</li>
     *     </ul>
     *   </li>
     *
     *   <li>Initialize {@link ChoicelySDK} with the app key:
     *     <ul>
     *       <li>Reads <code>choicely_app_key</code> from {@value #CHOICELY_CONFIG_FILE} in assets.</li>
     *       <li>Falls back to <code>R.string.choicely_app_key</code> if the config file does not provide it.</li>
     *       <li>Calls {@link ChoicelySDK#init(Context, String)} with the resolved key.</li>
     *     </ul>
     *   </li>
     *
     *   <li>Fetch dynamic app data and refine the RN bundle host:
     *     <ul>
     *       <li>Loads app data for the current app key via {@link ChoicelySDK#data()}.</li>
     *       <li>Reads the <code>customData</code> JSON from the app data (if present).</li>
     *       <li>Looks up <code>bundle_url_mobile</code> from <code>customData</code>.</li>
     *       <li>If a non-empty <code>bundle_url_mobile</code> is found, overwrites the stored debug host in
     *           {@link SharedPreferences}; otherwise, keeps the static <code>rn_host_dev</code> value.</li>
     *     </ul>
     *   </li>
     *
     *   <li>Register app-specific factories with the Choicely SDK:
     *     <ul>
     *       <li>{@link MyContentFactory} — custom content rendering inside Choicely.</li>
     *       <li>{@link MySplashFactory} — custom splash screen for the app.</li>
     *     </ul>
     *   </li>
     *
     *   <li>Initialize native loading for React Native / Skia / JNI-backed libraries via
     *       {@code SoLoaderHelper.INSTANCE.initSoLoader(this)}.</li>
     *
     *   <li>If the New Architecture flag is enabled ({@code BuildConfig.IS_NEW_ARCHITECTURE_ENABLED}),
     *       load its entry point via {@link DefaultNewArchitectureEntryPoint#load()}.</li>
     * </ol>
     *
     * <p><b>Debug host resolution order</b>:
     * <ol>
     *   <li>Static <code>rn_host_dev</code> from assets / resources.</li>
     *   <li>Dynamic <code>bundle_url_mobile</code> from the app’s <code>customData</code> (overrides the static
     *       value when available).</li>
     * </ol>
     *
     * <p>Editing tips:
     * <ul>
     *   <li>Keep this initialization path lightweight and idempotent; it runs on the main thread.</li>
     *   <li>Push heavy, I/O-bound, or network-bound work into background initializers or feature-specific
     *       components.</li>
     *   <li>If you add new configuration sources or flags that affect the RN host, keep the resolution order
     *       in sync with this Javadoc so future readers don’t get lost.</li>
     * </ul>
     */
    @Override
    public void onCreate() {
        super.onCreate();
        final boolean isDev = rnHost.getUseDeveloperSupport();
        if (isDev) {
            this.rnPrefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
            setDebugHost(loadConfigFromAssets("rn_host_dev", R.string.rn_host_dev), rnPrefs);
        }
        final String appKey = loadConfigFromAssets("choicely_app_key", R.string.choicely_app_key);
        initChoicely(appKey);
        ChoicelySDK.data().getChoicelyAppData(appKey)
                .onData((appData) -> {
                    if (appData == null) {
                        return;
                    }
                    final JSONObject customData = appData.getCustomDataJson();
                    if (customData == null) {
                        return;
                    }
                    if (isDev) {
                        setDebugHost(customData.optString("bundle_url_mobile", ""), rnPrefs);
                    }
                }).onError((errorCode, message) -> {
                }).getData();
        initRNEngine();
    }

    private void initChoicely(@NonNull final String appKey) {
        // Core Choicely SDK bootstrapping with app key.
        ChoicelySDK.init(this, appKey);
        // Register custom factories to override default content + splash behavior.
        ChoicelySDK.factory().setContentFactory(new MyContentFactory());
        ChoicelySDK.factory().setSplashFactory(new MySplashFactory());
    }

    private void initRNEngine() {
        // Native loader for RN/Skia/JNI-backed libs.
        SoLoaderHelper.INSTANCE.initSoLoader(this);
        // Opt into React Native's New Architecture when the build flag is enabled.
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            DefaultNewArchitectureEntryPoint.load();
        }
    }

    private String loadConfigFromAssets(@NonNull final String assetKey, final int defaultResId) {
        try (InputStream is = this.getAssets().open(CHOICELY_CONFIG_FILE);
             final BufferedReader reader = new BufferedReader(
                     new InputStreamReader(is, StandardCharsets.UTF_8))) {
            final StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            final JSONObject json = new JSONObject(sb.toString());
            final String appKey = json.getString(assetKey);
            if (TextUtils.getTrimmedLength(appKey) > 0) {
                return appKey;
            }
        } catch (IOException | JSONException e) {
        }
        return getResources().getString(defaultResId);
    }

    private static void setDebugHost(final String host, final SharedPreferences prefs) {
        if (TextUtils.getTrimmedLength(host) > 0) {
            prefs.edit()
                    .putString(PREFS_DEBUG_SERVER_HOST_KEY, host)
                    .apply();
        }
    }
}
