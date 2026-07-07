#!/usr/bin/env python3
"""Build aggregate stargazer atlas data for XSafeClaw.

The published data intentionally contains only aggregate counts. Raw GitHub
logins and profile details are used in memory during the build and then dropped.
"""

from __future__ import annotations

import collections
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

REPO = "XSafeAI/XSafeClaw"
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
DEFAULT_OUTPUT = PROJECT_ROOT / "public" / "XSafeClaw" / "data.js"


CITIES: dict[str, tuple[float, float, str, str]] = {
    "Beijing": (116.40, 39.90, "China", "北京"),
    "Shanghai": (121.47, 31.23, "China", "上海"),
    "Hangzhou": (120.15, 30.27, "China", "杭州"),
    "Shenzhen": (114.06, 22.54, "China", "深圳"),
    "Guangzhou": (113.26, 23.13, "China", "广州"),
    "Nanjing": (118.80, 32.06, "China", "南京"),
    "Wuhan": (114.31, 30.59, "China", "武汉"),
    "Chengdu": (104.07, 30.67, "China", "成都"),
    "Chongqing": (106.55, 29.56, "China", "重庆"),
    "Xi'an": (108.94, 34.34, "China", "西安"),
    "Hefei": (117.28, 31.86, "China", "合肥"),
    "Tianjin": (117.20, 39.08, "China", "天津"),
    "Changsha": (112.94, 28.23, "China", "长沙"),
    "Harbin": (126.63, 45.80, "China", "哈尔滨"),
    "Changchun": (125.32, 43.88, "China", "长春"),
    "Shenyang": (123.43, 41.80, "China", "沈阳"),
    "Dalian": (121.61, 38.91, "China", "大连"),
    "Qingdao": (120.38, 36.07, "China", "青岛"),
    "Jinan": (117.12, 36.65, "China", "济南"),
    "Zhengzhou": (113.63, 34.75, "China", "郑州"),
    "Xiamen": (118.09, 24.48, "China", "厦门"),
    "Fuzhou": (119.30, 26.08, "China", "福州"),
    "Kunming": (102.83, 24.88, "China", "昆明"),
    "Nanchang": (115.86, 28.68, "China", "南昌"),
    "Ningbo": (121.55, 29.88, "China", "宁波"),
    "Hong Kong": (114.17, 22.32, "China", "香港"),
    "Taipei": (121.56, 25.03, "China", "台北"),
    "China (city unspecified)": (103.50, 36.50, "China", "中国·未注明城市"),
    "Singapore": (103.85, 1.29, "Singapore", "新加坡"),
    "Tokyo": (139.69, 35.69, "Japan", "东京"),
    "Seoul": (126.98, 37.57, "South Korea", "首尔"),
    "London": (-0.13, 51.51, "United Kingdom", "伦敦"),
    "Paris": (2.35, 48.86, "France", "巴黎"),
    "Berlin": (13.40, 52.52, "Germany", "柏林"),
    "Munich": (11.58, 48.14, "Germany", "慕尼黑"),
    "Sydney": (151.21, -33.87, "Australia", "悉尼"),
    "Melbourne": (144.96, -37.81, "Australia", "墨尔本"),
    "San Francisco": (-122.42, 37.77, "United States", "旧金山"),
    "San Jose": (-121.89, 37.34, "United States", "圣何塞"),
    "Los Angeles": (-118.24, 34.05, "United States", "洛杉矶"),
    "Seattle": (-122.33, 47.61, "United States", "西雅图"),
    "New York": (-74.01, 40.71, "United States", "纽约"),
    "Boston": (-71.06, 42.36, "United States", "波士顿"),
    "Chicago": (-87.63, 41.88, "United States", "芝加哥"),
    "USA (city unspecified)": (-98.50, 39.80, "United States", "美国·未注明城市"),
    "Toronto": (-79.38, 43.65, "Canada", "多伦多"),
    "Vancouver": (-123.12, 49.28, "Canada", "温哥华"),
    "Sao Paulo": (-46.63, -23.55, "Brazil", "圣保罗"),
    "New Delhi": (77.21, 28.61, "India", "新德里"),
    "Bangkok": (100.50, 13.76, "Thailand", "曼谷"),
    "Kuala Lumpur": (101.69, 3.14, "Malaysia", "吉隆坡"),
    "Jakarta": (106.85, -6.21, "Indonesia", "雅加达"),
}


LOCATION_PATTERNS: dict[str, str] = {
    "tsinghua": "Beijing",
    "pku": "Beijing",
    "beijing": "Beijing",
    "北京": "Beijing",
    "fudan": "Shanghai",
    "shanghai": "Shanghai",
    "上海": "Shanghai",
    "zhejiang": "Hangzhou",
    "hangzhou": "Hangzhou",
    "杭州": "Hangzhou",
    "shenzhen": "Shenzhen",
    "深圳": "Shenzhen",
    "guangzhou": "Guangzhou",
    "广州": "Guangzhou",
    "nanjing": "Nanjing",
    "南京": "Nanjing",
    "wuhan": "Wuhan",
    "武汉": "Wuhan",
    "chengdu": "Chengdu",
    "成都": "Chengdu",
    "chongqing": "Chongqing",
    "重庆": "Chongqing",
    "xi'an": "Xi'an",
    "xian": "Xi'an",
    "西安": "Xi'an",
    "hefei": "Hefei",
    "合肥": "Hefei",
    "tianjin": "Tianjin",
    "天津": "Tianjin",
    "changsha": "Changsha",
    "长沙": "Changsha",
    "harbin": "Harbin",
    "哈尔滨": "Harbin",
    "changchun": "Changchun",
    "长春": "Changchun",
    "shenyang": "Shenyang",
    "沈阳": "Shenyang",
    "dalian": "Dalian",
    "大连": "Dalian",
    "qingdao": "Qingdao",
    "青岛": "Qingdao",
    "jinan": "Jinan",
    "济南": "Jinan",
    "zhengzhou": "Zhengzhou",
    "郑州": "Zhengzhou",
    "xiamen": "Xiamen",
    "厦门": "Xiamen",
    "fuzhou": "Fuzhou",
    "福州": "Fuzhou",
    "kunming": "Kunming",
    "昆明": "Kunming",
    "nanchang": "Nanchang",
    "南昌": "Nanchang",
    "ningbo": "Ningbo",
    "宁波": "Ningbo",
    "hong kong": "Hong Kong",
    "香港": "Hong Kong",
    "taipei": "Taipei",
    "台湾": "Taipei",
    "taiwan": "Taipei",
    "china": "China (city unspecified)",
    "中国": "China (city unspecified)",
    "singapore": "Singapore",
    "新加坡": "Singapore",
    "tokyo": "Tokyo",
    "东京": "Tokyo",
    "seoul": "Seoul",
    "london": "London",
    "paris": "Paris",
    "berlin": "Berlin",
    "munich": "Munich",
    "sydney": "Sydney",
    "melbourne": "Melbourne",
    "bay area": "San Francisco",
    "san francisco": "San Francisco",
    "san jose": "San Jose",
    "los angeles": "Los Angeles",
    "seattle": "Seattle",
    "new york": "New York",
    "boston": "Boston",
    "chicago": "Chicago",
    "united states": "USA (city unspecified)",
    "usa": "USA (city unspecified)",
    "canada": "Toronto",
    "toronto": "Toronto",
    "vancouver": "Vancouver",
    "brazil": "Sao Paulo",
    "sao paulo": "Sao Paulo",
    "india": "New Delhi",
    "bangkok": "Bangkok",
    "thailand": "Bangkok",
    "kuala lumpur": "Kuala Lumpur",
    "malaysia": "Kuala Lumpur",
    "jakarta": "Jakarta",
    "indonesia": "Jakarta",
}


ORG_ALIASES: dict[str, tuple[str, str, str, str | None]] = {
    "fudan": ("Fudan University", "复旦大学", "school", "Shanghai"),
    "fudan university": ("Fudan University", "复旦大学", "school", "Shanghai"),
    "tsinghua": ("Tsinghua University", "清华大学", "school", "Beijing"),
    "tsinghua university": ("Tsinghua University", "清华大学", "school", "Beijing"),
    "pku": ("Peking University", "北京大学", "school", "Beijing"),
    "peking university": ("Peking University", "北京大学", "school", "Beijing"),
    "zhejiang university": ("Zhejiang University", "浙江大学", "school", "Hangzhou"),
    "zju": ("Zhejiang University", "浙江大学", "school", "Hangzhou"),
    "shanghai jiao tong university": ("Shanghai Jiao Tong University", "上海交通大学", "school", "Shanghai"),
    "sjtu": ("Shanghai Jiao Tong University", "上海交通大学", "school", "Shanghai"),
    "ustc": ("University of Science and Technology of China", "中国科学技术大学", "school", "Hefei"),
    "university of science and technology of china": (
        "University of Science and Technology of China",
        "中国科学技术大学",
        "school",
        "Hefei",
    ),
    "nanjing university": ("Nanjing University", "南京大学", "school", "Nanjing"),
    "nju": ("Nanjing University", "南京大学", "school", "Nanjing"),
    "wuhan university": ("Wuhan University", "武汉大学", "school", "Wuhan"),
    "whu": ("Wuhan University", "武汉大学", "school", "Wuhan"),
    "xidian university": ("Xidian University", "西安电子科技大学", "school", "Xi'an"),
    "xidian": ("Xidian University", "西安电子科技大学", "school", "Xi'an"),
    "openai": ("OpenAI", "OpenAI", "company", "San Francisco"),
    "microsoft": ("Microsoft", "Microsoft", "company", "Seattle"),
    "google": ("Google", "Google", "company", "San Francisco"),
    "meta": ("Meta", "Meta", "company", "San Francisco"),
    "anthropic": ("Anthropic", "Anthropic", "company", "San Francisco"),
}

SKIP_ORGS = {"", "none", "n/a", "-", "no", "student", "individual", "freelance", "home"}
SCHOOL_KEYWORDS = (
    "university",
    "college",
    "institute",
    "academy",
    "school",
    "laboratory",
    "lab",
    "cas",
    "大学",
    "学院",
    "研究所",
    "研究院",
    "实验室",
)
COMPANY_KEYWORDS = (
    "inc",
    "ltd",
    "llc",
    "corp",
    "company",
    "technology",
    "software",
    "studio",
    "group",
    "公司",
    "科技",
    "集团",
)


def api_get(url: str, token: str | None, retries: int = 3) -> Any:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "xsafeclaw-stargazer-atlas",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    for attempt in range(retries):
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return None
            if exc.code in {403, 429} and attempt < retries - 1:
                time.sleep(20 * (attempt + 1))
                continue
            raise
        except OSError:
            if attempt == retries - 1:
                raise
            time.sleep(5)
    return None


def fetch_stargazer_logins(token: str | None) -> list[str]:
    logins: list[str] = []
    page = 1
    while True:
        batch = api_get(
            f"https://api.github.com/repos/{REPO}/stargazers?per_page=100&page={page}",
            token,
        )
        if not batch:
            break
        logins.extend(user["login"] for user in batch if user.get("login"))
        if len(batch) < 100:
            break
        page += 1
    return logins


def fetch_profile(login: str, token: str | None) -> dict[str, Any]:
    profile = api_get(f"https://api.github.com/users/{login}", token)
    if not profile:
        return {"login": login, "location": "", "company": "", "name": ""}
    return {
        "login": profile.get("login") or login,
        "location": profile.get("location") or "",
        "company": profile.get("company") or "",
        "name": profile.get("name") or "",
    }


def fetch_profiles(token: str | None) -> list[dict[str, Any]]:
    logins = fetch_stargazer_logins(token)
    profiles: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_profile, login, token): login for login in logins}
        for future in as_completed(futures):
            profiles.append(future.result())
    order = {login: index for index, login in enumerate(logins)}
    profiles.sort(key=lambda profile: order.get(profile.get("login", ""), 10**9))
    return profiles


def has_cjk(value: str) -> bool:
    return bool(re.search(r"[\u4e00-\u9fff]", value))


def title_org(value: str) -> str:
    if value.isupper() and len(value) <= 8:
        return value
    if value.islower():
        return value.title()
    return value


def normalize_org(raw: str | None) -> dict[str, str | None] | None:
    if not raw:
        return None
    value = re.sub(r"\s+", " ", raw.strip().strip(".,;")).lstrip("@")
    key = value.lower()
    key = re.split(r"[,;（(]", key)[0].strip()
    if key in SKIP_ORGS:
        return None
    if key in ORG_ALIASES:
        en, zh, org_type, city = ORG_ALIASES[key]
        return {"en": en, "zh": zh, "type": org_type, "city": city}

    org_type = "school" if any(keyword in key for keyword in SCHOOL_KEYWORDS) else "company"
    if org_type == "company" and not any(keyword in key for keyword in COMPANY_KEYWORDS):
        org_type = "company"
    display = title_org(value)
    return {"en": display, "zh": display, "type": org_type, "city": None}


def locate_city(location: str | None) -> str | None:
    if not location:
        return None
    low = location.lower()
    for pattern in sorted(LOCATION_PATTERNS, key=len, reverse=True):
        if pattern in {"us", "cn", "usa"}:
            if re.search(rf"(?<![a-z]){re.escape(pattern)}(?![a-z])", low):
                return LOCATION_PATTERNS[pattern]
            continue
        if pattern in low:
            return LOCATION_PATTERNS[pattern]
    return None


def city_sort_key(city: dict[str, Any]) -> tuple[int, bool, str]:
    return (-city["count"], city["country"] != "China", city["name"])


def aggregate_profiles(profiles: list[dict[str, Any]], generated: str | None = None) -> dict[str, Any]:
    city_agg: dict[str, dict[str, Any]] = {}
    org_agg: dict[str, dict[str, Any]] = {}
    located = 0
    with_org = 0

    for profile in profiles:
        org = normalize_org(profile.get("company"))
        if org:
            with_org += 1

        city_key = org.get("city") if org and org.get("city") else locate_city(profile.get("location"))
        if org:
            org_key = str(org["en"])
            org_item = org_agg.setdefault(
                org_key,
                {
                    "en": org["en"],
                    "zh": org["zh"],
                    "type": org["type"],
                    "count": 0,
                    "cities": collections.Counter(),
                },
            )
            org_item["count"] += 1
            if city_key:
                org_item["cities"][city_key] += 1

        if not city_key or city_key not in CITIES:
            continue

        located += 1
        lng, lat, country, zh = CITIES[city_key]
        city = city_agg.setdefault(
            city_key,
            {
                "name": city_key,
                "zh": zh,
                "lng": lng,
                "lat": lat,
                "country": country,
                "count": 0,
                "schools": collections.Counter(),
                "companies": collections.Counter(),
            },
        )
        city["count"] += 1
        if org:
            display = str(org["zh"] if has_cjk(str(org["zh"])) else org["en"])
            bucket = city["schools"] if org["type"] == "school" else city["companies"]
            bucket[display] += 1

    for city in city_agg.values():
        city["schools"] = sorted(city["schools"].items(), key=lambda item: (-item[1], item[0]))
        city["companies"] = sorted(city["companies"].items(), key=lambda item: (-item[1], item[0]))

    schools: list[dict[str, Any]] = []
    companies: list[dict[str, Any]] = []
    for org in org_agg.values():
        main_city = org["cities"].most_common(1)[0][0] if org["cities"] else None
        item = {
            "en": org["en"],
            "zh": org["zh"],
            "count": org["count"],
            "city": CITIES[main_city][3] if main_city else "",
        }
        if org["type"] == "school":
            schools.append(item)
        else:
            companies.append(item)

    schools.sort(key=lambda item: (-item["count"], item["zh"]))
    companies.sort(key=lambda item: (-item["count"], item["en"]))

    countries = collections.Counter()
    for city in city_agg.values():
        countries[city["country"]] += city["count"]

    return {
        "repo": REPO,
        "generated": generated or dt.date.today().isoformat(),
        "totalStars": len(profiles),
        "located": located,
        "withOrg": with_org,
        "schoolCount": len(schools),
        "companyCount": len(companies),
        "countryCount": len(countries),
        "cities": sorted(city_agg.values(), key=city_sort_key),
        "schools": schools,
        "companies": companies,
        "countries": dict(countries.most_common()),
    }


def write_data_js(atlas: dict[str, Any], output: Path = DEFAULT_OUTPUT) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        "window.ATLAS=" + json.dumps(atlas, ensure_ascii=False, separators=(",", ":")) + ";",
        encoding="utf-8",
    )


def use_cached_data(reason: BaseException | str, output: Path = DEFAULT_OUTPUT) -> bool:
    """Keep the last committed atlas when GitHub API refresh is unavailable.

    The atlas is an optional visualization artifact. A temporary API 403/429,
    network timeout, or public API policy change should not block the whole
    GitHub Pages deployment when a committed data file already exists.
    """
    if not output.exists():
        return False
    print(
        f"Warning: XSafeClaw atlas refresh failed; using cached {output.relative_to(PROJECT_ROOT)}. "
        f"Reason: {reason}",
        file=sys.stderr,
    )
    return True


def main() -> int:
    token = os.environ.get("GITHUB_TOKEN", "").strip() or None
    try:
        profiles = fetch_profiles(token)
    except (OSError, urllib.error.HTTPError) as exc:
        return 0 if use_cached_data(exc) else 1
    if not profiles:
        return 0 if use_cached_data("no stargazer profiles fetched") else 1
    atlas = aggregate_profiles(profiles)
    write_data_js(atlas)
    print(
        "Generated XSafeClaw atlas: "
        f"stars={atlas['totalStars']} located={atlas['located']} "
        f"cities={len(atlas['cities'])} schools={atlas['schoolCount']} "
        f"companies={atlas['companyCount']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
