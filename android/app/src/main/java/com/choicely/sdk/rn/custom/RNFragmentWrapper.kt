package com.choicely.sdk.rn.custom

import android.os.Bundle
import androidx.core.os.bundleOf
import com.facebook.react.ReactFragment
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

/**
 * Thin utility around [ReactFragment] that lets you:
 * - instantiate an RN fragment with a specific JS component and initial props
 * - pass extra fragment arguments (e.g., UI flags) without polluting RN launch options
 * - safely bridge fragment lifecycle into the React Host lifecycle
 *
 * ## How it works
 * - Use [newReactFragment] (or [CustomReactFragment.newInstance]) to provide:
 *   - `componentName`: the JS component registered via `AppRegistry.registerComponent`
 *   - `props`: initial props delivered to JS as `initialProperties`
 *   - `fragmentArgs`: extra Android-only args you want to stash on the Fragment
 * - We set [ReactFragment] argument keys:
 *   - [ReactFragment.ARG_COMPONENT_NAME] — which component to render
 *   - [ReactFragment.ARG_LAUNCH_OPTIONS] — initial props Bundle
 *   - [ReactFragment.ARG_DISABLE_HOST_LIFECYCLE_EVENTS] — forces the wrapper to drive lifecycle,
 *     which prevents conflicts when this Fragment lives inside a host Activity we don’t control
 *
 * ## Back press
 * Implements [DefaultHardwareBackBtnHandler]. If JS doesn’t handle the back press,
 * [invokeDefaultOnBackPressed] is called. Override to delegate to your Activity or
 * to your own navigation if needed.
 */
object RNFragmentWrapper {

    /**
     * Key used to store additional Fragment-only arguments in [Bundle] arguments.
     *
     * These are NOT consumed by React Native. Use this to pass flags your wrapper UI might need
     * (e.g., custom transitions, toolbar visibility, etc.).
     */
    const val FRAGMENT_ARGS: String = "fragment_args"

    /**
     * Fragment that hosts a single React Native component.
     *
     * Responsibilities:
     * - Provide a simple, argument-driven constructor for RN
     * - Bridge Fragment lifecycle events into the React Host to keep RN mounted correctly
     * - Expose a hook for default back press behavior when JS doesn’t handle it
     */
    class CustomReactFragment :
        ReactFragment(),
        DefaultHardwareBackBtnHandler {

        /**
         * Stashes the fully prepared arguments Bundle used to configure [ReactFragment].
         *
         * We build this in [newInstance] so callers don’t have to juggle RN’s internal keys.
         */
        private lateinit var reactArgs: Bundle

        // ---- args helpers (so you can pass component + props) ----
        companion object {
            /**
             * Creates a new [CustomReactFragment] configured to render a specific RN component.
             *
             * @param componentName Name registered via `AppRegistry.registerComponent("<name>", ...)`.
             * @param props Initial props delivered to JS as `initialProperties`. Keep parcel-friendly.
             * @param fragmentArgs Extra, Android-only Fragment args (NOT read by RN).
             *
             * @return A [CustomReactFragment] with arguments prepared for [ReactFragment].
             *
             * ### Notes
             * - We set [ReactFragment.ARG_DISABLE_HOST_LIFECYCLE_EVENTS] to `true` so this fragment
             *   manually forwards lifecycle to RN. This avoids conflicts with host Activity lifecycles
             *   (useful when the Activity is owned by a library).
             */
            fun newInstance(
                componentName: String,
                props: Bundle,
                fragmentArgs: Bundle
            ) = CustomReactFragment().apply {
                reactArgs = bundleOf(
                    ARG_COMPONENT_NAME to componentName,
                    ARG_LAUNCH_OPTIONS to props,
                    // Must be set to avoid conflicts with Activity lifecycle events!
                    ARG_DISABLE_HOST_LIFECYCLE_EVENTS to true,
                    FRAGMENT_ARGS to fragmentArgs,
                )
            }
        }

        /**
         * Injects our prepared arguments into the base [ReactFragment] before super.onCreate.
         *
         * We intentionally override any Activity-provided arguments to ensure RN receives
         * the exact component name and props we were created with.
         */
        override fun onCreate(savedInstanceState: Bundle?) {
            // Overrides Activity arguments with Fragment arguments!
            arguments = reactArgs
            super.onCreate(savedInstanceState)
        }

        /**
         * Forwards onResume to the React Host so RN knows the host is active/foregrounded.
         *
         * If the host is missing (shouldn’t happen under normal setup), we no-op.
         */
        override fun onResume() {
            super.onResume()
            if (reactDelegate.reactHost != null) {
                reactDelegate.reactHost?.onHostResume(context as android.app.Activity, this)
            }
        }

        /**
         * Forwards onPause to the React Delegate so RN can pause timers, animations, etc.
         */
        override fun onPause() {
            super.onPause()
            reactDelegate.onHostPause()
        }

        /**
         * Forwards onDestroy to the React Delegate so RN can clean up surfaces and modules.
         */
        override fun onDestroy() {
            super.onDestroy()
            reactDelegate.onHostDestroy()
        }

        /**
         * Called by React Native when JS did not handle the hardware back press.
         *
         * Default is no-op. Typical implementations:
         * - `requireActivity().onBackPressedDispatcher.onBackPressed()`
         * - Notify your navigation controller (if you host your own back stack)
         */
        override fun invokeDefaultOnBackPressed() {
            // No-op by default. Override if you want native back navigation here.
        }
    }

    /**
     * Convenience factory method that mirrors [CustomReactFragment.newInstance].
     *
     * Prefer this from Java call sites or when you want a stable API surface on the wrapper.
     *
     * @param componentName Name registered via `AppRegistry.registerComponent(...)`.
     * @param props Initial props provided to the RN component.
     * @param fragmentArgs Extra Fragment-only arguments (not consumed by RN).
     *
     * @return A [ReactFragment] that renders the given RN component.
     */
    @JvmStatic
    fun newReactFragment(
        componentName: String,
        props: Bundle,
        fragmentArgs: Bundle
    ): ReactFragment {
        return CustomReactFragment.newInstance(componentName, props, fragmentArgs)
    }
}
