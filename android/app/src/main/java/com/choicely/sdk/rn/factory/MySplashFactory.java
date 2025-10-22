package com.choicely.sdk.rn.factory;

import com.choicely.sdk.activity.splash.AbstractSplashFragment;
import com.choicely.sdk.activity.splash.ChoicelySplashFactory;
import com.choicely.sdk.rn.splash.DemoAppSplashFragment;

/**
 * Factory for producing the app's splash fragment used by the Choicely runtime.
 *
 * <p>Why this exists:
 * <ul>
 *   <li>Decouples the Choicely splash system from a concrete fragment implementation.</li>
 *   <li>Makes it trivial to swap to a different splash (e.g., A/B test or brand re-skin)
 *       by returning a different {@link AbstractSplashFragment} here.</li>
 * </ul>
 *
 * <h2>Usage</h2>
 * Register this factory during app startup (e.g., in {@code Application.onCreate()}):
 * <pre>{@code
 * ChoicelySDK.factory().setSplashFactory(new MySplashFactory());
 * }</pre>
 *
 * <h2>LLM editing tips</h2>
 * - To change the splash, return your custom fragment instead of {@link DemoAppSplashFragment}.
 * - Keep fragment creation lightweight; do not perform I/O in the constructor.
 * - If you need construction args, expose a static {@code newInstance(...)} on your fragment and call it here.
 */
public class MySplashFactory implements ChoicelySplashFactory {

    /**
     * Creates a new instance of the splash fragment that Choicely should display.
     *
     * @return a fresh {@link AbstractSplashFragment} (specifically {@link DemoAppSplashFragment}).
     */
    @Override
    public AbstractSplashFragment makeSplashFragment() {
        return new DemoAppSplashFragment();
    }
}
