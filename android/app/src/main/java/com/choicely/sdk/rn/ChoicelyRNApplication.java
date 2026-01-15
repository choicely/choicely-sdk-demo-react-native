package com.choicely.sdk.rn;

import android.app.Application;

import androidx.annotation.NonNull;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeApplicationEntryPoint;
import com.facebook.react.defaults.DefaultReactHost;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public abstract class ChoicelyRNApplication extends Application implements ReactApplication {

    private ChoicelyRNHost rnHost;

    private final Map<String, ReactHost> choicelyReactHostsByBundlePath = new HashMap<>();

    protected final synchronized void initRNEngine(@NonNull final ChoicelyRNHost rnHost) {
        this.rnHost = rnHost;
        ReactNativeApplicationEntryPoint.loadReactNative(this);
    }

    @NonNull
    @Override
    public final synchronized ReactHost getReactHost() {
        final String bundleFilePath = rnHost.getJSBundleFile();
        final ReactHost cached = choicelyReactHostsByBundlePath.get(bundleFilePath);
        if (cached != null) {
            return cached;
        }
        final ReactHost created = ChoicelyDefaultReactHost.getDefaultReactHost(
                this,
                rnHost.getPackages(),
                rnHost.getJSMainModuleName(),
                rnHost.getBundleAssetName(),
                bundleFilePath,
                null,
                rnHost.getUseDeveloperSupport(),
                new ArrayList<>(),
                rnHost::onJSException,
                null
        );
        ChoicelyDefaultReactHost.invalidate();
        choicelyReactHostsByBundlePath.put(bundleFilePath, created);
        return created;
    }

    @NonNull
    @Override
    public final ChoicelyRNHost getReactNativeHost() {
        return rnHost;
    }
}
