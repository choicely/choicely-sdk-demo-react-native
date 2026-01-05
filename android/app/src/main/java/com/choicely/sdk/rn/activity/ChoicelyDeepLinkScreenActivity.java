package com.choicely.sdk.rn.activity;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.choicely.sdk.activity.ChoicelyIntentKeys;
import com.choicely.sdk.activity.content.ChoicelyScreenActivity;
import com.choicely.sdk.util.engine.ChoicelyUtil;
import com.choicely.sdk.util.engine.LinkEngine;

public class ChoicelyDeepLinkScreenActivity extends ChoicelyScreenActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        seedChoicelyExtrasFromDeepLink(getIntent());
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onNewIntent(@NonNull Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        seedChoicelyExtrasFromDeepLink(intent);
    }

    private static void seedChoicelyExtrasFromDeepLink(Intent intent) {
        if (intent == null) return;
        final Uri uri = intent.getData();
        if (uri == null) return;
        if (!TextUtils.isEmpty(intent.getStringExtra(ChoicelyIntentKeys.CHOICELY_CONTENT_TYPE)))
            return;
        if (intent.hasExtra(ChoicelyIntentKeys.DATA_BUNDLE)) return;
        final String url = uri.toString();
        final LinkEngine link = ChoicelyUtil.link(url);
        final Bundle b = new Bundle();
        b.putAll(link.getData());
        b.putString(ChoicelyIntentKeys.INTERNAL_URL, url);
        intent.putExtra(ChoicelyIntentKeys.DATA_BUNDLE, b);
        final String type = link.getType();
        if (!TextUtils.isEmpty(type)) {
            intent.putExtra(ChoicelyIntentKeys.CHOICELY_CONTENT_TYPE, type);
        }
    }
}
