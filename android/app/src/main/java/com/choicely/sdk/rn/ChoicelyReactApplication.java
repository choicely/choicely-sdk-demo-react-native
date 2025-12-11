package com.choicely.sdk.rn;

import android.app.Application;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeApplicationEntryPoint;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.defaults.DefaultReactHost;

import java.util.ArrayList;

public class ChoicelyReactApplication extends Application implements ReactApplication {

    private static final String PREFS_DEBUG_SERVER_HOST_KEY = "debug_http_host";
    protected final ChoicelyReactNativeHost rnHost = new ChoicelyReactNativeHost(
            this,
            "src/index"
    );

    private SharedPreferences rnPrefs;

    @NonNull
    @Override
    public final ReactHost getReactHost() {
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

    @NonNull
    @Override
    public final ReactNativeHost getReactNativeHost() {
        return rnHost;
    }

    public void initRNEngine() {
        ReactNativeApplicationEntryPoint.loadReactNative(this);
    }

    public void setDebugHost(final String host) {
        final boolean isDev = rnHost.getUseDeveloperSupport();
        if (!isDev) {
            return;
        }
        if (this.rnPrefs == null) {
            this.rnPrefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        }
        if (TextUtils.getTrimmedLength(host) > 0) {
            this.rnPrefs.edit()
                    .putString(PREFS_DEBUG_SERVER_HOST_KEY, host)
                    .apply();
        }
    }
}
