package com.choicely.sdk.rn;

import android.content.Context;

import com.facebook.react.ReactHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.defaults.DefaultReactHost;
import com.facebook.react.runtime.BindingsInstaller;
import com.facebook.react.runtime.JSRuntimeFactory;
import com.facebook.react.runtime.cxxreactpackage.CxxReactPackage;

import java.lang.Exception;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class ChoicelyDefaultReactHost {

    private ChoicelyDefaultReactHost() {}

    public static ReactHost getDefaultReactHost(
            Context context,
            List<ReactPackage> packageList,
            String jsMainModulePath,
            String jsBundleAssetPath,
            String jsBundleFilePath,
            JSRuntimeFactory jsRuntimeFactory,
            boolean useDevSupport,
            List<CxxReactPackageProvider> cxxReactPackageProviders,
            ExceptionHandler exceptionHandler,
            BindingsInstaller bindingsInstaller
    ) {
        final List<kotlin.jvm.functions.Function1<ReactContext, CxxReactPackage>> kotlinProviders =
                (cxxReactPackageProviders == null || cxxReactPackageProviders.isEmpty())
                        ? Collections.emptyList()
                        : mapProviders(cxxReactPackageProviders);

        final kotlin.jvm.functions.Function1<Exception, kotlin.Unit> kotlinExceptionHandler =
                ex -> {
                    if (exceptionHandler != null) exceptionHandler.onException(ex);
                    else try {
                        throw ex;
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                    return kotlin.Unit.INSTANCE;
                };

        return DefaultReactHost.getDefaultReactHost(
                context,
                packageList,
                jsMainModulePath,
                jsBundleAssetPath,
                jsBundleFilePath,
                jsRuntimeFactory,
                useDevSupport,
                kotlinProviders,
                kotlinExceptionHandler,
                bindingsInstaller
        );
    }

    /**
     * Public invalidate for brownfield teardown.
     * Calls DefaultReactHost.invalidate() even if Kotlin internal name is mangled.
     */
    public static void invalidate() {
        final Object instance = DefaultReactHost.INSTANCE;
        Method target = null;
        for (Method m : instance.getClass().getDeclaredMethods()) {
            if (m.getParameterCount() == 0 && m.getName().startsWith("invalidate")) {
                target = m;
                break;
            }
        }
        if (target == null) {
            throw new IllegalStateException("Could not find DefaultReactHost.invalidate*() via reflection");
        }
        try {
            target.setAccessible(true);
            target.invoke(instance);
        } catch (Exception e) {
            throw new RuntimeException("Failed to invoke DefaultReactHost.invalidate*()", e);
        }
    }

    public interface CxxReactPackageProvider {
        CxxReactPackage create(ReactContext reactContext);
    }

    public interface ExceptionHandler {
        void onException(Exception e);
    }

    private static List<kotlin.jvm.functions.Function1<ReactContext, CxxReactPackage>> mapProviders(
            List<CxxReactPackageProvider> providers
    ) {
        final ArrayList<kotlin.jvm.functions.Function1<ReactContext, CxxReactPackage>> out =
                new ArrayList<>(providers.size());
        for (CxxReactPackageProvider p : providers) {
            out.add(p::create);
        }
        return out;
    }
}
