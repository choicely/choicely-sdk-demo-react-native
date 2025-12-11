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

public class ChoicelyReactNativeHost extends DefaultReactNativeHost {

    private final String devServerPath;

    public ChoicelyReactNativeHost(
            @NonNull final Application application,
            @NonNull String devServerPath
    ) {
        super(application);
        this.devServerPath = devServerPath;
    }

    @NonNull
    @Override
    public List<ReactPackage> getPackages() {
        return new PackageList(this).getPackages();
    }

    @NonNull
    @Override
    public String getJSMainModuleName() {
        return this.devServerPath;
    }

    @Nullable
    @Override
    public String getJSBundleFile() {
        return super.getJSBundleFile();
    }

    @NonNull
    @Override
    public String getBundleAssetName() {
        return Objects.requireNonNull(super.getBundleAssetName());
    }

    @Override
    public boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG && BuildConfig.USE_METRO;
    }

    public JSExceptionHandler getJSExceptionHandler() {
        return this::handleJSException;
    }

    public Unit handleJSException(final Exception e) {
        if (BuildConfig.DEBUG) {
            e.printStackTrace();
        }
        // TODO: hook crash reporting here for release builds.
        return Unit.INSTANCE;
    }
}
