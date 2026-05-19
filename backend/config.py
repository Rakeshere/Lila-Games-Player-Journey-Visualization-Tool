from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "player_data"
MINIMAP_DIR = DATA_DIR / "minimaps"
IMAGE_SIZE = 1024

MAP_CONFIG = {
    "AmbroseValley": {
        "scale": 900,
        "origin_x": -370,
        "origin_z": -473,
        "image": "AmbroseValley_Minimap.png",
        "label": "Ambrose Valley",
    },
    "GrandRift": {
        "scale": 581,
        "origin_x": -290,
        "origin_z": -290,
        "image": "GrandRift_Minimap.png",
        "label": "Grand Rift",
    },
    "Lockdown": {
        "scale": 1000,
        "origin_x": -500,
        "origin_z": -500,
        "image": "Lockdown_Minimap.jpg",
        "label": "Lockdown",
    },
}

DATE_FOLDERS = [
    "February_10",
    "February_11",
    "February_12",
    "February_13",
    "February_14",
]

POSITION_EVENTS = {"Position", "BotPosition"}
KILL_EVENTS = {"Kill", "BotKill"}
DEATH_EVENTS = {"Killed", "BotKilled", "KilledByStorm"}
LOOT_EVENTS = {"Loot"}
STORM_EVENTS = {"KilledByStorm"}
