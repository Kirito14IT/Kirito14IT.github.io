import json
import tempfile
import unittest
from pathlib import Path

import build_atlas


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


if __name__ == "__main__":
    unittest.main()
