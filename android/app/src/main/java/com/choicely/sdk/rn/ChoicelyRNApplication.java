package com.choicely.sdk.rn;

import android.app.Application;

import androidx.annotation.NonNull;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactHost;
import com.facebook.react.ReactNativeApplicationEntryPoint;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.defaults.DefaultReactHost;

import java.util.ArrayList;

public abstract class ChoicelyRNApplication extends Application implements ReactApplication {

    private final ChoicelyRNHost rnHost = createReactNativeHost();

    private ReactHost choicelyReactHost;

    @NonNull
    @Override
    public final synchronized ReactHost getReactHost() {
        if (choicelyReactHost != null) {
            return choicelyReactHost;
        }
        choicelyReactHost = DefaultReactHost.getDefaultReactHost(
                this,
                rnHost.getPackages(),
                rnHost.getJSMainModuleName(),
                rnHost.getBundleAssetName(),
                rnHost.getJSBundleFile(),
                null,
                rnHost.getUseDeveloperSupport(),
                new ArrayList<>(),
                rnHost::onJSException,
                null
        );
        return choicelyReactHost;
    }

    @NonNull
    @Override
    public final ChoicelyRNHost getReactNativeHost() {
        return rnHost;
    }

    @NonNull
    protected abstract ChoicelyRNHost createReactNativeHost();

    protected final synchronized void initRNEngine() {
        ReactNativeApplicationEntryPoint.loadReactNative(this);
    }
}
