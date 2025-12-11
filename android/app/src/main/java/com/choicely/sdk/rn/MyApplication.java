package com.choicely.sdk.rn;

import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.choicely.sdk.ChoicelySDK;
import com.choicely.sdk.rn.factory.MyContentFactory;
import com.choicely.sdk.rn.factory.MySplashFactory;

public class MyApplication extends ChoicelyRNApplication {

    @NonNull
    @Override
    protected ChoicelyRNHost createReactNativeHost() {
        return new ChoicelyRNHost(this) {
            @NonNull
            @Override
            public String getJSMainModuleName() {
                return "src/index";
            }
        };
    }

    @Override
    public void onCreate() {
        super.onCreate();
        this.initRNEngine();
        ChoicelyRNConfig.setServerDebug(ChoicelyRNConfig.loadValue("rn_host_dev", R.string.rn_host_dev, this), this);
        final String appKey = ChoicelyRNConfig.loadValue("choicely_app_key", R.string.choicely_app_key, this);
        if (TextUtils.getTrimmedLength(appKey) > 0) {
            this.initChoicely(appKey);
        }
    }

    private synchronized void initChoicely(@NonNull final String appKey) {
        // Core Choicely SDK bootstrapping with app key
        ChoicelySDK.init(this, appKey);
        // Register custom factories to override default content + splash behavior
        ChoicelySDK.factory().setContentFactory(new MyContentFactory());
        ChoicelySDK.factory().setSplashFactory(new MySplashFactory());
        // Load Choicely React Native configuration.
        ChoicelyRNConfig.refresh(appKey, this);
    }
}
