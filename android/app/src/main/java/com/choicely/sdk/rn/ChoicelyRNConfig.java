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
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;


public final class ChoicelyRNConfig {

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

    public static synchronized void refresh(@NonNull String appKey, @NonNull ChoicelyRNApplication app) {
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
                }).onError((errorCode, message) -> {
                }).getData();
    }

    public static synchronized void setServerDebug(
            @Nullable final String host,
            @NonNull ChoicelyRNApplication app
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
}
