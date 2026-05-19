from backend.config import IMAGE_SIZE, MAP_CONFIG


def world_to_pixel(map_id: str, x: float, z: float) -> tuple[float, float]:
    cfg = MAP_CONFIG[map_id]
    u = (x - cfg["origin_x"]) / cfg["scale"]
    v = (z - cfg["origin_z"]) / cfg["scale"]
    pixel_x = u * IMAGE_SIZE
    pixel_y = (1.0 - v) * IMAGE_SIZE
    return round(pixel_x, 2), round(pixel_y, 2)


def is_bot_user(user_id: str) -> bool:
    return user_id.isdigit()
