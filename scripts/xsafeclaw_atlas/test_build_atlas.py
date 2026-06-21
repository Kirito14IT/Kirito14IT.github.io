import json
import tempfile
import unittest
from pathlib import Path

import build_atlas

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ATLAS_PAGE = PROJECT_ROOT / "public" / "XSafeClaw" / "index.html"


class BuildAtlasTest(unittest.TestCase):
    def test_aggregate_profiles_without_publishing_raw_logins(self):
        profiles = [
            {
                "login": "alice",
                "location": "Shanghai, China",
                "company": "Fudan University",
                "name": "Alice",
            },
            {
                "login": "bob",
                "location": "Beijing",
                "company": "@Tsinghua University",
                "name": "Bob",
            },
            {
                "login": "carol",
                "location": "San Francisco Bay Area",
                "company": "OpenAI",
                "name": "Carol",
            },
            {
                "login": "dave",
                "location": "",
                "company": "",
                "name": "Dave",
            },
        ]

        atlas = build_atlas.aggregate_profiles(profiles, generated="2026-06-21")

        self.assertEqual(atlas["repo"], "XSafeAI/XSafeClaw")
        self.assertEqual(atlas["generated"], "2026-06-21")
        self.assertEqual(atlas["totalStars"], 4)
        self.assertEqual(atlas["located"], 3)
        self.assertEqual(atlas["schoolCount"], 2)
        self.assertEqual(atlas["companyCount"], 1)
        self.assertEqual(atlas["countryCount"], 2)
        self.assertEqual([city["zh"] for city in atlas["cities"][:3]], ["北京", "上海", "旧金山"])
        self.assertEqual(atlas["schools"][0]["zh"], "复旦大学")
        self.assertEqual(atlas["companies"][0]["en"], "OpenAI")

        serialized = json.dumps(atlas, ensure_ascii=False)
        for raw_login in ("alice", "bob", "carol", "dave"):
            self.assertNotIn(raw_login, serialized)

    def test_write_data_js_uses_window_atlas_assignment(self):
        atlas = build_atlas.aggregate_profiles(
            [{"login": "alice", "location": "Shanghai", "company": "Fudan University"}],
            generated="2026-06-21",
        )

        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "data.js"
            build_atlas.write_data_js(atlas, output)

            content = output.read_text(encoding="utf-8")

        self.assertTrue(content.startswith("window.ATLAS="))
        self.assertTrue(content.endswith(";"))
        self.assertIn("XSafeAI/XSafeClaw", content)
        self.assertNotIn("alice", content)

    def test_static_atlas_page_uses_sovereignty_notice(self):
        html = ATLAS_PAGE.read_text(encoding="utf-8")

        self.assertIn("台湾是中华人民共和国领土，地图已按中国版图绘制，如有错漏之处请issue指出", html)
        self.assertNotIn("仅发布聚合统计，不发布 raw 用户列表", html)
        self.assertNotIn("仅发布聚合统计，不发布raw用户列表", html)

    def test_static_atlas_page_uses_distinct_security_constellation_design(self):
        html = ATLAS_PAGE.read_text(encoding="utf-8")

        for marker in (
            "sentinel-grid",
            "aurora-scan",
            "orbit-shell",
            "constellation-console",
            "threat-radar",
            "route-trails",
        ):
            self.assertIn(marker, html)

        for copied_marker in ("--gold", "var(--gold)", "论文之脊", "PaperSpine"):
            self.assertNotIn(copied_marker, html)


if __name__ == "__main__":
    unittest.main()
