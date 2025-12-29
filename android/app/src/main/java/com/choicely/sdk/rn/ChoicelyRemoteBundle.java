package com.choicely.sdk.rn;

import androidx.annotation.NonNull;

import com.choicely.sdk.service.log.QLog;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

@SuppressWarnings("ResultOfMethodCallIgnored")
public final class ChoicelyRemoteBundle {
    private static final String TAG = "ChoicelyRemoteBundle";

    private static final OkHttpClient HTTP = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .callTimeout(90, TimeUnit.SECONDS)
            .build();

    private static final AtomicLong LAST_TOKEN = new AtomicLong(0);

    /**
     * Starts an async download into a unique temp file.
     * Only the most recent call to this method is allowed to commit the final rename.
     */
    public static synchronized void downloadToFileAsync(@NonNull final String url, @NonNull final File destFile) {
        final File parent = destFile.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) {
            QLog.e(TAG, "Bundle download failed: could not create dir " + parent);
        }
        final long token = System.nanoTime();
        LAST_TOKEN.set(token);
        final String tmpName = destFile.getName()
                + "."
                + Integer.toHexString(ThreadLocalRandom.current().nextInt())
                + "-"
                + Long.toHexString(token)
                + ".tmp";
        final File tmp = new File(parent, tmpName);
        final Request req = new Request.Builder().url(url).get().build();
        HTTP.newCall(req).enqueue(new Callback() {
            @Override
            public void onFailure(@NonNull final Call call, @NonNull final java.io.IOException e) {
                QLog.e(e, TAG, "Bundle download failed");
                tmp.delete();
            }

            @Override
            public void onResponse(@NonNull final Call call, @NonNull final Response response) {
                try (response) {
                    if (!response.isSuccessful()) {
                        QLog.e(TAG, "Bundle download failed: HTTP " + response.code());
                        tmp.delete();
                        return;
                    }
                    final ResponseBody body = response.body();
                    try (final InputStream in = body.byteStream();
                         final FileOutputStream out = new FileOutputStream(tmp, false)) {
                        final byte[] buf = new byte[64 * 1024];
                        int n;
                        while ((n = in.read(buf)) != -1) {
                            out.write(buf, 0, n);
                        }
                        out.getFD().sync();
                    }
                    if (LAST_TOKEN.get() != token) {
                        tmp.delete();
                        return;
                    }
                    if (destFile.exists() && !destFile.delete()) {
                        QLog.e(TAG, "Bundle download failed: could not delete old file " + destFile);
                        tmp.delete();
                        return;
                    }
                    if (!tmp.renameTo(destFile)) {
                        QLog.e(TAG, "Bundle download failed: rename failed " + tmp + " -> " + destFile);
                        tmp.delete();
                    }
                } catch (Exception e) {
                    QLog.e(e, TAG, "Bundle download failed");
                    tmp.delete();
                }
            }
        });
    }
}
