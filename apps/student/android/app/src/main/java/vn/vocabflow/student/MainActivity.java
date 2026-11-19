package vn.vocabflow.student;

import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private SwipeRefreshLayout swipeRefresh;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Tích hợp Pull-To-Refresh Native bằng SwipeRefreshLayout
        swipeRefresh = findViewById(R.id.swipe_refresh_layout);
        if (swipeRefresh != null) {
            swipeRefresh.setColorSchemeResources(
                android.R.color.holo_blue_bright,
                android.R.color.holo_green_light,
                android.R.color.holo_orange_light,
                android.R.color.holo_red_light
            );

            swipeRefresh.setOnRefreshListener(() -> {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().reload();
                }
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (swipeRefresh != null) {
                        swipeRefresh.setRefreshing(false);
                    }
                }, 1500);
            });

            // Chỉ kích hoạt Pull-To-Refresh khi trang đang ở đỉnh (scrollY == 0)
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    webView.setOnScrollChangeListener((v, scrollX, scrollY, oldScrollX, oldScrollY) -> {
                        swipeRefresh.setEnabled(scrollY == 0);
                    });
                } else {
                    webView.getViewTreeObserver().addOnScrollChangedListener(() -> {
                        swipeRefresh.setEnabled(webView.getScrollY() == 0);
                    });
                }
            }
        }

        // 2. Xử lý Hardware Back Button chuẩn Native Android
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null && getBridge().getWebView().canGoBack()) {
                    getBridge().getWebView().goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }
}
