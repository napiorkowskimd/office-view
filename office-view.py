#!/usr/bin/env python3
import subprocess
import sys
import os

from uuid import uuid4

SERVER_URL = "https://napiorkowskim.xyz"

def which(pgm):
    path=os.getenv('PATH')
    for p in path.split(os.path.pathsep):
        p=os.path.join(p,pgm)
        if os.path.exists(p) and os.access(p,os.X_OK):
            return p
    return None

def find_chromium_binary():
    names = ["chromium", "chromium-browser", "google-chrome-stable"]
    for name in names:
        p = which(name)
        if p is not None:
            return p
    return None

if __name__ == "__main__":
    binary = find_chromium_binary()
    if not binary:
        print("Could not find chromium binary :(, exiting")
        sys.exit(1)

    roomId = uuid4().hex
    url = f'{SERVER_URL}/sender.html?roomId={roomId}'
    client_url = f'{SERVER_URL}/client.html?roomId={roomId}'
    print("Please open", client_url, "in browser")
    subprocess.run([
        binary,
        "--headless",
        "--disable-gpu",
        "--remote-debugging-port=9234",
        "--use-fake-ui-for-media-stream",
        "--user-data-dir=/tmp",
        "--flag-switches-begin",
        "--disable-features=WebRtcHideLocalIpsWithMdns",
        "--flag-switches-end",
        url
    ])