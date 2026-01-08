# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

-keep,allowobfuscation @interface com.facebook.jni.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip

-keepclassmembers class * {
  @com.facebook.jni.annotations.DoNotStrip *;
}
-keepclassmembers class * {
  @com.facebook.proguard.annotations.DoNotStrip *;
}
# --- RN Inspector JNI hard-requirements ---
# Native code expects this exact field name to exist on this class.
-keep class com.facebook.react.devsupport.CxxInspectorPackagerConnection { *; }
-keep class com.facebook.react.devsupport.CxxInspectorPackagerConnection$WebSocketDelegate { *; }

-keepclassmembers class com.facebook.react.devsupport.CxxInspectorPackagerConnection$WebSocketDelegate {
    com.facebook.jni.HybridData mHybridData;
}

-keep class com.facebook.jni.HybridData { *; }
-keep class com.facebook.react.packagerconnection.** { *; }
