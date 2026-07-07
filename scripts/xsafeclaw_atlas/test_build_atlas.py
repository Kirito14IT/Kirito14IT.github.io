import json
import tempfile
import unittest
import urllib.error
from pathlib import Path

import build_atlas

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ATLAS_PAGE = PROJECT_ROOT / "public" / "XSafeClaw" / "index.html"
ATLAS_ICON = PROJECT_ROOT / "public" / "XSafeClaw" / "shield-check.svg"


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

    def test_main_uses_cached_data_when_github_api_is_forbidden(self):
        original_output = build_atlas.DEFAULT_OUTPUT
        original_fetch_profiles = build_atlas.fetch_profiles
        try:
            with tempfile.TemporaryDirectory() as tmp:
                cache = Path(tmp) / "data.js"
                cache.write_text("window.ATLAS={\"repo\":\"XSafeAI/XSafeClaw\"};", encoding="utf-8")
                build_atlas.DEFAULT_OUTPUT = cache

                def raise_forbidden(_token):
                    raise urllib.error.HTTPError(
                        "https://api.github.com/repos/XSafeAI/XSafeClaw/stargazers",
                        403,
                        "Forbidden",
                        {},
                        None,
                    )

                build_atlas.fetch_profiles = raise_forbidden

                self.assertEqual(build_atlas.main(), 0)
                self.assertEqual(cache.read_text(encoding="utf-8"), "window.ATLAS={\"repo\":\"XSafeAI/XSafeClaw\"};")
        finally:
            build_atlas.DEFAULT_OUTPUT = original_output
            build_atlas.fetch_profiles = original_fetch_profiles

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

    def test_static_atlas_page_uses_agent_security_title_and_svg_icon(self):
        html = ATLAS_PAGE.read_text(encoding="utf-8")

        self.assertIn("智能体安全", html)
        self.assertIn("shield-check.svg", html)
        self.assertNotIn("全球安全星域", html)
        self.assertTrue(ATLAS_ICON.exists())

    def test_static_atlas_page_uses_comic_tone_without_south_china_sea_overlay(self):
        html = ATLAS_PAGE.read_text(encoding="utf-8")

        self.assertIn("ZCOOL KuaiLe", html)
        self.assertIn("border-radius: 999px", html)
        self.assertNotIn("--text: #edf7ff", html)
        self.assertNotIn("color:#edf7ff", html)
        self.assertNotIn("southChinaSeaDashes", html)
        self.assertNotIn("south-china-sea-dash", html)
        self.assertNotIn("南海诸岛", html)


if __name__ == "__main__":
    unittest.main()
