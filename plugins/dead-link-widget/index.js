// Expo config plugin: Dead Link Saver Android home-screen widget.
//
// What it installs (Android only, applied at prebuild / EAS build time):
// - Manifest <receiver> for DeadLinkWidgetProvider (official docs use
//   android:exported="false" for widget providers)
// - Kotlin provider: reads widget-data.json from the app files dir (written
//   by services/widgetSync.ts, no JS bridge needed) and renders the latest
//   3 links. Row taps deep-link to deadlinksaver://link/<id>; the save
//   button opens deadlinksaver:// and the foreground ClipboardPrompt handles
//   the clipboard (Android 10+ blocks background clipboard reads, so the
//   widget never reads it itself).
// - Layout / drawable / widget-info / strings resources.
//
// Refresh: updatePeriodMillis (30 min, OS-enforced minimum). The JSON file
// is rewritten on every link change, so the widget is at most one tick stale.
const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PROVIDER_KT = `package __PKG__.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.View
import android.widget.RemoteViews
import __PKG__.R
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class DeadLinkWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        for (widgetId in ids) updateWidget(context, manager, widgetId)
    }

    private fun updateWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.widget_dead_links)
        val links = readLinks(context)

        views.setOnClickPendingIntent(R.id.widget_header, appIntent(context, "deadlinksaver://", 200))
        views.setOnClickPendingIntent(R.id.widget_save_btn, appIntent(context, "deadlinksaver://", 201))

        val rows = intArrayOf(R.id.widget_row_0, R.id.widget_row_1, R.id.widget_row_2)
        val titles = intArrayOf(R.id.widget_title_0, R.id.widget_title_1, R.id.widget_title_2)
        val metas = intArrayOf(R.id.widget_meta_0, R.id.widget_meta_1, R.id.widget_meta_2)
        var visible = 0
        for (i in rows.indices) {
            val item = links.optJSONObject(i)
            if (item == null) {
                views.setViewVisibility(rows[i], View.GONE)
            } else {
                visible += 1
                views.setViewVisibility(rows[i], View.VISIBLE)
                val title = item.optString("title", "")
                views.setTextViewText(titles[i], if (title.isEmpty()) item.optString("url", "") else title)
                val meta = if (item.optBoolean("isDead", false)) "dead - tap for archive" else "tap to open"
                views.setTextViewText(metas[i], meta)
                views.setOnClickPendingIntent(rows[i], appIntent(context, "deadlinksaver://link/" + item.optString("id", ""), 100 + i))
            }
        }
        views.setViewVisibility(R.id.widget_empty, if (visible == 0) View.VISIBLE else View.GONE)
        manager.updateAppWidget(widgetId, views)
    }

    private fun readLinks(context: Context): JSONArray {
        try {
            val file = File(context.filesDir, "widget-data.json")
            if (file.exists()) {
                val links = JSONObject(file.readText()).optJSONArray("links")
                if (links != null) return links
            }
        } catch (_: Exception) {
        }
        return JSONArray()
    }

    private fun appIntent(context: Context, uri: String, code: Int): PendingIntent {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
        intent.setPackage(context.packageName)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        return PendingIntent.getActivity(context, code, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }
}
`;

const LAYOUT_XML = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@drawable/widget_dead_links_bg"
    android:padding="12dp">

    <LinearLayout
        android:id="@+id/widget_header"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="horizontal"
        android:gravity="center_vertical">

        <TextView
            android:layout_width="0dp"
            android:layout_weight="1"
            android:layout_height="wrap_content"
            android:text="Dead Link Saver"
            android:textColor="#FFFBEB"
            android:textSize="14sp"
            android:textStyle="bold" />

        <Button
            android:id="@+id/widget_save_btn"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:minWidth="0dp"
            android:minHeight="0dp"
            android:paddingLeft="12dp"
            android:paddingRight="12dp"
            android:paddingTop="6dp"
            android:paddingBottom="6dp"
            android:text="+ Save"
            android:textSize="12sp"
            android:textColor="#1C1917"
            android:backgroundTint="#F59E0B" />
    </LinearLayout>

    <LinearLayout
        android:id="@+id/widget_row_0"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:paddingTop="8dp"
        android:paddingBottom="4dp">

        <TextView
            android:id="@+id/widget_title_0"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#FFFBEB"
            android:textSize="13sp"
            android:textStyle="bold"
            android:singleLine="true"
            android:ellipsize="end" />

        <TextView
            android:id="@+id/widget_meta_0"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#A8A29E"
            android:textSize="11sp"
            android:singleLine="true" />
    </LinearLayout>

    <LinearLayout
        android:id="@+id/widget_row_1"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:paddingTop="4dp"
        android:paddingBottom="4dp">

        <TextView
            android:id="@+id/widget_title_1"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#FFFBEB"
            android:textSize="13sp"
            android:textStyle="bold"
            android:singleLine="true"
            android:ellipsize="end" />

        <TextView
            android:id="@+id/widget_meta_1"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#A8A29E"
            android:textSize="11sp"
            android:singleLine="true" />
    </LinearLayout>

    <LinearLayout
        android:id="@+id/widget_row_2"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:paddingTop="4dp"
        android:paddingBottom="4dp">

        <TextView
            android:id="@+id/widget_title_2"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#FFFBEB"
            android:textSize="13sp"
            android:textStyle="bold"
            android:singleLine="true"
            android:ellipsize="end" />

        <TextView
            android:id="@+id/widget_meta_2"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="#A8A29E"
            android:textSize="11sp"
            android:singleLine="true" />
    </LinearLayout>

    <TextView
        android:id="@+id/widget_empty"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:paddingTop="8dp"
        android:text="No links yet - save one in the app"
        android:textColor="#A8A29E"
        android:textSize="12sp"
        android:visibility="gone" />
</LinearLayout>
`;

const BG_XML = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#221C15" />
    <stroke android:width="1dp" android:color="#3A3128" />
    <corners android:radius="16dp" />
</shape>
`;

const INFO_XML = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:targetCellWidth="4"
    android:targetCellHeight="2"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_dead_links"
    android:previewLayout="@layout/widget_dead_links"
    android:description="@string/dead_link_widget_desc"
    android:resizeMode="horizontal"
    android:widgetCategory="home_screen" />
`;

const STRINGS_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="dead_link_widget_desc">Latest saved links with one-tap open</string>
</resources>
`;

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const withDeadLinkWidget = (config) => {
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application && cfg.modResults.manifest.application[0];
    if (!app) return cfg;
    app.receiver = app.receiver || [];
    const exists = app.receiver.some(
      (r) => r.$ && r.$["android:name"] === ".widget.DeadLinkWidgetProvider"
    );
    if (!exists) {
      app.receiver.push({
        $: {
          "android:name": ".widget.DeadLinkWidgetProvider",
          "android:exported": "false",
          "android:label": "Dead links",
        },
        "intent-filter": [
          { action: [{ $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" } }] },
        ],
        "meta-data": [
          {
            $: {
              "android:name": "android.appwidget.provider",
              "android:resource": "@xml/dead_link_widget_info",
            },
          },
        ],
      });
    }
    return cfg;
  });

  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const root = cfg.modRequest.platformProjectRoot;
      const pkg = (cfg.android && cfg.android.package) || "com.deadlinksaver.app";
      const src = path.join(root, "app/src/main/java", ...pkg.split("."), "widget");
      const res = path.join(root, "app/src/main/res");
      writeFile(
        path.join(src, "DeadLinkWidgetProvider.kt"),
        PROVIDER_KT.replace(/__PKG__/g, pkg)
      );
      writeFile(path.join(res, "layout/widget_dead_links.xml"), LAYOUT_XML);
      writeFile(path.join(res, "drawable/widget_dead_links_bg.xml"), BG_XML);
      writeFile(path.join(res, "xml/dead_link_widget_info.xml"), INFO_XML);
      writeFile(path.join(res, "values/dead_link_widget_strings.xml"), STRINGS_XML);
      return cfg;
    },
  ]);

  return config;
};

module.exports = withDeadLinkWidget;
