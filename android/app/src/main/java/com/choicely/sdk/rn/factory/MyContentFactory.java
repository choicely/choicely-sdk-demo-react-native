package com.choicely.sdk.rn.factory;

import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;

import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.choicely.sdk.activity.ChoicelyIntentKeys;
import com.choicely.sdk.activity.content.factory.ChoicelyContentFragmentFactory;
import com.choicely.sdk.rn.custom.RNFragmentWrapper;

import java.util.Set;
import java.util.List;

/**
 * App-specific content router that converts Choicely "special" content types
 * into Android {@link Fragment} instances.
 *
 * <h2>What this does</h2>
 * When the Choicely runtime requests a content fragment, this factory:
 * <ol>
 *   <li>Checks the content {@code type}. If it's not {@code "special"}, fall through and let
 *   the default factory chain handle it.</li>
 *   <li>Parses {@link ChoicelyIntentKeys#INTERNAL_URL} from the provided {@link Bundle}.</li>
 *   <li>Interprets path segments to determine a target destination.</li>
 *   <li>For {@code /rn/<ComponentName>} routes, returns a React Native-backed fragment via
 *   {@link RNFragmentWrapper#newReactFragment(String, Bundle, Bundle)}.</li>
 * </ol>
 *
 * <h2>Expected URL shapes</h2>
 * The {@code INTERNAL_URL} is expected to be a well-formed URI with a path that starts
 * with a "special key". Current support:
 * <ul>
 *   <li><b>React Native mount</b>: {@code <scheme>://special/rn/<component_name>}</li>
 * </ul>
 *
 * <h3>Examples</h3>
 * <pre>
 *  // Mount RN component "my_awesome_screen"
 *  choicely://special/rn/my_awesome_screen
 *
 *  // Optionally pass props via other mechanisms (e.g., data Bundle or query params)
 *  choicely://special/rn/checkout
 * </pre>
 *
 * <h2>Extending this router</h2>
 * Add more {@code specialKey} branches (e.g., {@code "web"}, {@code "promo"}, etc.) by
 * reading additional path segments and returning the appropriate Fragment.
 */
public class MyContentFactory extends ChoicelyContentFragmentFactory {

    /**
     * Attempts to create an app-specific content fragment for the given parameters.
     *
     * @param context      Android context (do not stash; use only for light operations).
     * @param type         Logical content type requested by Choicely (e.g., {@code "special"}).
     * @param internalUri  Optional parsed URI already provided by upstream code (may be {@code null}).
     * @param data         Extra arguments. Expects {@link ChoicelyIntentKeys#INTERNAL_URL} when {@code type == "special"}.
     * @return A configured {@link Fragment} if this factory recognizes the route; otherwise {@code null}.
     */
    @Nullable
    @Override
    protected Fragment makeAppContentFragment(Context context, String type, @Nullable Uri internalUri, Bundle data) {
        // Only handle our custom "special" type. Let other factories handle everything else.
        if (!"special".equals(type)) return null;

        // Prefer INTERNAL_URL from data; this is how Choicely passes internal deep links.
        final String internalUrl = data.getString(ChoicelyIntentKeys.INTERNAL_URL);
        if (TextUtils.isEmpty(internalUrl)) return null;

        // Parse the URI to inspect its path segments (e.g., /rn/<ComponentName>).
        final Uri uri = Uri.parse(internalUrl);
        if (uri == null) return null;

        final List<String> pathSegments = uri.getPathSegments();
        if (pathSegments == null || pathSegments.isEmpty()) return null;

        // The first segment is the "special key" that selects a sub-router (e.g., "rn").
        final String specialKey = pathSegments.get(0);
        if (TextUtils.isEmpty(specialKey)) return null;

        // Sub-route: React Native component mount → /rn/<ComponentName>
        if ("rn".equals(specialKey)) {
            final String rnComponentName = pathSegments.size() > 1 ? pathSegments.get(1) : null;
            if (TextUtils.isEmpty(rnComponentName)) return null;

            // Props for the RN component (fill this if you want to pass initial props).
            final Bundle reactProps = new Bundle();
            final Set<String> queryKeys = uri.getQueryParameterNames();
            if (queryKeys != null && !queryKeys.isEmpty()) {
                for (final String key : queryKeys) {
                    if (TextUtils.isEmpty(key)) continue;
                    final String value = uri.getQueryParameter(key);
                    if (value != null) {
                        reactProps.putString(key, value);
                    }
                }
            }
            // Extra fragment args for the wrapper (e.g., flags for lifecycle/back handling).
            final Bundle fragmentArgs = new Bundle();

            // Create a React-backed fragment that renders the requested component.
            return RNFragmentWrapper.newReactFragment(
                    rnComponentName,
                    reactProps,
                    fragmentArgs
            );
        }

        // Not a recognized special route; allow other factories to try.
        return null;
    }
}
