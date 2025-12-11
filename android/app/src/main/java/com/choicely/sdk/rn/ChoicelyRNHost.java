package com.choicely.sdk.rn;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.PackageList;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JSExceptionHandler;
import com.facebook.react.defaults.DefaultReactNativeHost;

import java.util.List;
import java.util.Objects;

import kotlin.Unit;

public abstract class ChoicelyRNHost extends DefaultReactNativeHost {

    public ChoicelyRNHost(
            @NonNull final Application application
    ) {
        super(application);
    }

    @NonNull
    @Override
    public abstract String getJSMainModuleName();

    public Unit onJSException(final Exception e) {
        if (BuildConfig.DEBUG) {
            e.printStackTrace();
        }
        // TODO: hook crash reporting here for release builds.
        return Unit.INSTANCE;
    }

    @Override
    public boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG && BuildConfig.USE_METRO;
    }

    @Nullable
    @Override
    protected String getJSBundleFile() {
        return super.getJSBundleFile();
    }

    @NonNull
    @Override
    protected String getBundleAssetName() {
        return Objects.requireNonNull(super.getBundleAssetName());
    }


    @Nullable
    protected JSExceptionHandler getJSExceptionHandler() {
        return this::onJSException;
    }

    @NonNull
    @Override
    protected List<ReactPackage> getPackages() {
        return new PackageList(this).getPackages();
    }
}
