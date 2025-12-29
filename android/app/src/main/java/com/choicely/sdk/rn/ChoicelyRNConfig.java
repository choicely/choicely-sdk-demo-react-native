package com.choicely.sdk.rn;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.text.TextUtils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.choicely.sdk.ChoicelySDK;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;


public final class ChoicelyRNConfig {

    private static final String PREFS_PROD_VERSION_KEY = "bundle_version_name";
    private static final String PREFS_DEBUG_SERVER_HOST_KEY = "debug_http_host";
    private static final String CHOICELY_CONFIG_FILE = "choicely_config.json";

    @Nullable
    private static JSONObject cachedConfigJson;
    @Nullable
    private static SharedPreferences rnPrefs;

    @NonNull
    public static String loadValue(
            @Nullable final String assetKey,
            final int defaultResId,
            @NonNull final Context context
    ) {
        String value = null;
        if (assetKey != null) {
            value = loadFromAssets(assetKey, context);
        }
        if (value == null) {
            value = context.getResources().getString(defaultResId);
        }
        return value;
    }

    @Nullable
    public static String loadFromAssets(
            @NonNull final String assetKey,
            @NonNull final Context context
    ) {
        loadConfigFromAssetsIfNeeded(context.getApplicationContext());
        if (cachedConfigJson != null) {
            final String value = cachedConfigJson.optString(assetKey, "");
            if (TextUtils.getTrimmedLength(value) > 0) {
                return value;
            }
        }
        return null;
    }

    private static synchronized void loadConfigFromAssetsIfNeeded(@NonNull final Context context) {
        if (cachedConfigJson != null) {
            return;
        }
        try (final InputStream is = context.getAssets().open(CHOICELY_CONFIG_FILE);
             final BufferedReader reader = new BufferedReader(
                     new InputStreamReader(is, StandardCharsets.UTF_8)
             )) {
            final StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            cachedConfigJson = new JSONObject(sb.toString());
        } catch (IOException | JSONException e) {
            cachedConfigJson = null;
        }
    }

    public static synchronized void refresh(@NonNull final String appKey, @NonNull final ChoicelyRNApplication app) {
        ChoicelySDK.data().getChoicelyAppData(appKey)
                .onData((appData) -> {
                    if (appData == null) {
                        return;
                    }
                    final JSONObject customData = appData.getCustomDataJson();
                    if (customData == null) {
                        return;
                    }
                    setServerDebug(customData.optString("bundle_url_mobile", ""), app);
                    setServerProd(customData.optString("full_version_name", ""), app, appKey);
                }).onError((errorCode, message) -> {
                }).getData();
    }

    public static synchronized void setServerDebug(
            @Nullable final String host,
            @NonNull final ChoicelyRNApplication app
    ) {
        final boolean isDev = app.getReactNativeHost().getUseDeveloperSupport();
        if (!isDev) {
            return;
        }
        if (rnPrefs == null) {
            rnPrefs = PreferenceManager.getDefaultSharedPreferences(app);
        }
        if (TextUtils.getTrimmedLength(host) <= 0) {
            return;
        }
        String normalized = host.trim();
        normalized = normalized.replaceFirst("(?i)^https?://", "");
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        if (normalized.isEmpty()) {
            return;
        }
        rnPrefs.edit()
                .putString(PREFS_DEBUG_SERVER_HOST_KEY, normalized)
                .apply();
    }


    private static synchronized void setServerProd(
            @Nullable final String versionName,
            @NonNull final ChoicelyRNApplication app,
            @NonNull final String appKey
    ) {
        final boolean isDev = app.getReactNativeHost().getUseDeveloperSupport();
        if (isDev) {
            return;
        }
        if (TextUtils.getTrimmedLength(versionName) <= 0) {
            return;
        }
        if (rnPrefs == null) {
            rnPrefs = PreferenceManager.getDefaultSharedPreferences(app);
        }
        final String lastVersion = rnPrefs.getString(PREFS_PROD_VERSION_KEY, "");
        final String bundleAssetName = app.getReactNativeHost().getBundleAssetName();
        final File destFile = app.getReactNativeHost().getRemoteBundleFile();
        if (versionName.equals(lastVersion) && destFile.isFile() && destFile.canRead() && destFile.length() > 0) {
            return;
        }
        final String bundleUrl = app.getString(
                R.string.choicely_rn_bundles_url,
                appKey,
                app.getString(R.string.choicely_rn_platform),
                versionName,
                bundleAssetName
        );
        java.util.concurrent.ExecutorService exec =
                java.util.concurrent.Executors.newSingleThreadExecutor();
        exec.execute(() -> {
            final boolean bundleUpdateOk = ChoicelyRemoteBundle.download(bundleUrl, destFile, false).join();
            if (!bundleUpdateOk) {
                return;
            }
            rnPrefs.edit()
                    .putString(PREFS_PROD_VERSION_KEY, versionName)
                    .apply();
            // If you need UI changes:
//            new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
//            });
        });
    }
}
