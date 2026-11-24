"""Read the public dependency-aware probe and return a monitoring exit code."""
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

PROBE_URL = "https://taskmatch.ai/health/ready"


def main() -> int:
    request = Request(PROBE_URL, headers={"User-Agent": "TaskMatch-Readiness/1.0", "Accept": "application/json", "Cache-Control": "no-cache"})
    try:
        with urlopen(request, timeout=8) as response:
            if response.geturl() != PROBE_URL or response.status != 200:
                raise ValueError("unexpected target or status")
            data = json.loads(response.read(8193))
            if data.get("status") != "ready" or data.get("app") != "TaskMatch.ai":
                raise ValueError("unexpected readiness payload")
    except (HTTPError, URLError, OSError, ValueError, AttributeError) as error:
        print("TaskMatch readiness failed", type(error).__name__, file=sys.stderr)
        return 1
    print("TaskMatch public readiness OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
