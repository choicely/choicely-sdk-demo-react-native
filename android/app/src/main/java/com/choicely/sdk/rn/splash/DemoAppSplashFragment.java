package com.choicely.sdk.rn.splash;

import android.os.Bundle;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.choicely.sdk.activity.splash.AbstractSplashFragment;
import com.choicely.sdk.rn.R;

/**
 * Demo splash screen fragment that plugs into Choicely’s splash lifecycle.
 * <p>
 * This class:
 * <ul>
 *   <li>Inflates a static splash layout via {@link #getLayout()}.</li>
 *   <li>Runs custom splash logic in {@link #updateSplash()} right after the view is created.</li>
 *   <li>Controls how long the splash is visible via {@link #getSplashDuration()}.</li>
 * </ul>
 *
 * <h2>How to customize</h2>
 * <ul>
 *   <li>Replace {@code R.layout.fragment_splash} with your own layout (animations, brand art, etc.).</li>
 *   <li>Add timers/animations/async warmups inside {@link #updateSplash()}.</li>
 *   <li>Tune {@link #getSplashDuration()} to match your animation length (in milliseconds).</li>
 * </ul>
 *
 * <h2>LLM editing tips</h2>
 * - Keep work in {@link #updateSplash()} side-effectful but quick; expensive I/O should be deferred.
 * - If you need to observe lifecycle, prefer {@link #onLayoutCreated(View, Bundle)} (already hooked) or standard fragment callbacks.
 * - Navigation off the splash (if needed) should happen after duration or when your warmup completes.
 */
public class DemoAppSplashFragment extends AbstractSplashFragment {

    /**
     * Provides the layout resource ID for the splash screen.
     * <p>
     * This layout should be lightweight and render instantly (no blocking work in inflation).
     *
     * @return the layout resource ID to inflate for this splash.
     */
    @Override
    protected int getLayout() {
        return R.layout.fragment_splash;
    }

    /**
     * Called after the splash layout has been inflated and attached.
     * <p>
     * We delegate to {@link #updateSplash()} to run any custom initialization (animations,
     * preloading hints, starting a logo Lottie, etc.).
     *
     * @param layout the root view of the inflated splash layout.
     * @param savedInstanceState previously saved state, if any.
     */
    @Override
    protected void onLayoutCreated(@NonNull View layout, @Nullable Bundle savedInstanceState) {
        super.onLayoutCreated(layout, savedInstanceState);
        updateSplash();
    }

    /**
     * Hook for custom splash behavior.
     * <p>
     * Examples:
     * <ul>
     *   <li>Start an animation or progress indicator.</li>
     *   <li>Kick off a lightweight preload (no network blocking here please).</li>
     *   <li>Bind views or set accessibility labels.</li>
     * </ul>
     * Keep this non-blocking; the actual visibility time is governed by {@link #getSplashDuration()}.
     */
    private void updateSplash() {
        // Intentionally empty; add animation starts or quick view setup here.
    }

    /**
     * Controls how long (in milliseconds) the splash stays visible before continuing.
     * <p>
     * This implementation holds for 600ms, which is a snappy “brand flash” that won’t feel laggy.
     * Tune to match the length of your splash animation (generally 400–1200ms feels crisp).
     *
     * @return duration in milliseconds for the splash screen.
     */
    @Override
    protected long getSplashDuration() {
        return 600L;
    }
}
