package com.choicely.sdk.rn;

import android.app.Application;
import android.content.Context;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.PackageList;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JSExceptionHandler;
import com.facebook.react.defaults.DefaultReactNativeHost;

import java.io.File;
import java.util.List;
import java.util.Objects;

import kotlin.Unit;

public abstract class ChoicelyRNHost extends DefaultReactNativeHost {

    private static final String BUNDLES_SUBDIR = "rn/bundles";

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
        final File bundleFile = getRemoteBundleFile();
        if (bundleFile.isFile() && bundleFile.canRead() && bundleFile.length() > 0) {
            return bundleFile.getAbsolutePath();
        }
        final String assetName = getBundleAssetName();
        return "assets://" + assetName;
    }

    public File getRemoteBundleFile() {
        final String assetName = getBundleAssetName();
        final Context ctx = getApplication().getApplicationContext();
        return new File(new File(ctx.getFilesDir(), BUNDLES_SUBDIR), assetName);
    }

    @NonNull
    @Override
    public String getBundleAssetName() {
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
