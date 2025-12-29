package com.choicely.sdk.rn;

import androidx.annotation.NonNull;

import com.choicely.sdk.service.log.QLog;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.concurrent.CompletableFuture;
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
     * Download and commit bundle to destFile.
     *
     * @param async if true, returns immediately and completes future later.
     *              if false, blocks current thread until done, but still returns a completed future.
     *
     * @return CompletableFuture<Boolean> true if this call won and committed; false otherwise.
     */
    @NonNull
    public static CompletableFuture<Boolean> download(@NonNull final String url,
                                                      @NonNull final File destFile,
                                                      final boolean async) {
        if (!async && android.os.Looper.getMainLooper() == android.os.Looper.myLooper()) {
            throw new IllegalStateException("Sync download called on main thread");
        }
        final CompletableFuture<Boolean> future = new CompletableFuture<>();
        final File parent = destFile.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) {
            QLog.e(TAG, "Bundle download failed: could not create dir " + parent);
            future.complete(false);
            return future;
        }
        final long token = System.nanoTime();
        LAST_TOKEN.set(token);
        final File tmp = new File(parent, tmpName(destFile.getName(), token));
        final Request req = new Request.Builder().url(url).get().build();
        final Call call = HTTP.newCall(req);
        if (async) {
            call.enqueue(new Callback() {
                @Override
                public void onFailure(@NonNull final Call call, @NonNull final java.io.IOException e) {
                    QLog.e(e, TAG, "Bundle download failed");
                    tmp.delete();
                    future.complete(false);
                }

                @Override
                public void onResponse(@NonNull final Call call, @NonNull final Response response) {
                    handleResponse(response, tmp, destFile, token, future);
                }
            });
            return future;
        }
        try (Response response = call.execute()) {
            handleResponse(response, tmp, destFile, token, future);
        } catch (Exception e) {
            QLog.e(e, TAG, "Bundle download failed");
            tmp.delete();
            future.complete(false);
        }
        return future;
    }

    private static void handleResponse(@NonNull final Response response,
                                       @NonNull final File tmp,
                                       @NonNull final File destFile,
                                       final long token,
                                       @NonNull final CompletableFuture<Boolean> future) {
        try (response) {
            if (!response.isSuccessful()) {
                QLog.e(TAG, "Bundle download failed: HTTP " + response.code());
                tmp.delete();
                future.complete(false);
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
                future.complete(false);
                return;
            }
            if (destFile.exists() && !destFile.delete()) {
                QLog.e(TAG, "Bundle download failed: could not delete old file " + destFile);
                tmp.delete();
                future.complete(false);
                return;
            }
            if (!tmp.renameTo(destFile)) {
                QLog.e(TAG, "Bundle download failed: rename failed " + tmp + " -> " + destFile);
                tmp.delete();
                future.complete(false);
                return;
            }
            future.complete(true);
        } catch (Exception e) {
            QLog.e(e, TAG, "Bundle download failed");
            tmp.delete();
            future.complete(false);
        }
    }

    @NonNull
    private static String tmpName(@NonNull final String baseName, final long token) {
        return baseName
                + "."
                + Integer.toHexString(ThreadLocalRandom.current().nextInt())
                + "-"
                + Long.toHexString(token)
                + ".tmp";
    }
}
