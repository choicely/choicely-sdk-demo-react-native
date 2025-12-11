package com.choicely.sdk.rn;

import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.choicely.sdk.ChoicelySDK;
import com.choicely.sdk.rn.factory.MyContentFactory;
import com.choicely.sdk.rn.factory.MySplashFactory;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class MyApplication extends ChoicelyReactApplication {

    private static final String CHOICELY_CONFIG_FILE = "choicely_config.json";

    @Override
    public void onCreate() {
        super.onCreate();
        this.setDebugHost(loadConfigFromAssets("rn_host_dev", R.string.rn_host_dev));
        this.initRNEngine();
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
                    this.setDebugHost(customData.optString("bundle_url_mobile", ""));
                }).onError((errorCode, message) -> {
                }).getData();
    }

    private void initChoicely(@NonNull final String appKey) {
        // Core Choicely SDK bootstrapping with app key.
        ChoicelySDK.init(this, appKey);
        // Register custom factories to override default content + splash behavior.
        ChoicelySDK.factory().setContentFactory(new MyContentFactory());
        ChoicelySDK.factory().setSplashFactory(new MySplashFactory());
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
}
