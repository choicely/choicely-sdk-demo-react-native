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

    private static SharedPreferences rnPrefs;

    @NonNull
    public static synchronized String loadValue(
            @Nullable final String assetKey,
            final int defaultResId,
            @NonNull Context context
    ) {
        if (assetKey != null) {
            try (InputStream is = context.getAssets().open(CHOICELY_CONFIG_FILE);
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
        }
        return context.getResources().getString(defaultResId);
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

    public static synchronized void setServerDebug(@Nullable final String host, @NonNull ChoicelyRNApplication app) {
        final boolean isDev = app.getReactNativeHost().getUseDeveloperSupport();
        if (!isDev) {
            return;
        }
        if (rnPrefs == null) {
            rnPrefs = PreferenceManager.getDefaultSharedPreferences(app);
        }
        if (TextUtils.getTrimmedLength(host) > 0) {
            rnPrefs.edit()
                    .putString(PREFS_DEBUG_SERVER_HOST_KEY, host)
                    .apply();
        }
    }
}
