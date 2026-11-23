package vn.vocabflow.student;

import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.MotionEvent;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private SwipeRefreshLayout swipeRefresh;
    private long pullStartTime = 0;

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (ev.getActionMasked() == MotionEvent.ACTION_DOWN) {
            pullStartTime = System.currentTimeMillis();
        }
        return super.dispatchTouchEvent(ev);
    }

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

            // Cấu hình khoảng cách kéo kích hoạt (strong pull distance)
            // Thay vì ngưỡng mặc định chỉ ~64dp (rất dễ bị kích hoạt vô tình khi cuộn tới đầu trang),
            // ta yêu cầu kéo mạnh xuống khoảng 240dp và giữ tối thiểu 450ms mới kích hoạt reload.
            float density = getResources().getDisplayMetrics().density;
            int strongTriggerDistance = (int) (240 * density);
            swipeRefresh.setDistanceToTriggerSync(strongTriggerDistance);
            swipeRefresh.setSlingshotDistance((int) (300 * density));

            // Chỉ cho phép SwipeRefreshLayout nhận cử chỉ khi WebView đã thực sự ở đỉnh trang (không thể cuộn lên nữa)
            swipeRefresh.setOnChildScrollUpCallback((parent, child) -> {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    return getBridge().getWebView().canScrollVertically(-1);
                }
                return false;
            });

            swipeRefresh.setOnRefreshListener(() -> {
                long pullDuration = System.currentTimeMillis() - pullStartTime;
                // Nếu người dùng chỉ vuốt nhanh (flick) dưới 450ms thì huỷ bỏ reload, tránh vô tình tải lại trang
                if (pullDuration < 450) {
                    swipeRefresh.setRefreshing(false);
                    return;
                }

                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().reload();
                }
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (swipeRefresh != null) {
                        swipeRefresh.setRefreshing(false);
                    }
                }, 1500);
            });
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
